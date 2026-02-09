export interface Recipe {
  id: string;
  title: string;
  url: string;
  source: string;
  imageUrl: string;
  ingredients: Ingredient[];
  createdAt: string;
}

export interface Ingredient {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  category: IngredientCategory;
}

export type IngredientCategory =
  | "produce"
  | "fruits_vegetables"
  | "dairy"
  | "meat"
  | "seafood"
  | "bakery"
  | "pantry"
  | "frozen"
  | "beverages"
  | "spices"
  | "other";

export interface GroceryList {
  id: string;
  recipeId: string;
  recipeTitle: string;
  items: GroceryItem[];
  createdAt: string;
}

export interface GroceryItem {
  id: string;
  ingredientId: string;
  name: string;
  quantity: string;
  unit: string;
  category: IngredientCategory;
  checked: boolean;
  inPantry: boolean;
}

export interface PantryItem {
  id: string;
  name: string;
  category: IngredientCategory;
  addedAt: string;
}
