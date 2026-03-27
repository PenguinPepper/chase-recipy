import { supabase } from "@/lib/supabase";
import { Ingredient, PublicRecipe } from "@/types";

export async function publishRecipe(params: {
  id: string;
  userId: string;
  title: string;
  url: string;
  source: string;
  imageUrl: string;
  ingredients: Ingredient[];
  authorName: string;
}): Promise<void> {
  console.log("[PublicRecipes] Publishing recipe:", params.title);
  const { error } = await supabase.from("public_recipes").upsert(
    {
      id: params.id,
      user_id: params.userId,
      title: params.title,
      url: params.url,
      source: params.source,
      image_url: params.imageUrl,
      ingredients: params.ingredients,
      author_name: params.authorName,
      created_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    console.log("[PublicRecipes] Publish error:", error.message);
    throw new Error(error.message);
  }
  console.log("[PublicRecipes] Published successfully");
}

export async function unpublishRecipe(id: string): Promise<void> {
  console.log("[PublicRecipes] Unpublishing recipe:", id);
  const { error } = await supabase.from("public_recipes").delete().eq("id", id);

  if (error) {
    console.log("[PublicRecipes] Unpublish error:", error.message);
    throw new Error(error.message);
  }
}

export async function searchPublicRecipes(query: string): Promise<PublicRecipe[]> {
  console.log("[PublicRecipes] Searching:", query);
  const { data, error } = await supabase
    .from("public_recipes")
    .select("*")
    .ilike("title", `%${query}%`)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    console.log("[PublicRecipes] Search error:", error.message);
    throw new Error(error.message);
  }
  return (data as PublicRecipe[]) || [];
}

export async function getRecentPublicRecipes(): Promise<PublicRecipe[]> {
  console.log("[PublicRecipes] Fetching recent public recipes");
  const { data, error } = await supabase
    .from("public_recipes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    console.log("[PublicRecipes] Fetch error:", error.message);
    throw new Error(error.message);
  }
  return (data as PublicRecipe[]) || [];
}

export async function findPublicRecipeByUrl(url: string): Promise<PublicRecipe | null> {
  console.log("[PublicRecipes] Looking up URL:", url);
  const normalizedUrl = url.trim().replace(/\/+$/, "");
  const { data, error } = await supabase
    .from("public_recipes")
    .select("*")
    .eq("url", normalizedUrl)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.log("[PublicRecipes] URL lookup error:", error.message);
    return null;
  }
  if (data) {
    console.log("[PublicRecipes] Found existing public recipe for URL:", data.title);
  }
  return data as PublicRecipe | null;
}
