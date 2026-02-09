import { Ingredient, IngredientCategory } from "@/types";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function categorizeIngredient(name: string): IngredientCategory {
  const lower = name.toLowerCase();
  const produceKeywords = [
    "tomato", "onion", "garlic", "pepper", "lettuce", "carrot", "potato",
    "mango", "lime", "lemon", "basil", "cilantro", "ginger", "avocado",
    "cabbage", "chili", "cucumber", "spinach", "kale", "broccoli", "celery",
    "mushroom", "zucchini", "squash", "asparagus", "corn", "pea", "bean sprout",
    "scallion", "shallot", "leek", "dill", "parsley", "rosemary", "thyme",
    "mint", "sage", "chive", "arugula", "radish", "beet", "turnip", "fennel",
    "artichoke", "eggplant", "bell pepper", "jalapeno", "serrano", "habanero",
    "poblano", "green onion", "spring onion",
  ];
  const dairyKeywords = [
    "milk", "cheese", "cream", "butter", "yogurt", "egg", "sour cream",
    "creme fraiche", "mascarpone", "ricotta", "mozzarella", "parmesan",
    "cheddar", "gruyere", "feta", "goat cheese", "brie", "gouda",
  ];
  const meatKeywords = [
    "chicken", "beef", "pork", "lamb", "guanciale", "bacon", "sausage",
    "turkey", "duck", "veal", "ham", "prosciutto", "pancetta", "salami",
    "steak", "ground beef", "ground turkey", "ground pork", "brisket",
  ];
  const seafoodKeywords = [
    "fish", "shrimp", "salmon", "tuna", "cod", "tilapia", "halibut",
    "trout", "crab", "lobster", "scallop", "mussel", "clam", "oyster",
    "anchovy", "sardine", "swordfish", "mahi", "sea bass", "snapper",
  ];
  const spiceKeywords = [
    "salt", "pepper", "cumin", "paprika", "oregano", "thyme", "cinnamon",
    "sesame", "nutmeg", "clove", "turmeric", "cayenne", "chili powder",
    "curry", "coriander", "cardamom", "allspice", "bay leaf", "red pepper flakes",
    "black pepper", "white pepper", "garlic powder", "onion powder",
    "smoked paprika", "italian seasoning", "everything bagel",
  ];
  const bakeryKeywords = ["bread", "tortilla", "bun", "roll", "pita", "naan", "flatbread", "croissant", "bagel"];

  if (produceKeywords.some((k) => lower.includes(k))) return "produce";
  if (dairyKeywords.some((k) => lower.includes(k))) return "dairy";
  if (meatKeywords.some((k) => lower.includes(k))) return "meat";
  if (seafoodKeywords.some((k) => lower.includes(k))) return "seafood";
  if (spiceKeywords.some((k) => lower.includes(k))) return "spices";
  if (bakeryKeywords.some((k) => lower.includes(k))) return "bakery";
  return "pantry";
}

interface JsonLdRecipe {
  "@type"?: string | string[];
  name?: string;
  image?: string | string[] | { url?: string }[];
  recipeIngredient?: string[];
  "@graph"?: JsonLdRecipe[];
}

function findRecipeInJsonLd(data: unknown): JsonLdRecipe | null {
  if (!data || typeof data !== "object") return null;

  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findRecipeInJsonLd(item);
      if (found) return found;
    }
    return null;
  }

  const obj = data as JsonLdRecipe;

  if (obj["@graph"] && Array.isArray(obj["@graph"])) {
    for (const item of obj["@graph"]) {
      const found = findRecipeInJsonLd(item);
      if (found) return found;
    }
  }

  const typeVal = obj["@type"];
  if (typeVal) {
    const types = Array.isArray(typeVal) ? typeVal : [typeVal];
    if (types.some((t) => t === "Recipe")) {
      return obj;
    }
  }

  return null;
}

