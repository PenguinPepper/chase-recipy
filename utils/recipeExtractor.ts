import { Ingredient, IngredientCategory } from "@/types";
import { normalizeIngredient } from "@/utils/ingredientNormalizer";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function categorizeIngredient(name: string): IngredientCategory {
  const lower = name.toLowerCase();
  const fruitsVegetablesKeywords = [
    "apple", "banana", "orange", "strawberry", "blueberry", "raspberry",
    "grape", "pineapple", "peach", "pear", "plum", "cherry", "watermelon",
    "cantaloupe", "honeydew", "mango", "lime", "lemon", "avocado", "kiwi",
    "papaya", "coconut", "fig", "pomegranate", "apricot", "nectarine",
    "grapefruit", "tangerine", "clementine", "cranberry", "blackberry",
    "tomato", "onion", "garlic", "pepper", "lettuce", "carrot", "potato",
    "cabbage", "cucumber", "spinach", "kale", "broccoli", "celery",
    "mushroom", "zucchini", "squash", "asparagus", "corn", "pea", "bean sprout",
    "scallion", "shallot", "leek", "arugula", "radish", "beet", "turnip",
    "fennel", "artichoke", "eggplant", "bell pepper", "jalapeno", "serrano",
    "habanero", "poblano", "green onion", "spring onion", "cauliflower",
    "sweet potato", "yam", "okra", "bok choy", "brussels sprout",
  ];
  const produceKeywords = [
    "basil", "cilantro", "ginger", "chili",
    "dill", "parsley", "rosemary", "thyme",
    "mint", "sage", "chive",
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

  if (fruitsVegetablesKeywords.some((k) => lower.includes(k))) return "fruits_vegetables";
  if (produceKeywords.some((k) => lower.includes(k))) return "produce";
  if (dairyKeywords.some((k) => lower.includes(k))) return "dairy";
  if (meatKeywords.some((k) => lower.includes(k))) return "meat";
  if (seafoodKeywords.some((k) => lower.includes(k))) return "seafood";
  if (spiceKeywords.some((k) => lower.includes(k))) return "spices";
  if (bakeryKeywords.some((k) => lower.includes(k))) return "bakery";
  return "pantry";
}

export function parseIngredientString(raw: string): { name: string; quantity: string; unit: string } {
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

export function createIngredientFromText(text: string): Ingredient {
  const parsed = parseIngredientString(text);
  const raw: Ingredient = {
    id: generateId(),
    name: parsed.name,
    quantity: parsed.quantity,
    unit: parsed.unit,
    category: categorizeIngredient(parsed.name),
  };
  const { ingredient: normalized } = normalizeIngredient(raw);
  normalized.category = categorizeIngredient(normalized.name);
  return normalized;
}

export interface RecipeMetadata {
  title: string;
  source: string;
  imageUrl: string;
  ingredients: Ingredient[];
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "Unknown";
  }
}

function titleFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const slug = pathname.split("/").filter(Boolean).pop() ?? "";
    return slug
      .replace(/[-_]/g, " ")
      .replace(/\.\w+$/, "")
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  } catch {
    return "Untitled Recipe";
  }
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
  if (!image) return "";
  if (typeof image === "string") return image;
  if (Array.isArray(image)) {
    const first = image[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object" && "url" in first) return first.url ?? "";
  }
  return "";
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
      console.log("[RecipeExtractor] Failed to parse JSON-LD block:", e);
    }
  }
  return results;
}

function extractOgFromHtml(html: string): { title: string; image: string } {
  const ogTitle = html.match(/<meta[^>]*property\s*=\s*["']og:title["'][^>]*content\s*=\s*["']([^"']+)["']/i)?.[1]
    ?? html.match(/<meta[^>]*content\s*=\s*["']([^"']+)["'][^>]*property\s*=\s*["']og:title["']/i)?.[1]
    ?? "";
  const ogImage = html.match(/<meta[^>]*property\s*=\s*["']og:image["'][^>]*content\s*=\s*["']([^"']+)["']/i)?.[1]
    ?? html.match(/<meta[^>]*content\s*=\s*["']([^"']+)["'][^>]*property\s*=\s*["']og:image["']/i)?.[1]
    ?? "";
  const titleTag = html.match(/<title[^>]*>(.*?)<\/title>/i)?.[1]?.replace(/<[^>]*>/g, "").trim() ?? "";

  return {
    title: ogTitle || titleTag,
    image: ogImage,
  };
}

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80";

async function tryFetchHtml(url: string): Promise<string | null> {
  const proxyUrls = [
    `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  ];

  for (const proxyUrl of proxyUrls) {
    try {
      console.log("[RecipeExtractor] Trying proxy:", proxyUrl.split("?")[0]);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(proxyUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) continue;

      if (proxyUrl.includes("allorigins")) {
        const json = await response.json();
        if (json?.contents && json.contents.length > 200) {
          console.log("[RecipeExtractor] Got HTML via allorigins, length:", json.contents.length);
          return json.contents as string;
        }
      } else {
        const text = await response.text();
        if (text && text.length > 200) {
          console.log("[RecipeExtractor] Got HTML via proxy, length:", text.length);
          return text;
        }
      }
    } catch (err) {
      console.log("[RecipeExtractor] Proxy failed:", err);
    }
  }

  try {
    console.log("[RecipeExtractor] Trying direct fetch...");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    clearTimeout(timeoutId);
    if (response.ok) {
      const text = await response.text();
      if (text.length > 200) {
        console.log("[RecipeExtractor] Direct fetch succeeded, length:", text.length);
        return text;
      }
    }
  } catch (err) {
    console.log("[RecipeExtractor] Direct fetch failed:", err);
  }

  return null;
}

export async function extractRecipeMetadata(url: string): Promise<RecipeMetadata> {
  console.log("[RecipeExtractor] Extracting metadata for:", url);

  const source = extractDomain(url);
  const fallbackTitle = titleFromUrl(url);

  let title = fallbackTitle;
  let imageUrl = FALLBACK_IMAGE;
  let ingredients: Ingredient[] = [];

  const html = await tryFetchHtml(url);

  if (html) {
    const og = extractOgFromHtml(html);
    if (og.title) title = og.title;
    if (og.image) imageUrl = og.image;

    const jsonLdBlocks = extractJsonLdFromHtml(html);
    console.log("[RecipeExtractor] Found JSON-LD blocks:", jsonLdBlocks.length);

    for (const block of jsonLdBlocks) {
      const recipeData = findRecipeInJsonLd(block);
      if (recipeData) {
        if (recipeData.name) title = recipeData.name;
        const recipeImage = extractImageUrl(recipeData.image);
        if (recipeImage) imageUrl = recipeImage;

        if (recipeData.recipeIngredient && recipeData.recipeIngredient.length > 0) {
          console.log("[RecipeExtractor] Found structured ingredients:", recipeData.recipeIngredient.length);
          ingredients = recipeData.recipeIngredient.map((raw) => createIngredientFromText(raw));
        }
        break;
      }
    }
  } else {
    console.log("[RecipeExtractor] Could not fetch HTML - using URL-derived metadata only");
  }

  console.log("[RecipeExtractor] Result:", { title, source, imageUrl: imageUrl.substring(0, 60), ingredientCount: ingredients.length });

  return { title, source, imageUrl, ingredients };
}
