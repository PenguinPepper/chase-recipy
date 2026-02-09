import { Ingredient } from "@/types";
import { createIngredientFromText } from "@/utils/recipeExtractor";

export interface VideoMetadata {
  title: string;
  thumbnailUrl: string;
  source: string;
  videoId: string;
  platform: "youtube" | "unknown";
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

export function isVideoUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes("youtube.com") ||
    lower.includes("youtu.be") ||
    lower.includes("youtube.com/shorts")
  );
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

export async function extractVideoRecipe(url: string): Promise<VideoRecipeResult> {
  console.log("[VideoExtractor] Starting extraction for:", url);

  const videoId = extractYouTubeId(url);
  if (!videoId) {
    throw new Error("Could not detect a YouTube video from this URL. Please paste a valid YouTube link.");
  }

  console.log("[VideoExtractor] Detected YouTube video ID:", videoId);

  const metadata = await fetchYouTubeMetadata(videoId);
  const transcript = await fetchYouTubeTranscript(videoId);
  const fullText = transcript.map((s) => s.text).join(" ");

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
