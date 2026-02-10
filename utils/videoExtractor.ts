import { Ingredient } from "@/types";
import { createIngredientFromText } from "@/utils/recipeExtractor";

export interface VideoMetadata {
  title: string;
  thumbnailUrl: string;
  source: string;
  videoId: string;
  platform: "youtube" | "instagram" | "unknown";
}

export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

export interface VideoRecipeResult {
  metadata: VideoMetadata;
  transcript: TranscriptSegment[];
  fullText: string;
  ingredients: Ingredient[];
}

function extractInstagramReelId(url: string): string | null {
  const patterns = [
    /instagram\.com\/reel\/([a-zA-Z0-9_-]+)/,
    /instagram\.com\/reels\/([a-zA-Z0-9_-]+)/,
    /instagram\.com\/p\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

export function isInstagramUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes("instagram.com/reel") ||
    lower.includes("instagram.com/reels") ||
    lower.includes("instagram.com/p/")
  );
}

export function isVideoUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes("youtube.com") ||
    lower.includes("youtu.be") ||
    lower.includes("youtube.com/shorts") ||
    isInstagramUrl(url)
  );
}

export function getVideoPlatform(url: string): "youtube" | "instagram" | "unknown" {
  if (isInstagramUrl(url)) return "instagram";
  if (url.toLowerCase().includes("youtube.com") || url.toLowerCase().includes("youtu.be")) return "youtube";
  return "unknown";
}

async function fetchYouTubeMetadata(videoId: string): Promise<VideoMetadata> {
  console.log("[VideoExtractor] Fetching oEmbed metadata for:", videoId);
  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;

  try {
    const response = await fetch(oembedUrl);
    if (response.ok) {
      const data = await response.json();
      console.log("[VideoExtractor] oEmbed title:", data.title);
      return {
        title: data.title ?? "Untitled Video",
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        source: "youtube.com",
        videoId,
        platform: "youtube",
      };
    }
  } catch (err) {
    console.log("[VideoExtractor] oEmbed fetch failed:", err);
  }

  return {
    title: "Untitled Video",
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    source: "youtube.com",
    videoId,
    platform: "youtube",
  };
}

function parseTranscriptXml(xml: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  const textRegex = /<text\s+start="([^"]*)"(?:\s+dur="([^"]*)")?[^>]*>([\s\S]*?)<\/text>/gi;
  let match: RegExpExecArray | null;

  while ((match = textRegex.exec(xml)) !== null) {
    const start = parseFloat(match[1]) || 0;
    const duration = parseFloat(match[2]) || 0;
    let text = match[3]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/<[^>]*>/g, "")
      .trim();

    if (text) {
      segments.push({ text, start, duration });
    }
  }

  console.log("[VideoExtractor] Parsed transcript segments:", segments.length);
  return segments;
}

