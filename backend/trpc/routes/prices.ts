import * as z from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";

const GROCERY_STORES: { name: string; searchUrl: (query: string) => string }[] = [
  {
    name: "Walmart",
    searchUrl: (q: string) => `https://www.walmart.com/search?q=${encodeURIComponent(q)}`,
  },
  {
    name: "Target",
    searchUrl: (q: string) => `https://www.target.com/s?searchTerm=${encodeURIComponent(q)}`,
  },
  {
    name: "Kroger",
    searchUrl: (q: string) => `https://www.kroger.com/search?query=${encodeURIComponent(q)}&searchType=default_search`,
  },
];

interface ZyteProduct {
  name?: string;
  price?: string;
  currency?: string;
  currencyRaw?: string;
  regularPrice?: string;
  url?: string;
  mainImage?: { url?: string };
  additionalProperties?: { name: string; value: string }[];
  breadcrumbs?: { name: string }[];
  description?: string;
  availability?: string;
}

interface ZyteProductListResponse {
  productList?: {
    products?: ZyteProduct[];
  };
  product?: ZyteProduct;
}

function parseUnitSize(name: string): { amount: number; unit: string } | null {
  const patterns = [
    /(\d+\.?\d*)\s*(oz|ounce|ounces)/i,
    /(\d+\.?\d*)\s*(lb|lbs|pound|pounds)/i,
    /(\d+\.?\d*)\s*(kg|kilogram|kilograms)/i,
    /(\d+\.?\d*)\s*(g|gram|grams)/i,
    /(\d+\.?\d*)\s*(ml|milliliter|milliliters)/i,
    /(\d+\.?\d*)\s*(l|liter|liters|litre|litres)/i,
    /(\d+\.?\d*)\s*(fl\s*oz|fluid\s*oz|fluid\s*ounce)/i,
    /(\d+\.?\d*)\s*(gal|gallon|gallons)/i,
    /(\d+\.?\d*)\s*(qt|quart|quarts)/i,
    /(\d+\.?\d*)\s*(pt|pint|pints)/i,
    /(\d+\.?\d*)\s*(ct|count|each|ea|pk|pack)/i,
  ];

  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (match) {
      return { amount: parseFloat(match[1]), unit: match[2].toLowerCase() };
    }
  }
  return null;
}

function convertToBaseUnit(amount: number, unit: string): { amount: number; baseUnit: string } {
  const u = unit.toLowerCase().replace(/s$/, "");

  if (["oz", "ounce"].includes(u)) return { amount: amount * 28.3495, baseUnit: "g" };
  if (["lb", "pound"].includes(u)) return { amount: amount * 453.592, baseUnit: "g" };
  if (["kg", "kilogram"].includes(u)) return { amount: amount * 1000, baseUnit: "g" };
  if (["g", "gram"].includes(u)) return { amount, baseUnit: "g" };

  if (["ml", "milliliter"].includes(u)) return { amount, baseUnit: "ml" };
  if (["l", "liter", "litre"].includes(u)) return { amount: amount * 1000, baseUnit: "ml" };
  if (u === "fl oz" || u === "fluid oz" || u === "fluid ounce") return { amount: amount * 29.5735, baseUnit: "ml" };
  if (["gal", "gallon"].includes(u)) return { amount: amount * 3785.41, baseUnit: "ml" };
  if (["qt", "quart"].includes(u)) return { amount: amount * 946.353, baseUnit: "ml" };
  if (["pt", "pint"].includes(u)) return { amount: amount * 473.176, baseUnit: "ml" };

  if (["ct", "count", "each", "ea", "pk", "pack"].includes(u)) return { amount, baseUnit: "ct" };

  return { amount, baseUnit: unit };
}

function computeUnitPrice(price: number, productName: string): { unitPrice: number; unitLabel: string } {
  const parsed = parseUnitSize(productName);
  if (!parsed) {
    return { unitPrice: price, unitLabel: "each" };
  }

  const base = convertToBaseUnit(parsed.amount, parsed.unit);

  if (base.baseUnit === "g" && base.amount > 0) {
    return { unitPrice: (price / base.amount) * 1000, unitLabel: "per kg" };
  }
  if (base.baseUnit === "ml" && base.amount > 0) {
    return { unitPrice: (price / base.amount) * 1000, unitLabel: "per liter" };
  }
  if (base.baseUnit === "ct" && base.amount > 0) {
    return { unitPrice: price / base.amount, unitLabel: "per ct" };
  }

  return { unitPrice: price, unitLabel: "each" };
}

async function fetchZyteProductList(
  apiKey: string,
  url: string
): Promise<ZyteProduct[]> {
  console.log(`[Zyte] Fetching product list from: ${url}`);

  try {
    const response = await fetch("https://api.zyte.com/v1/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa(apiKey + ":"),
      },
      body: JSON.stringify({
        url,
        productList: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`[Zyte] API error ${response.status}: ${errorText}`);
      return [];
    }

    const data = (await response.json()) as ZyteProductListResponse;
    console.log(`[Zyte] Got ${data.productList?.products?.length || 0} products`);
    return data.productList?.products || [];
  } catch (err) {
    console.log("[Zyte] Fetch error:", err);
    return [];
  }
}

