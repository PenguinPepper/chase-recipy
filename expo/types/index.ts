export interface Recipe {
  id: string;
  title: string;
  url: string;
  source: string;
  imageUrl: string;
  ingredients: Ingredient[];
  createdAt: string;
  isPublic?: boolean;
  userId?: string;
  authorName?: string;
}

export interface PublicRecipe {
  id: string;
  user_id: string;
  title: string;
  url: string;
  source: string;
  image_url: string;
  ingredients: Ingredient[];
  author_name: string;
  created_at: string;
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
  shareCode?: string;
}

export interface SharedGroceryList {
  id: string;
  share_code: string;
  recipe_id: string;
  recipe_title: string;
  items: GroceryItem[];
  created_by: string;
  author_name: string;
  created_at: string;
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

export interface ProductMatch {
  name: string;
  price: number;
  currency: string;
  unitSize: string;
  unitPrice: number;
  unitLabel: string;
  store: string;
  url: string;
  imageUrl?: string;
}

export interface IngredientPrice {
  ingredientId: string;
  ingredientName: string;
  searchTerm: string;
  matches: ProductMatch[];
  bestMatch: ProductMatch | null;
  status: 'pending' | 'loading' | 'done' | 'error';
  error?: string;
}

export interface RecipeCostEstimate {
  recipeId: string;
  ingredientPrices: IngredientPrice[];
  totalEstimated: number;
  currency: string;
  storeBreakdown: StoreBreakdown[];
  fetchedAt: string;
}

export interface StoreBreakdown {
  store: string;
  total: number;
  itemCount: number;
  missingCount: number;
}