async function fetchYouTubeTranscript(videoId: string): Promise<TranscriptSegment[]> {
  console.log("[VideoExtractor] Fetching transcript for video:", videoId);

  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const proxyUrls = [
    `https://api.allorigins.win/get?url=${encodeURIComponent(watchUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(watchUrl)}`,
  ];

  let pageHtml: string | null = null;

  for (const proxyUrl of proxyUrls) {
    try {
      console.log("[VideoExtractor] Trying proxy for page:", proxyUrl.split("?")[0]);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(proxyUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) continue;

      if (proxyUrl.includes("allorigins")) {
        const json = await response.json();
        if (json?.contents && json.contents.length > 500) {
          pageHtml = json.contents as string;
          break;
        }
      } else {
        const text = await response.text();
        if (text && text.length > 500) {
          pageHtml = text;
          break;
        }
      }
    } catch (err) {
      console.log("[VideoExtractor] Proxy failed:", err);
    }
  }

  if (!pageHtml) {
    console.log("[VideoExtractor] Could not fetch YouTube page");
    return [];
  }

  const captionTrackMatch = pageHtml.match(/"captionTracks"\s*:\s*(\[.*?\])/);
  if (!captionTrackMatch) {
    console.log("[VideoExtractor] No captionTracks found in page");
    const timedTextMatch = pageHtml.match(/timedtext[^"]*videoId[^"]*/);
    if (timedTextMatch) {
      console.log("[VideoExtractor] Found timedtext reference but couldn't parse tracks");
    }
    return [];
  }

  try {
    const tracks = JSON.parse(captionTrackMatch[1]) as {
      baseUrl?: string;
      languageCode?: string;
      kind?: string;
      name?: { simpleText?: string };
    }[];
    console.log("[VideoExtractor] Found caption tracks:", tracks.length);

    let selectedTrack = tracks.find(
      (t) => t.languageCode === "en" && t.kind !== "asr"
    );
    if (!selectedTrack) {
      selectedTrack = tracks.find((t) => t.languageCode === "en");
    }
    if (!selectedTrack) {
      selectedTrack = tracks.find((t) => t.kind !== "asr");
    }
    if (!selectedTrack && tracks.length > 0) {
      selectedTrack = tracks[0];
    }

    if (!selectedTrack?.baseUrl) {
      console.log("[VideoExtractor] No usable caption track found");
      return [];
    }

    console.log(
      "[VideoExtractor] Using track:",
      selectedTrack.languageCode,
      selectedTrack.kind ?? "manual"
    );

    const captionUrl = selectedTrack.baseUrl.replace(/\\u0026/g, "&");
    const captionProxies = [
      `https://api.allorigins.win/get?url=${encodeURIComponent(captionUrl)}`,
      `https://corsproxy.io/?${encodeURIComponent(captionUrl)}`,
    ];

    for (const proxy of captionProxies) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const resp = await fetch(proxy, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!resp.ok) continue;

        let xmlText: string;
        if (proxy.includes("allorigins")) {
          const json = await resp.json();
          xmlText = json?.contents ?? "";
        } else {
          xmlText = await resp.text();
        }

        if (xmlText && xmlText.includes("<text")) {
          return parseTranscriptXml(xmlText);
        }
      } catch (err) {
        console.log("[VideoExtractor] Caption fetch failed:", err);
      }
    }
  } catch (err) {
    console.log("[VideoExtractor] Failed to parse caption tracks:", err);
  }

  return [];
}

const INGREDIENT_PATTERNS = [
  /(\d[\d\/\s]*(?:cup|cups|tbsp|tablespoon|tsp|teaspoon|oz|ounce|pound|lb|gram|g|kg|ml|liter|pinch|dash|clove|slice|piece|stalk|sprig|bunch|head|can|package|pkg|container|bag|box|jar|bottle|stick)s?\.?\s+.+)/gi,
  /(\d[\d\/\s]*\s+(?:large|medium|small|whole)?\s*(?:egg|onion|garlic|tomato|potato|chicken|beef|salmon|shrimp|lemon|lime|avocado|pepper|carrot|celery|apple|banana|orange)s?)/gi,
];

const INGREDIENT_KEYWORDS = [
  "ingredient", "you'll need", "you will need", "you need",
  "what you need", "shopping list", "grocery", "for this recipe",
  "to make this", "gather", "prep", "mise en place",
];

const COOKING_NOUNS = [
  "flour", "sugar", "salt", "pepper", "oil", "butter", "garlic",
  "onion", "chicken", "beef", "pork", "salmon", "shrimp", "egg",
  "milk", "cream", "cheese", "rice", "pasta", "noodle", "bread",
  "tomato", "potato", "carrot", "celery", "broccoli", "spinach",
  "mushroom", "lemon", "lime", "vinegar", "soy sauce", "honey",
  "ginger", "cumin", "paprika", "oregano", "basil", "cilantro",
  "thyme", "rosemary", "cinnamon", "vanilla", "cocoa", "chocolate",
  "baking powder", "baking soda", "yeast", "cornstarch", "stock",
  "broth", "wine", "sesame", "avocado", "cucumber", "bell pepper",
  "jalapeno", "chili", "cayenne", "turmeric", "coriander",
  "parsley", "dill", "mint", "scallion", "shallot", "leek",
];