function extractImageUrl(image: JsonLdRecipe["image"]): string {
  if (!image) return "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80";
  if (typeof image === "string") return image;
  if (Array.isArray(image)) {
    const first = image[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object" && "url" in first) return first.url ?? "";
  }
  return "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80";
}

function parseIngredientString(raw: string): { name: string; quantity: string; unit: string } {
  const cleaned = raw.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

  const unitPatterns = [
    "cups?", "tablespoons?", "tbsps?", "teaspoons?", "tsps?",
    "ounces?", "oz", "pounds?", "lbs?", "grams?", "g",
    "kilograms?", "kg", "milliliters?", "ml", "liters?", "l",
    "pinch(?:es)?", "dash(?:es)?", "cloves?", "slices?", "pieces?",
    "stalks?", "sprigs?", "bunche?s?", "heads?", "cans?",
    "packages?", "pkgs?", "containers?", "bags?", "boxes?",
    "jars?", "bottles?", "sticks?", "large", "medium", "small",
    "whole", "halve?s?", "quarters?", "inch(?:es)?",
  ];

  const numberPattern = /^([\d\s\/\.\-–—¼½¾⅓⅔⅛⅜⅝⅞]+)/;
  const numberMatch = cleaned.match(numberPattern);
  let quantity = "";
  let rest = cleaned;

  if (numberMatch) {
    quantity = numberMatch[1].trim()
      .replace("¼", "1/4").replace("½", "1/2").replace("¾", "3/4")
      .replace("⅓", "1/3").replace("⅔", "2/3").replace("⅛", "1/8")
      .replace("⅜", "3/8").replace("⅝", "5/8").replace("⅞", "7/8");
    rest = cleaned.slice(numberMatch[0].length).trim();
  }

  const unitRegex = new RegExp(`^(${unitPatterns.join("|")})\\.?\\s+`, "i");
  const unitMatch = rest.match(unitRegex);
  let unit = "";

  if (unitMatch) {
    unit = unitMatch[1].toLowerCase();
    rest = rest.slice(unitMatch[0].length).trim();
  }

  const name = rest.replace(/,.*$/, "").replace(/\(.*?\)/g, "").trim();

  return { name: name || cleaned, quantity, unit };
}

function extractJsonLdFromHtml(html: string): unknown[] {
  const results: unknown[] = [];
  const scriptRegex = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      results.push(parsed);
    } catch (e) {
      console.log("Failed to parse JSON-LD block:", e);
    }
  }
  return results;
}

function extractRecipeFromHtmlFallback(html: string): { title: string; ingredients: string[] } | null {
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, "").trim() : "";

  const ingredients: string[] = [];
  const ingredientPatterns = [
    /class\s*=\s*["'][^"']*ingredient[^"']*["'][^>]*>([\s\S]*?)<\//gi,
    /itemprop\s*=\s*["']recipeIngredient["'][^>]*>([\s\S]*?)<\//gi,
  ];

  for (const pattern of ingredientPatterns) {
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(html)) !== null) {
      const text = m[1].replace(/<[^>]*>/g, "").trim();
      if (text && text.length > 2 && text.length < 200) {
        ingredients.push(text);
      }
    }
  }

  if (ingredients.length > 0) {
    return { title, ingredients };
  }
  return null;
}

