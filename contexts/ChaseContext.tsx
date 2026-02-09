import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

import { Recipe, GroceryList, GroceryItem, PantryItem, Ingredient } from "@/types";

const RECIPES_KEY = "chase_recipes";
const GROCERY_LISTS_KEY = "chase_grocery_lists";
const PANTRY_KEY = "chase_pantry";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export const [ChaseProvider, useChase] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [groceryLists, setGroceryLists] = useState<GroceryList[]>([]);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);

  const recipesQuery = useQuery({
    queryKey: ["recipes"],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(RECIPES_KEY);
      return stored ? (JSON.parse(stored) as Recipe[]) : [];
    },
  });

  const groceryQuery = useQuery({
    queryKey: ["groceryLists"],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(GROCERY_LISTS_KEY);
      return stored ? (JSON.parse(stored) as GroceryList[]) : [];
    },
  });

  const pantryQuery = useQuery({
    queryKey: ["pantry"],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(PANTRY_KEY);
      return stored ? (JSON.parse(stored) as PantryItem[]) : [];
    },
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

  const { mutate: saveRecipes } = useMutation({
    mutationFn: async (updated: Recipe[]) => {
      await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recipes"] }),
  });

  const { mutate: saveGrocery } = useMutation({
    mutationFn: async (updated: GroceryList[]) => {
      await AsyncStorage.setItem(GROCERY_LISTS_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groceryLists"] }),
  });

  const { mutate: savePantry } = useMutation({
    mutationFn: async (updated: PantryItem[]) => {
      await AsyncStorage.setItem(PANTRY_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pantry"] }),
  });

  const addRecipe = useCallback(
    (recipe: Omit<Recipe, "id" | "createdAt">) => {
      const newRecipe: Recipe = {
        ...recipe,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      const updated = [newRecipe, ...recipes];
      setRecipes(updated);
      saveRecipes(updated);
      return newRecipe;
    },
    [recipes, saveRecipes]
  );

  const deleteRecipe = useCallback(
    (id: string) => {
      const updatedRecipes = recipes.filter((r) => r.id !== id);
      setRecipes(updatedRecipes);
      saveRecipes(updatedRecipes);
      const updatedLists = groceryLists.filter((g) => g.recipeId !== id);
      setGroceryLists(updatedLists);
      saveGrocery(updatedLists);
    },
    [recipes, groceryLists, saveRecipes, saveGrocery]
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
    generateGroceryList,
    toggleGroceryItem,
    deleteGroceryList,
    addPantryItem,
    removePantryItem,
    checkRecipeAgainstPantry,
  };
});