function extractIngredientsFromTranscript(segments: TranscriptSegment[]): Ingredient[] {
  const fullText = segments.map((s) => s.text).join(" ");
  const lines = fullText.split(/[.!?]+/).map((l) => l.trim()).filter(Boolean);

  const found = new Map<string, string>();

  let isInIngredientSection = false;

  for (const line of lines) {
    const lower = line.toLowerCase();

    if (INGREDIENT_KEYWORDS.some((kw) => lower.includes(kw))) {
      isInIngredientSection = true;
      continue;
    }

    if (isInIngredientSection || hasIngredientPattern(line)) {
      for (const pattern of INGREDIENT_PATTERNS) {
        pattern.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(line)) !== null) {
          const cleaned = match[1].trim();
          const key = cleaned.toLowerCase().replace(/\s+/g, " ");
          if (!found.has(key)) {
            found.set(key, cleaned);
          }
        }
      }
    }

    if (isInIngredientSection) {
      const cookingNounFound = COOKING_NOUNS.filter((noun) => lower.includes(noun));
      if (cookingNounFound.length > 0 && /\d/.test(line)) {
        const key = line.toLowerCase().replace(/\s+/g, " ").substring(0, 80);
        if (!found.has(key)) {
          found.set(key, line.substring(0, 100));
        }
      }
    }

    if (
      isInIngredientSection &&
      !hasIngredientPattern(line) &&
      !COOKING_NOUNS.some((n) => lower.includes(n)) &&
      lower.length > 5
    ) {
      isInIngredientSection = false;
    }
  }

  if (found.size < 3) {
    for (const segment of segments) {
      const lower = segment.text.toLowerCase();
      for (const pattern of INGREDIENT_PATTERNS) {
        pattern.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(segment.text)) !== null) {
          const cleaned = match[1].trim();
          const key = cleaned.toLowerCase().replace(/\s+/g, " ");
          if (!found.has(key)) {
            found.set(key, cleaned);
          }
        }
      }
      if (/\d/.test(lower)) {
        const nounMatch = COOKING_NOUNS.find((n) => lower.includes(n));
        if (nounMatch) {
          const key = segment.text.toLowerCase().replace(/\s+/g, " ").substring(0, 80);
          if (!found.has(key)) {
            found.set(key, segment.text.substring(0, 100));
          }
        }
      }
    }
  }

  console.log("[VideoExtractor] Extracted ingredient candidates:", found.size);

  const ingredients: Ingredient[] = [];
  for (const raw of found.values()) {
    try {
      ingredients.push(createIngredientFromText(raw));
    } catch (err) {
      console.log("[VideoExtractor] Failed to parse ingredient:", raw, err);
    }
  }

  return ingredients;
}

function hasIngredientPattern(text: string): boolean {
  return INGREDIENT_PATTERNS.some((p) => {
    p.lastIndex = 0;
    return p.test(text);
  });
}

export function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

