import { supabase } from "@/lib/supabase";
import { GroceryItem, SharedGroceryList } from "@/types";

function generateShareCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function shareGroceryList(params: {
  id: string;
  recipeId: string;
  recipeTitle: string;
  items: GroceryItem[];
  createdBy: string;
  authorName: string;
}): Promise<string> {
  const shareCode = generateShareCode();
  console.log("[SharedGrocery] Sharing list:", params.recipeTitle, "code:", shareCode);

  const { error } = await supabase.from("shared_grocery_lists").upsert(
    {
      id: params.id,
      share_code: shareCode,
      recipe_id: params.recipeId,
      recipe_title: params.recipeTitle,
      items: params.items,
      created_by: params.createdBy,
      author_name: params.authorName,
      created_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    console.log("[SharedGrocery] Share error:", error.message);
    throw new Error(error.message);
  }
  console.log("[SharedGrocery] Shared successfully with code:", shareCode);
  return shareCode;
}

export async function getSharedGroceryList(shareCode: string): Promise<SharedGroceryList | null> {
  console.log("[SharedGrocery] Looking up share code:", shareCode);
  const { data, error } = await supabase
    .from("shared_grocery_lists")
    .select("*")
    .eq("share_code", shareCode.toUpperCase().trim())
    .maybeSingle();

  if (error) {
    console.log("[SharedGrocery] Lookup error:", error.message);
    return null;
  }
  return data as SharedGroceryList | null;
}