async function fetchWithTimeout(fetchFn: () => Promise<Response>, timeoutMs: number = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchFn();
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

function getAllOriginsJsonUrl(url: string): string {
  return `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
}

async function fetchWithFallbacks(url: string): Promise<string> {
  const strategies: { name: string; fetchFn: () => Promise<string> }[] = [
    {
      name: "direct",
      fetchFn: async () => {
        const response = await fetchWithTimeout(() =>
          fetch(url, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              Accept:
                "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              "Accept-Language": "en-US,en;q=0.9",
            },
          })
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      },
    },
    {
      name: "allorigins-json",
      fetchFn: async () => {
        const response = await fetchWithTimeout(() =>
          fetch(getAllOriginsJsonUrl(url))
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        if (json && json.contents) return json.contents as string;
        throw new Error("No contents in response");
      },
    },
    {
      name: "allorigins-raw",
      fetchFn: async () => {
        const response = await fetchWithTimeout(() =>
          fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`)
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      },
    },
    {
      name: "corsproxy",
      fetchFn: async () => {
        const response = await fetchWithTimeout(() =>
          fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`)
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      },
    },
    {
      name: "cors-anywhere-herokuapp",
      fetchFn: async () => {
        const response = await fetchWithTimeout(() =>
          fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`)
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      },
    },
    {
      name: "google-cache",
      fetchFn: async () => {
        const response = await fetchWithTimeout(() =>
          fetch(`https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(url)}`)
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      },
    },
  ];

  for (const strategy of strategies) {
    try {
      console.log(`[RecipeExtractor] Trying ${strategy.name} fetch...`);
      const html = await strategy.fetchFn();
      if (html && html.length > 500) {
        console.log(
          `[RecipeExtractor] ${strategy.name} succeeded, HTML length: ${html.length}`
        );
        return html;
      }
      console.log(
        `[RecipeExtractor] ${strategy.name} returned too little content (${html?.length ?? 0} chars), trying next...`
      );
    } catch (err) {
      console.log(`[RecipeExtractor] ${strategy.name} failed:`, err);
    }
  }

  throw new Error(
    "Could not fetch the recipe page. The website may be blocking access. Please try a different recipe link."
  );
}

export async function extractRecipeFromUrl(url: string): Promise<{
  title: string;
  source: string;
  imageUrl: string;
  ingredients: Ingredient[];
}> {
  console.log("[RecipeExtractor] Fetching URL:", url);

  let html: string;
  try {
    html = await fetchWithFallbacks(url);
  } catch (err) {
    console.error("[RecipeExtractor] All fetch strategies failed:", err);
    throw err instanceof Error
      ? err
      : new Error("Could not fetch the recipe page. Please check the URL and try again.");
  }

  const urlObj = (() => {
    try { return new URL(url); } catch { return null; }
  })();
  const source = urlObj ? urlObj.hostname.replace("www.", "") : "Unknown";

  const jsonLdBlocks = extractJsonLdFromHtml(html);
  console.log("[RecipeExtractor] Found JSON-LD blocks:", jsonLdBlocks.length);

  let recipeData: JsonLdRecipe | null = null;
  for (const block of jsonLdBlocks) {
    recipeData = findRecipeInJsonLd(block);
    if (recipeData) break;
  }

  if (recipeData && recipeData.recipeIngredient && recipeData.recipeIngredient.length > 0) {
    console.log("[RecipeExtractor] Found recipe via JSON-LD:", recipeData.name);
    console.log("[RecipeExtractor] Ingredients count:", recipeData.recipeIngredient.length);

    const ingredients: Ingredient[] = recipeData.recipeIngredient.map((raw) => {
      const parsed = parseIngredientString(raw);
      return {
        id: generateId(),
        name: parsed.name,
        quantity: parsed.quantity,
        unit: parsed.unit,
        category: categorizeIngredient(parsed.name),
      };
    });

    return {
      title: recipeData.name ?? "Untitled Recipe",
      source,
      imageUrl: extractImageUrl(recipeData.image),
      ingredients,
    };
  }

  console.log("[RecipeExtractor] No JSON-LD recipe found, trying HTML fallback...");
  const fallback = extractRecipeFromHtmlFallback(html);
  if (fallback && fallback.ingredients.length > 0) {
    console.log("[RecipeExtractor] Fallback found ingredients:", fallback.ingredients.length);

    const ingredients: Ingredient[] = fallback.ingredients.map((raw) => {
      const parsed = parseIngredientString(raw);
      return {
        id: generateId(),
        name: parsed.name,
        quantity: parsed.quantity,
        unit: parsed.unit,
        category: categorizeIngredient(parsed.name),
      };
    });

    return {
      title: fallback.title || "Untitled Recipe",
      source,
      imageUrl: "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80",
      ingredients,
    };
  }

  throw new Error("Could not find recipe data on this page. Try a different recipe link.");
}