async function fetchInstagramMetadata(reelId: string, url: string): Promise<VideoMetadata> {
  console.log("[VideoExtractor] Fetching Instagram metadata for reel:", reelId);

  const oembedUrl = `https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(oembedUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      console.log("[VideoExtractor] Instagram oEmbed title:", data.title);
      return {
        title: data.title ?? "Instagram Reel",
        thumbnailUrl: data.thumbnail_url ?? "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80",
        source: "instagram.com",
        videoId: reelId,
        platform: "instagram",
      };
    }
    console.log("[VideoExtractor] Instagram oEmbed response not ok:", response.status);
  } catch (err) {
    console.log("[VideoExtractor] Instagram oEmbed fetch failed:", err);
  }

  return {
    title: "Instagram Reel",
    thumbnailUrl: "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80",
    source: "instagram.com",
    videoId: reelId,
    platform: "instagram",
  };
}

async function fetchInstagramCaption(url: string): Promise<string> {
  console.log("[VideoExtractor] Fetching Instagram caption for:", url);

  const proxyUrls = [
    `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
  ];

  for (const proxyUrl of proxyUrls) {
    try {
      console.log("[VideoExtractor] Trying proxy for Instagram page:", proxyUrl.split("?")[0]);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(proxyUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) continue;

      let html: string;
      if (proxyUrl.includes("allorigins")) {
        const json = await response.json();
        html = json?.contents ?? "";
      } else {
        html = await response.text();
      }

      if (!html || html.length < 200) continue;

      let caption = "";

      const ogDescMatch = html.match(
        /<meta[^>]*property\s*=\s*["']og:description["'][^>]*content\s*=\s*["']([^"']+)["']/i
      ) ?? html.match(
        /<meta[^>]*content\s*=\s*["']([^"']+)["'][^>]*property\s*=\s*["']og:description["']/i
      );
      if (ogDescMatch?.[1]) {
        caption = ogDescMatch[1];
        console.log("[VideoExtractor] Found og:description caption, length:", caption.length);
      }

      if (!caption) {
        const descMatch = html.match(
          /<meta[^>]*name\s*=\s*["']description["'][^>]*content\s*=\s*["']([^"']+)["']/i
        );
        if (descMatch?.[1]) {
          caption = descMatch[1];
          console.log("[VideoExtractor] Found meta description caption, length:", caption.length);
        }
      }

      if (!caption) {
        const titleMatch = html.match(
          /<meta[^>]*property\s*=\s*["']og:title["'][^>]*content\s*=\s*["']([^"']+)["']/i
        );
        if (titleMatch?.[1]) {
          caption = titleMatch[1];
          console.log("[VideoExtractor] Using og:title as caption, length:", caption.length);
        }
      }

      const sharedDataMatch = html.match(/window\._sharedData\s*=\s*(\{.+?\});/s);
      if (sharedDataMatch?.[1]) {
        try {
          const sharedData = JSON.parse(sharedDataMatch[1]);
          const mediaCaption = sharedData?.entry_data?.PostPage?.[0]?.graphql?.shortcode_media?.edge_media_to_caption?.edges?.[0]?.node?.text;
          if (mediaCaption) {
            caption = mediaCaption;
            console.log("[VideoExtractor] Found shared data caption, length:", caption.length);
          }
        } catch (e) {
          console.log("[VideoExtractor] Failed to parse _sharedData:", e);
        }
      }

      const additionalDataMatch = html.match(/"caption"\s*:\s*\{[^}]*"text"\s*:\s*"([^"]+)"/s);
      if (additionalDataMatch?.[1] && (!caption || additionalDataMatch[1].length > caption.length)) {
        caption = additionalDataMatch[1]
          .replace(/\\n/g, "\n")
          .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));
        console.log("[VideoExtractor] Found JSON caption text, length:", caption.length);
      }

      if (caption) {
        return caption
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
      }
    } catch (err) {
      console.log("[VideoExtractor] Instagram proxy failed:", err);
    }
  }

  console.log("[VideoExtractor] Could not fetch Instagram caption");
  return "";
}

function extractIngredientsFromCaption(caption: string): Ingredient[] {
  console.log("[VideoExtractor] Extracting ingredients from Instagram caption");

  const lines = caption
    .split(/[\n\r]+/)
    .map((l) => l.replace(/^[•\-\*🔸🔹▪️▫️◾◽⬛⬜🟩🟨🟧🟥🟦🟪🟫✅☑️✔️➡️👉🍳🥄🧂🥘🍽️]+\s*/u, "").trim())
    .filter((l) => l.length > 0);

  const found = new Map<string, string>();

  let isInIngredientSection = false;

  for (const line of lines) {
    const lower = line.toLowerCase();

    if (INGREDIENT_KEYWORDS.some((kw) => lower.includes(kw))) {
      isInIngredientSection = true;
      continue;
    }

    if (
      isInIngredientSection &&
      (lower.includes("instruction") ||
        lower.includes("direction") ||
        lower.includes("method") ||
        lower.includes("step 1") ||
        lower.includes("how to"))
    ) {
      isInIngredientSection = false;
      continue;
    }

    if (isInIngredientSection || hasIngredientPattern(line)) {
      for (const pattern of INGREDIENT_PATTERNS) {
        pattern.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(line)) !== null) {
          const cleaned = match[1].trim();
          const key = cleaned.toLowerCase().replace(/\s+/g, " ");
          if (!found.has(key)) {
            found.set(key, cleaned);
          }
        }
      }
    }

    if (isInIngredientSection) {
      const cookingNounFound = COOKING_NOUNS.filter((noun) => lower.includes(noun));
      if (cookingNounFound.length > 0) {
        const key = line.toLowerCase().replace(/\s+/g, " ").substring(0, 80);
        if (!found.has(key)) {
          found.set(key, line.substring(0, 100));
        }
      }
    }
  }

  if (found.size < 2) {
    for (const line of lines) {
      const lower = line.toLowerCase();
      for (const pattern of INGREDIENT_PATTERNS) {
        pattern.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(line)) !== null) {
          const cleaned = match[1].trim();
          const key = cleaned.toLowerCase().replace(/\s+/g, " ");
          if (!found.has(key)) {
            found.set(key, cleaned);
          }
        }
      }
      if (/\d/.test(lower)) {
        const nounMatch = COOKING_NOUNS.find((n) => lower.includes(n));
        if (nounMatch) {
          const key = line.toLowerCase().replace(/\s+/g, " ").substring(0, 80);
          if (!found.has(key)) {
            found.set(key, line.substring(0, 100));
          }
        }
      }
    }
  }

  console.log("[VideoExtractor] Instagram caption ingredient candidates:", found.size);

  const ingredients: Ingredient[] = [];
  for (const raw of found.values()) {
    try {
      ingredients.push(createIngredientFromText(raw));
    } catch (err) {
      console.log("[VideoExtractor] Failed to parse ingredient from caption:", raw, err);
    }
  }

  return ingredients;
}

