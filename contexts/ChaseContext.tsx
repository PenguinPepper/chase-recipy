import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { publishRecipe, unpublishRecipe } from "@/lib/publicRecipes";
import { shareGroceryList } from "@/lib/sharedGrocery";
import { Recipe, GroceryList, GroceryItem, PantryItem, Ingredient } from "@/types";

const RECIPES_KEY = "chase_recipes";
const GROCERY_LISTS_KEY = "chase_grocery_lists";
const PANTRY_KEY = "chase_pantry";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

async function loadFromSupabase<T>(userId: string, dataKey: string): Promise<T | null> {
  try {
    console.log(`[Chase] Loading ${dataKey} from Supabase for user ${userId}`);
    const { data, error } = await supabase
      .from("user_data")
      .select("data_value")
      .eq("user_id", userId)
      .eq("data_key", dataKey)
      .maybeSingle();

    if (error) {
      console.log(`[Chase] Supabase load error for ${dataKey}:`, error.message);
      return null;
    }
    if (data?.data_value) {
      console.log(`[Chase] Loaded ${dataKey} from Supabase`);
      return data.data_value as T;
    }
    return null;
  } catch (e) {
    console.log(`[Chase] Supabase load exception for ${dataKey}:`, e);
    return null;
  }
}

async function saveToSupabase(userId: string, dataKey: string, value: unknown): Promise<void> {
  try {
    console.log(`[Chase] Saving ${dataKey} to Supabase for user ${userId}`);
    const { error } = await supabase
      .from("user_data")
      .upsert(
        {
          user_id: userId,
          data_key: dataKey,
          data_value: value,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,data_key" }
      );

    if (error) {
      console.log(`[Chase] Supabase save error for ${dataKey}:`, error.message);
    } else {
      console.log(`[Chase] Saved ${dataKey} to Supabase`);
    }
  } catch (e) {
    console.log(`[Chase] Supabase save exception for ${dataKey}:`, e);
  }
}

export const [ChaseProvider, useChase] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [groceryLists, setGroceryLists] = useState<GroceryList[]>([]);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);

  const userId = user?.id;

  const recipesQuery = useQuery({
    queryKey: ["recipes", userId],
    queryFn: async () => {
      if (userId) {
        const remote = await loadFromSupabase<Recipe[]>(userId, "recipes");
        if (remote) {
          await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(remote));
          return remote;
        }
      }
      const stored = await AsyncStorage.getItem(RECIPES_KEY);
      return stored ? (JSON.parse(stored) as Recipe[]) : [];
    },
    enabled: !!(isAuthenticated && userId),
  });

  const groceryQuery = useQuery({
    queryKey: ["groceryLists", userId],
    queryFn: async () => {
      if (userId) {
        const remote = await loadFromSupabase<GroceryList[]>(userId, "grocery_lists");
        if (remote) {
          await AsyncStorage.setItem(GROCERY_LISTS_KEY, JSON.stringify(remote));
          return remote;
        }
      }
      const stored = await AsyncStorage.getItem(GROCERY_LISTS_KEY);
      return stored ? (JSON.parse(stored) as GroceryList[]) : [];
    },
    enabled: !!(isAuthenticated && userId),
  });

  const pantryQuery = useQuery({
    queryKey: ["pantry", userId],
    queryFn: async () => {
      if (userId) {
        const remote = await loadFromSupabase<PantryItem[]>(userId, "pantry_items");
        if (remote) {
          await AsyncStorage.setItem(PANTRY_KEY, JSON.stringify(remote));
          return remote;
        }
      }
      const stored = await AsyncStorage.getItem(PANTRY_KEY);
      return stored ? (JSON.parse(stored) as PantryItem[]) : [];
    },
    enabled: !!(isAuthenticated && userId),
  });

  useEffect(() => {
    if (recipesQuery.data) setRecipes(recipesQuery.data);
  }, [recipesQuery.data]);

  useEffect(() => {
    if (groceryQuery.data) setGroceryLists(groceryQuery.data);
  }, [groceryQuery.data]);

  useEffect(() => {
    if (pantryQuery.data) setPantryItems(pantryQuery.data);
  }, [pantryQuery.data]);

  const persistRecipes = useCallback(
    async (updated: Recipe[]) => {
      await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(updated));
      if (userId) await saveToSupabase(userId, "recipes", updated);
    },
    [userId]
  );

  const persistGrocery = useCallback(
    async (updated: GroceryList[]) => {
      await AsyncStorage.setItem(GROCERY_LISTS_KEY, JSON.stringify(updated));
      if (userId) await saveToSupabase(userId, "grocery_lists", updated);
    },
    [userId]
  );

  const persistPantry = useCallback(
    async (updated: PantryItem[]) => {
      await AsyncStorage.setItem(PANTRY_KEY, JSON.stringify(updated));
      if (userId) await saveToSupabase(userId, "pantry_items", updated);
    },
    [userId]
  );

  const { mutate: saveRecipes } = useMutation({
    mutationFn: persistRecipes,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recipes", userId] }),
  });

  const { mutate: saveGrocery } = useMutation({
    mutationFn: persistGrocery,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groceryLists", userId] }),
  });

  const { mutate: savePantry } = useMutation({
    mutationFn: persistPantry,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pantry", userId] }),
  });

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Chef";

  const addRecipe = useCallback(
    (recipe: Omit<Recipe, "id" | "createdAt">) => {
      const newRecipe: Recipe = {
        ...recipe,
        id: generateId(),
        createdAt: new Date().toISOString(),
        userId: userId || undefined,
        authorName: displayName,
      };
      const updated = [newRecipe, ...recipes];
      setRecipes(updated);
      saveRecipes(updated);

      if (newRecipe.isPublic && userId) {
        publishRecipe({
          id: newRecipe.id,
          userId,
          title: newRecipe.title,
          url: newRecipe.url,
          source: newRecipe.source,
          imageUrl: newRecipe.imageUrl,
          ingredients: newRecipe.ingredients,
          authorName: displayName,
        }).catch((err) => console.log("[Chase] Publish error:", err));
      }
      return newRecipe;
    },
    [recipes, saveRecipes, userId, displayName]
  );

  const deleteRecipe = useCallback(
    (id: string) => {
      const recipe = recipes.find((r) => r.id === id);
      if (recipe?.isPublic) {
        unpublishRecipe(id).catch((err) => console.log("[Chase] Unpublish error:", err));
      }
      const updatedRecipes = recipes.filter((r) => r.id !== id);
      setRecipes(updatedRecipes);
      saveRecipes(updatedRecipes);
      const updatedLists = groceryLists.filter((g) => g.recipeId !== id);
      setGroceryLists(updatedLists);
      saveGrocery(updatedLists);
    },
    [recipes, groceryLists, saveRecipes, saveGrocery]
  );

  const toggleRecipePublic = useCallback(
    (id: string) => {
      const recipe = recipes.find((r) => r.id === id);
      if (!recipe || !userId) return;

      const newPublic = !recipe.isPublic;
      const updated = recipes.map((r) =>
        r.id === id ? { ...r, isPublic: newPublic } : r
      );
      setRecipes(updated);
      saveRecipes(updated);

      if (newPublic) {
        publishRecipe({
          id: recipe.id,
          userId,
          title: recipe.title,
          url: recipe.url,
          source: recipe.source,
          imageUrl: recipe.imageUrl,
          ingredients: recipe.ingredients,
          authorName: displayName,
        }).catch((err) => console.log("[Chase] Publish error:", err));
      } else {
        unpublishRecipe(id).catch((err) => console.log("[Chase] Unpublish error:", err));
      }
    },
    [recipes, saveRecipes, userId, displayName]
  );

  const generateGroceryList = useCallback(
    (recipe: Recipe) => {
      const pantryNames = pantryItems.map((p) => p.name.toLowerCase());
      const items: GroceryItem[] = recipe.ingredients.map((ing) => ({
        id: generateId(),
        ingredientId: ing.id,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        category: ing.category,
        checked: false,
        inPantry: pantryNames.includes(ing.name.toLowerCase()),
      }));

      const newList: GroceryList = {
        id: generateId(),
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        items,
        createdAt: new Date().toISOString(),
      };

      const updated = [newList, ...groceryLists];
      setGroceryLists(updated);
      saveGrocery(updated);
      return newList;
    },
    [pantryItems, groceryLists, saveGrocery]
  );

  const shareList = useCallback(
    async (listId: string): Promise<string> => {
      const list = groceryLists.find((g) => g.id === listId);
      if (!list) throw new Error("List not found");
      if (!userId) throw new Error("Not authenticated");

      if (list.shareCode) {
        console.log("[Chase] List already shared with code:", list.shareCode);
        return list.shareCode;
      }

      const code = await shareGroceryList({
        id: list.id,
        recipeId: list.recipeId,
        recipeTitle: list.recipeTitle,
        items: list.items,
        createdBy: userId,
        authorName: displayName,
      });

      const updated = groceryLists.map((g) =>
        g.id === listId ? { ...g, shareCode: code } : g
      );
      setGroceryLists(updated);
      saveGrocery(updated);
      return code;
    },
    [groceryLists, saveGrocery, userId, displayName]
  );

  const importSharedList = useCallback(
    (sharedList: { recipeTitle: string; items: GroceryItem[] }) => {
      const pantryNames = pantryItems.map((p) => p.name.toLowerCase());
      const items: GroceryItem[] = sharedList.items.map((item) => ({
        ...item,
        id: generateId(),
        checked: false,
        inPantry: pantryNames.includes(item.name.toLowerCase()),
      }));

      const newList: GroceryList = {
        id: generateId(),
        recipeId: "",
        recipeTitle: sharedList.recipeTitle,
        items,
        createdAt: new Date().toISOString(),
      };

      const updated = [newList, ...groceryLists];
      setGroceryLists(updated);
      saveGrocery(updated);
      return newList;
    },
    [pantryItems, groceryLists, saveGrocery]
  );

  const toggleGroceryItem = useCallback(
    (listId: string, itemId: string) => {
      const updated = groceryLists.map((list) => {
        if (list.id !== listId) return list;
        return {
          ...list,
          items: list.items.map((item) =>
            item.id === itemId ? { ...item, checked: !item.checked } : item
          ),
        };
      });
      setGroceryLists(updated);
      saveGrocery(updated);
    },
    [groceryLists, saveGrocery]
  );

  const deleteGroceryList = useCallback(
    (id: string) => {
      const updated = groceryLists.filter((g) => g.id !== id);
      setGroceryLists(updated);
      saveGrocery(updated);
    },
    [groceryLists, saveGrocery]
  );

  const addPantryItem = useCallback(
    (name: string, category: PantryItem["category"]) => {
      const exists = pantryItems.some(
        (p) => p.name.toLowerCase() === name.toLowerCase()
      );
      if (exists) return;

      const newItem: PantryItem = {
        id: generateId(),
        name,
        category,
        addedAt: new Date().toISOString(),
      };
      const updated = [newItem, ...pantryItems];
      setPantryItems(updated);
      savePantry(updated);
    },
    [pantryItems, savePantry]
  );

  const removePantryItem = useCallback(
    (id: string) => {
      const updated = pantryItems.filter((p) => p.id !== id);
      setPantryItems(updated);
      savePantry(updated);
    },
    [pantryItems, savePantry]
  );

  const checkRecipeAgainstPantry = useCallback(
    (ingredients: Ingredient[]) => {
      const pantryNames = pantryItems.map((p) => p.name.toLowerCase());
      return ingredients.map((ing) => ({
        ...ing,
        inPantry: pantryNames.includes(ing.name.toLowerCase()),
      }));
    },
    [pantryItems]
  );

  const isLoading =
    recipesQuery.isLoading || groceryQuery.isLoading || pantryQuery.isLoading;

  return {
    recipes,
    groceryLists,
    pantryItems,
    isLoading,
    addRecipe,
    deleteRecipe,
    toggleRecipePublic,
    generateGroceryList,
    toggleGroceryItem,
    deleteGroceryList,
    addPantryItem,
    removePantryItem,
    checkRecipeAgainstPantry,
    shareList,
    importSharedList,
  };
});