export const pricesRouter = createTRPCRouter({
  searchIngredient: publicProcedure
    .input(
      z.object({
        ingredientName: z.string(),
        searchTerm: z.string(),
        apiKey: z.string(),
        stores: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { searchTerm, apiKey, stores } = input;
      console.log(`[Prices] Searching for: "${searchTerm}"`);

      const targetStores = stores?.length
        ? GROCERY_STORES.filter((s) => stores.includes(s.name))
        : GROCERY_STORES;

      const results: {
        name: string;
        price: number;
        currency: string;
        unitSize: string;
        unitPrice: number;
        unitLabel: string;
        store: string;
        url: string;
        imageUrl?: string;
      }[] = [];

      for (const store of targetStores) {
        try {
          const searchUrl = store.searchUrl(searchTerm);
          const products = await fetchZyteProductList(apiKey, searchUrl);

          const relevantProducts = products
            .filter((p) => p.name && p.price)
            .slice(0, 5);

          for (const product of relevantProducts) {
            const priceNum = parseFloat(
              (product.price || "0").replace(/[^0-9.]/g, "")
            );
            if (priceNum <= 0) continue;

            const unitInfo = computeUnitPrice(priceNum, product.name || "");
            const sizeInfo = parseUnitSize(product.name || "");

            results.push({
              name: product.name || "Unknown Product",
              price: priceNum,
              currency: product.currency || product.currencyRaw || "USD",
              unitSize: sizeInfo
                ? `${sizeInfo.amount} ${sizeInfo.unit}`
                : "N/A",
              unitPrice: Math.round(unitInfo.unitPrice * 100) / 100,
              unitLabel: unitInfo.unitLabel,
              store: store.name,
              url: product.url || searchUrl,
              imageUrl: product.mainImage?.url,
            });
          }
        } catch (err) {
          console.log(`[Prices] Error fetching from ${store.name}:`, err);
        }
      }

      results.sort((a, b) => a.price - b.price);

      console.log(`[Prices] Found ${results.length} results for "${searchTerm}"`);
      return {
        ingredientName: input.ingredientName,
        searchTerm,
        matches: results,
        bestMatch: results.length > 0 ? results[0] : null,
      };
    }),

  searchRecipeIngredients: publicProcedure
    .input(
      z.object({
        ingredients: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            searchTerm: z.string(),
          })
        ),
        apiKey: z.string(),
        stores: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { ingredients, apiKey, stores } = input;
      console.log(`[Prices] Searching prices for ${ingredients.length} ingredients`);

      const results: {
        ingredientId: string;
        ingredientName: string;
        searchTerm: string;
        matches: {
          name: string;
          price: number;
          currency: string;
          unitSize: string;
          unitPrice: number;
          unitLabel: string;
          store: string;
          url: string;
          imageUrl?: string;
        }[];
        bestMatch: {
          name: string;
          price: number;
          currency: string;
          unitSize: string;
          unitPrice: number;
          unitLabel: string;
          store: string;
          url: string;
          imageUrl?: string;
        } | null;
      }[] = [];

      const targetStores = stores?.length
        ? GROCERY_STORES.filter((s) => stores.includes(s.name))
        : GROCERY_STORES.slice(0, 1);

      for (const ingredient of ingredients) {
        const ingredientResults: typeof results[0]["matches"] = [];

        for (const store of targetStores) {
          try {
            const searchUrl = store.searchUrl(ingredient.searchTerm);
            const products = await fetchZyteProductList(apiKey, searchUrl);

            const relevantProducts = products
              .filter((p) => p.name && p.price)
              .slice(0, 3);

            for (const product of relevantProducts) {
              const priceNum = parseFloat(
                (product.price || "0").replace(/[^0-9.]/g, "")
              );
              if (priceNum <= 0) continue;

              const unitInfo = computeUnitPrice(priceNum, product.name || "");
              const sizeInfo = parseUnitSize(product.name || "");

              ingredientResults.push({
                name: product.name || "Unknown Product",
                price: priceNum,
                currency: product.currency || product.currencyRaw || "USD",
                unitSize: sizeInfo
                  ? `${sizeInfo.amount} ${sizeInfo.unit}`
                  : "N/A",
                unitPrice: Math.round(unitInfo.unitPrice * 100) / 100,
                unitLabel: unitInfo.unitLabel,
                store: store.name,
                url: product.url || searchUrl,
                imageUrl: product.mainImage?.url,
              });
            }
          } catch (err) {
            console.log(
              `[Prices] Error for ${ingredient.name} at ${store.name}:`,
              err
            );
          }
        }

        ingredientResults.sort((a, b) => a.price - b.price);

        results.push({
          ingredientId: ingredient.id,
          ingredientName: ingredient.name,
          searchTerm: ingredient.searchTerm,
          matches: ingredientResults,
          bestMatch:
            ingredientResults.length > 0 ? ingredientResults[0] : null,
        });
      }

      const totalEstimated = results.reduce((sum, r) => {
        return sum + (r.bestMatch?.price || 0);
      }, 0);

      const storeMap = new Map<
        string,
        { total: number; itemCount: number; missingCount: number }
      >();

      for (const store of GROCERY_STORES) {
        storeMap.set(store.name, { total: 0, itemCount: 0, missingCount: 0 });
      }

      for (const r of results) {
        for (const store of GROCERY_STORES) {
          const storeMatches = r.matches.filter((m) => m.store === store.name);
          const entry = storeMap.get(store.name)!;
          if (storeMatches.length > 0) {
            entry.total += storeMatches[0].price;
            entry.itemCount += 1;
          } else {
            entry.missingCount += 1;
          }
        }
      }

      const storeBreakdown = Array.from(storeMap.entries())
        .map(([store, data]) => ({
          store,
          total: Math.round(data.total * 100) / 100,
          itemCount: data.itemCount,
          missingCount: data.missingCount,
        }))
        .filter((s) => s.itemCount > 0)
        .sort((a, b) => a.total - b.total);

      console.log(`[Prices] Total estimated: $${totalEstimated.toFixed(2)}`);

      return {
        ingredientPrices: results,
        totalEstimated: Math.round(totalEstimated * 100) / 100,
        currency: "USD",
        storeBreakdown,
        fetchedAt: new Date().toISOString(),
      };
    }),
});