async function extractInstagramRecipe(url: string): Promise<VideoRecipeResult> {
  console.log("[VideoExtractor] Starting Instagram Reel extraction for:", url);

  const reelId = extractInstagramReelId(url);
  if (!reelId) {
    throw new Error("Could not detect an Instagram Reel from this URL. Please paste a valid Instagram Reel link.");
  }

  console.log("[VideoExtractor] Detected Instagram Reel ID:", reelId);

  const metadata = await fetchInstagramMetadata(reelId, url);
  const caption = await fetchInstagramCaption(url);

  const captionSegments: TranscriptSegment[] = caption
    ? caption.split(/[\n\r]+/).filter(Boolean).map((line, idx) => ({
        text: line.trim(),
        start: idx,
        duration: 0,
      }))
    : [];

  let ingredients: Ingredient[] = [];
  if (caption) {
    ingredients = extractIngredientsFromCaption(caption);
    console.log("[VideoExtractor] Instagram ingredients found:", ingredients.length);
  } else {
    console.log("[VideoExtractor] No caption found - user will need to add ingredients manually");
  }

  return {
    metadata,
    transcript: captionSegments,
    fullText: caption,
    ingredients,
  };
}

const ASSEMBLYAI_API_KEY = process.env.EXPO_PUBLIC_ASSEMBLYAI_API_KEY ?? "";

interface AssemblyAITranscriptResponse {
  id: string;
  status: "queued" | "processing" | "completed" | "error";
  text?: string;
  words?: { text: string; start: number; end: number }[];
  error?: string;
}

async function transcribeWithAssemblyAI(videoUrl: string): Promise<TranscriptSegment[]> {
  if (!ASSEMBLYAI_API_KEY) {
    console.log("[AssemblyAI] No API key configured, skipping");
    return [];
  }

  console.log("[AssemblyAI] Starting transcription for:", videoUrl);

  try {
    const submitResponse = await fetch("https://api.assemblyai.com/v2/transcript", {
      method: "POST",
      headers: {
        "Authorization": ASSEMBLYAI_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audio_url: videoUrl,
        language_code: "en",
      }),
    });

    if (!submitResponse.ok) {
      const errBody = await submitResponse.text();
      console.log("[AssemblyAI] Submit failed:", submitResponse.status, errBody);
      return [];
    }

    const submitData = (await submitResponse.json()) as AssemblyAITranscriptResponse;
    const transcriptId = submitData.id;
    console.log("[AssemblyAI] Transcript ID:", transcriptId, "Status:", submitData.status);

    const pollUrl = `https://api.assemblyai.com/v2/transcript/${transcriptId}`;
    const maxAttempts = 60;
    const pollInterval = 3000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      const pollResponse = await fetch(pollUrl, {
        headers: { "Authorization": ASSEMBLYAI_API_KEY },
      });

      if (!pollResponse.ok) {
        console.log("[AssemblyAI] Poll failed:", pollResponse.status);
        continue;
      }

      const pollData = (await pollResponse.json()) as AssemblyAITranscriptResponse;
      console.log("[AssemblyAI] Poll attempt", attempt + 1, "status:", pollData.status);

      if (pollData.status === "completed") {
        if (!pollData.text) {
          console.log("[AssemblyAI] Completed but no text returned");
          return [];
        }

        console.log("[AssemblyAI] Transcription complete, text length:", pollData.text.length);

        if (pollData.words && pollData.words.length > 0) {
          const segments: TranscriptSegment[] = [];
          let currentSegment = "";
          let segmentStart = pollData.words[0].start / 1000;

          for (let i = 0; i < pollData.words.length; i++) {
            const word = pollData.words[i];
            currentSegment += (currentSegment ? " " : "") + word.text;

            const isEnd = currentSegment.endsWith(".") || currentSegment.endsWith("!") || currentSegment.endsWith("?");
            const isLong = currentSegment.split(" ").length >= 12;
            const isLast = i === pollData.words.length - 1;

            if (isEnd || isLong || isLast) {
              const endTime = word.end / 1000;
              segments.push({
                text: currentSegment.trim(),
                start: segmentStart,
                duration: endTime - segmentStart,
              });
              currentSegment = "";
              if (i + 1 < pollData.words.length) {
                segmentStart = pollData.words[i + 1].start / 1000;
              }
            }
          }

          console.log("[AssemblyAI] Created", segments.length, "segments from words");
          return segments;
        }

        const sentences = pollData.text.split(/[.!?]+/).filter((s) => s.trim());
        return sentences.map((s, idx) => ({
          text: s.trim(),
          start: idx * 5,
          duration: 5,
        }));
      }

      if (pollData.status === "error") {
        console.log("[AssemblyAI] Transcription error:", pollData.error);
        return [];
      }
    }

    console.log("[AssemblyAI] Transcription timed out after", maxAttempts, "attempts");
    return [];
  } catch (err) {
    console.log("[AssemblyAI] Error:", err);
    return [];
  }
}

function getDirectVideoUrl(url: string, platform: "youtube" | "instagram" | "unknown", videoId: string): string {
  if (platform === "youtube") {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  return url;
}

export async function extractVideoRecipe(url: string): Promise<VideoRecipeResult> {
  console.log("[VideoExtractor] Starting extraction for:", url);

  const platform = getVideoPlatform(url);

  if (platform === "instagram") {
    const result = await extractInstagramRecipe(url);

    if (result.ingredients.length === 0 && (!result.fullText || result.fullText.length < 50)) {
      console.log("[VideoExtractor] Instagram extraction yielded little content, trying AssemblyAI...");
      const aiSegments = await transcribeWithAssemblyAI(url);
      if (aiSegments.length > 0) {
        const aiFullText = aiSegments.map((s) => s.text).join(" ");
        const aiIngredients = extractIngredientsFromTranscript(aiSegments);
        console.log("[VideoExtractor] AssemblyAI fallback found", aiIngredients.length, "ingredients");
        return {
          ...result,
          transcript: aiSegments,
          fullText: aiFullText,
          ingredients: aiIngredients.length > 0 ? aiIngredients : result.ingredients,
        };
      }
    }

    return result;
  }

  const videoId = extractYouTubeId(url);
  if (!videoId) {
    throw new Error("Could not detect a video from this URL. Please paste a valid YouTube or Instagram Reel link.");
  }

  console.log("[VideoExtractor] Detected YouTube video ID:", videoId);

  const metadata = await fetchYouTubeMetadata(videoId);
  let transcript = await fetchYouTubeTranscript(videoId);
  let fullText = transcript.map((s) => s.text).join(" ");

  if (transcript.length === 0) {
    console.log("[VideoExtractor] No YouTube captions found, trying AssemblyAI...");
    const directUrl = getDirectVideoUrl(url, platform, videoId);
    transcript = await transcribeWithAssemblyAI(directUrl);
    fullText = transcript.map((s) => s.text).join(" ");

    if (transcript.length > 0) {
      console.log("[VideoExtractor] AssemblyAI fallback succeeded with", transcript.length, "segments");
    }
  }

  let ingredients: Ingredient[] = [];
  if (transcript.length > 0) {
    ingredients = extractIngredientsFromTranscript(transcript);
    console.log("[VideoExtractor] Final ingredient count:", ingredients.length);
  } else {
    console.log("[VideoExtractor] No transcript available - user will need to add ingredients manually");
  }

  return {
    metadata,
    transcript,
    fullText,
    ingredients,
  };
}
