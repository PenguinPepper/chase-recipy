import { Ingredient } from "@/types";

interface NormalizedForm {
  name: string;
  defaultQuantity: string;
  defaultUnit: string;
}

const NORMALIZATION_MAP: Record<string, NormalizedForm> = {
  "flour": { name: "all-purpose flour", defaultQuantity: "1", defaultUnit: "kg" },
  "white flour": { name: "all-purpose flour", defaultQuantity: "1", defaultUnit: "kg" },
  "ap flour": { name: "all-purpose flour", defaultQuantity: "1", defaultUnit: "kg" },
  "plain flour": { name: "all-purpose flour", defaultQuantity: "1", defaultUnit: "kg" },
  "bread flour": { name: "bread flour", defaultQuantity: "1", defaultUnit: "kg" },
  "cake flour": { name: "cake flour", defaultQuantity: "1", defaultUnit: "kg" },
  "self-rising flour": { name: "self-rising flour", defaultQuantity: "1", defaultUnit: "kg" },
  "self rising flour": { name: "self-rising flour", defaultQuantity: "1", defaultUnit: "kg" },
  "whole wheat flour": { name: "whole wheat flour", defaultQuantity: "1", defaultUnit: "kg" },

  "sugar": { name: "granulated white sugar", defaultQuantity: "1", defaultUnit: "kg" },
  "white sugar": { name: "granulated white sugar", defaultQuantity: "1", defaultUnit: "kg" },
  "brown sugar": { name: "light brown sugar", defaultQuantity: "500", defaultUnit: "g" },
  "powdered sugar": { name: "powdered (confectioners') sugar", defaultQuantity: "500", defaultUnit: "g" },
  "icing sugar": { name: "powdered (confectioners') sugar", defaultQuantity: "500", defaultUnit: "g" },
  "confectioners sugar": { name: "powdered (confectioners') sugar", defaultQuantity: "500", defaultUnit: "g" },
  "caster sugar": { name: "caster (superfine) sugar", defaultQuantity: "500", defaultUnit: "g" },

  "butter": { name: "unsalted butter", defaultQuantity: "250", defaultUnit: "g" },
  "salted butter": { name: "salted butter", defaultQuantity: "250", defaultUnit: "g" },
  "unsalted butter": { name: "unsalted butter", defaultQuantity: "250", defaultUnit: "g" },

  "oil": { name: "vegetable oil", defaultQuantity: "500", defaultUnit: "ml" },
  "cooking oil": { name: "vegetable oil", defaultQuantity: "500", defaultUnit: "ml" },
  "vegetable oil": { name: "vegetable oil", defaultQuantity: "500", defaultUnit: "ml" },
  "olive oil": { name: "extra-virgin olive oil", defaultQuantity: "500", defaultUnit: "ml" },
  "evoo": { name: "extra-virgin olive oil", defaultQuantity: "500", defaultUnit: "ml" },
  "canola oil": { name: "canola oil", defaultQuantity: "500", defaultUnit: "ml" },
  "sesame oil": { name: "toasted sesame oil", defaultQuantity: "250", defaultUnit: "ml" },
  "coconut oil": { name: "virgin coconut oil", defaultQuantity: "500", defaultUnit: "ml" },

  "milk": { name: "whole milk", defaultQuantity: "1", defaultUnit: "liter" },
  "whole milk": { name: "whole milk", defaultQuantity: "1", defaultUnit: "liter" },
  "skim milk": { name: "skim milk", defaultQuantity: "1", defaultUnit: "liter" },
  "cream": { name: "heavy cream (35% fat)", defaultQuantity: "500", defaultUnit: "ml" },
  "heavy cream": { name: "heavy cream (35% fat)", defaultQuantity: "500", defaultUnit: "ml" },
  "whipping cream": { name: "heavy whipping cream", defaultQuantity: "500", defaultUnit: "ml" },
  "half and half": { name: "half-and-half cream", defaultQuantity: "500", defaultUnit: "ml" },
  "sour cream": { name: "sour cream", defaultQuantity: "250", defaultUnit: "g" },
  "yogurt": { name: "plain whole-milk yogurt", defaultQuantity: "500", defaultUnit: "g" },
  "greek yogurt": { name: "plain Greek yogurt", defaultQuantity: "500", defaultUnit: "g" },
  "buttermilk": { name: "buttermilk", defaultQuantity: "500", defaultUnit: "ml" },

  "cheese": { name: "cheddar cheese", defaultQuantity: "200", defaultUnit: "g" },
  "cheddar": { name: "sharp cheddar cheese", defaultQuantity: "200", defaultUnit: "g" },
  "mozzarella": { name: "fresh mozzarella cheese", defaultQuantity: "250", defaultUnit: "g" },
  "parmesan": { name: "Parmigiano-Reggiano cheese", defaultQuantity: "100", defaultUnit: "g" },
  "parm": { name: "Parmigiano-Reggiano cheese", defaultQuantity: "100", defaultUnit: "g" },
  "cream cheese": { name: "cream cheese", defaultQuantity: "250", defaultUnit: "g" },
  "ricotta": { name: "ricotta cheese", defaultQuantity: "250", defaultUnit: "g" },
  "feta": { name: "feta cheese", defaultQuantity: "200", defaultUnit: "g" },
  "gouda": { name: "aged gouda cheese", defaultQuantity: "200", defaultUnit: "g" },
  "gruyere": { name: "Gruyère cheese", defaultQuantity: "200", defaultUnit: "g" },
  "brie": { name: "brie cheese", defaultQuantity: "200", defaultUnit: "g" },
  "goat cheese": { name: "soft goat cheese (chèvre)", defaultQuantity: "150", defaultUnit: "g" },
  "mascarpone": { name: "mascarpone cheese", defaultQuantity: "250", defaultUnit: "g" },

  "egg": { name: "large egg", defaultQuantity: "1", defaultUnit: "" },
  "eggs": { name: "large eggs", defaultQuantity: "12", defaultUnit: "" },

  "salt": { name: "fine sea salt", defaultQuantity: "500", defaultUnit: "g" },
  "sea salt": { name: "fine sea salt", defaultQuantity: "500", defaultUnit: "g" },
  "kosher salt": { name: "kosher salt (Diamond Crystal)", defaultQuantity: "500", defaultUnit: "g" },
  "table salt": { name: "fine table salt", defaultQuantity: "500", defaultUnit: "g" },
  "pepper": { name: "freshly ground black pepper", defaultQuantity: "100", defaultUnit: "g" },
  "black pepper": { name: "freshly ground black pepper", defaultQuantity: "100", defaultUnit: "g" },

  "rice": { name: "long-grain white rice", defaultQuantity: "1", defaultUnit: "kg" },
  "white rice": { name: "long-grain white rice", defaultQuantity: "1", defaultUnit: "kg" },
  "brown rice": { name: "long-grain brown rice", defaultQuantity: "1", defaultUnit: "kg" },
  "basmati": { name: "basmati rice", defaultQuantity: "1", defaultUnit: "kg" },
  "basmati rice": { name: "basmati rice", defaultQuantity: "1", defaultUnit: "kg" },
  "jasmine rice": { name: "jasmine rice", defaultQuantity: "1", defaultUnit: "kg" },
  "arborio": { name: "arborio rice (risotto)", defaultQuantity: "500", defaultUnit: "g" },
  "arborio rice": { name: "arborio rice (risotto)", defaultQuantity: "500", defaultUnit: "g" },

  "pasta": { name: "dried pasta (spaghetti)", defaultQuantity: "500", defaultUnit: "g" },
  "spaghetti": { name: "dried spaghetti", defaultQuantity: "500", defaultUnit: "g" },
  "penne": { name: "dried penne rigate", defaultQuantity: "500", defaultUnit: "g" },
  "linguine": { name: "dried linguine", defaultQuantity: "500", defaultUnit: "g" },
  "fettuccine": { name: "dried fettuccine", defaultQuantity: "500", defaultUnit: "g" },
  "rigatoni": { name: "dried rigatoni", defaultQuantity: "500", defaultUnit: "g" },
  "macaroni": { name: "dried elbow macaroni", defaultQuantity: "500", defaultUnit: "g" },
  "noodles": { name: "egg noodles", defaultQuantity: "500", defaultUnit: "g" },
  "ramen": { name: "ramen noodles", defaultQuantity: "400", defaultUnit: "g" },

  "chicken": { name: "boneless skinless chicken breast", defaultQuantity: "500", defaultUnit: "g" },
  "chicken breast": { name: "boneless skinless chicken breast", defaultQuantity: "500", defaultUnit: "g" },
  "chicken thigh": { name: "bone-in chicken thigh", defaultQuantity: "500", defaultUnit: "g" },
  "chicken thighs": { name: "bone-in chicken thighs", defaultQuantity: "500", defaultUnit: "g" },
  "ground chicken": { name: "ground chicken", defaultQuantity: "500", defaultUnit: "g" },

  "beef": { name: "beef chuck roast", defaultQuantity: "500", defaultUnit: "g" },
  "ground beef": { name: "ground beef (80/20)", defaultQuantity: "500", defaultUnit: "g" },
  "steak": { name: "ribeye steak", defaultQuantity: "300", defaultUnit: "g" },
  "pork": { name: "pork loin", defaultQuantity: "500", defaultUnit: "g" },
  "ground pork": { name: "ground pork", defaultQuantity: "500", defaultUnit: "g" },
  "pork chop": { name: "bone-in pork chop", defaultQuantity: "300", defaultUnit: "g" },
  "pork chops": { name: "bone-in pork chops", defaultQuantity: "600", defaultUnit: "g" },
  "bacon": { name: "thick-cut bacon", defaultQuantity: "250", defaultUnit: "g" },
  "sausage": { name: "Italian pork sausage", defaultQuantity: "500", defaultUnit: "g" },
  "lamb": { name: "lamb leg", defaultQuantity: "500", defaultUnit: "g" },
  "ground lamb": { name: "ground lamb", defaultQuantity: "500", defaultUnit: "g" },
  "ground turkey": { name: "ground turkey (93% lean)", defaultQuantity: "500", defaultUnit: "g" },
  "turkey": { name: "turkey breast", defaultQuantity: "500", defaultUnit: "g" },
  "ham": { name: "smoked ham", defaultQuantity: "500", defaultUnit: "g" },
  "prosciutto": { name: "prosciutto di Parma", defaultQuantity: "100", defaultUnit: "g" },
  "pancetta": { name: "diced pancetta", defaultQuantity: "150", defaultUnit: "g" },
  "guanciale": { name: "guanciale", defaultQuantity: "150", defaultUnit: "g" },

  "salmon": { name: "Atlantic salmon fillet", defaultQuantity: "500", defaultUnit: "g" },
  "shrimp": { name: "large raw shrimp, peeled & deveined", defaultQuantity: "500", defaultUnit: "g" },
  "prawns": { name: "large raw prawns, peeled & deveined", defaultQuantity: "500", defaultUnit: "g" },
  "tuna": { name: "fresh tuna steak", defaultQuantity: "300", defaultUnit: "g" },
  "cod": { name: "fresh cod fillet", defaultQuantity: "500", defaultUnit: "g" },
  "tilapia": { name: "tilapia fillet", defaultQuantity: "500", defaultUnit: "g" },
  "halibut": { name: "halibut fillet", defaultQuantity: "500", defaultUnit: "g" },
  "scallops": { name: "dry-packed sea scallops", defaultQuantity: "400", defaultUnit: "g" },

  "garlic": { name: "fresh garlic", defaultQuantity: "1", defaultUnit: "head" },
  "onion": { name: "yellow onion", defaultQuantity: "1", defaultUnit: "medium" },
  "onions": { name: "yellow onions", defaultQuantity: "2", defaultUnit: "medium" },
  "red onion": { name: "red onion", defaultQuantity: "1", defaultUnit: "medium" },
  "shallot": { name: "shallot", defaultQuantity: "2", defaultUnit: "" },
  "shallots": { name: "shallots", defaultQuantity: "3", defaultUnit: "" },
  "green onion": { name: "green onion (scallion)", defaultQuantity: "4", defaultUnit: "stalks" },
  "green onions": { name: "green onions (scallions)", defaultQuantity: "4", defaultUnit: "stalks" },
  "scallion": { name: "scallion", defaultQuantity: "4", defaultUnit: "stalks" },
  "scallions": { name: "scallions", defaultQuantity: "4", defaultUnit: "stalks" },
  "ginger": { name: "fresh ginger root", defaultQuantity: "1", defaultUnit: "piece" },
  "lemon": { name: "fresh lemon", defaultQuantity: "1", defaultUnit: "" },
  "lemons": { name: "fresh lemons", defaultQuantity: "3", defaultUnit: "" },
  "lime": { name: "fresh lime", defaultQuantity: "1", defaultUnit: "" },
  "limes": { name: "fresh limes", defaultQuantity: "3", defaultUnit: "" },

  "tomato": { name: "vine-ripened tomato", defaultQuantity: "1", defaultUnit: "large" },
  "tomatoes": { name: "vine-ripened tomatoes", defaultQuantity: "4", defaultUnit: "medium" },
  "cherry tomatoes": { name: "cherry tomatoes", defaultQuantity: "250", defaultUnit: "g" },
  "canned tomatoes": { name: "canned whole peeled tomatoes", defaultQuantity: "400", defaultUnit: "g" },
  "tomato paste": { name: "double-concentrated tomato paste", defaultQuantity: "150", defaultUnit: "g" },
  "tomato sauce": { name: "canned tomato sauce", defaultQuantity: "400", defaultUnit: "ml" },

  "potato": { name: "russet potato", defaultQuantity: "1", defaultUnit: "large" },
  "potatoes": { name: "russet potatoes", defaultQuantity: "4", defaultUnit: "medium" },
  "sweet potato": { name: "sweet potato", defaultQuantity: "1", defaultUnit: "large" },
  "sweet potatoes": { name: "sweet potatoes", defaultQuantity: "3", defaultUnit: "medium" },

  "carrot": { name: "carrot", defaultQuantity: "2", defaultUnit: "medium" },
  "carrots": { name: "carrots", defaultQuantity: "4", defaultUnit: "medium" },
  "celery": { name: "celery stalks", defaultQuantity: "3", defaultUnit: "stalks" },
  "bell pepper": { name: "bell pepper", defaultQuantity: "1", defaultUnit: "large" },
  "broccoli": { name: "broccoli crown", defaultQuantity: "1", defaultUnit: "head" },
  "cauliflower": { name: "cauliflower", defaultQuantity: "1", defaultUnit: "head" },
  "spinach": { name: "fresh baby spinach", defaultQuantity: "150", defaultUnit: "g" },
  "kale": { name: "lacinato kale", defaultQuantity: "1", defaultUnit: "bunch" },
  "lettuce": { name: "romaine lettuce", defaultQuantity: "1", defaultUnit: "head" },
  "cabbage": { name: "green cabbage", defaultQuantity: "1", defaultUnit: "head" },
  "mushroom": { name: "cremini mushrooms", defaultQuantity: "250", defaultUnit: "g" },
  "mushrooms": { name: "cremini mushrooms", defaultQuantity: "250", defaultUnit: "g" },
  "zucchini": { name: "zucchini", defaultQuantity: "2", defaultUnit: "medium" },
  "eggplant": { name: "eggplant", defaultQuantity: "1", defaultUnit: "large" },
  "avocado": { name: "ripe Hass avocado", defaultQuantity: "1", defaultUnit: "" },
  "avocados": { name: "ripe Hass avocados", defaultQuantity: "2", defaultUnit: "" },
  "cucumber": { name: "English cucumber", defaultQuantity: "1", defaultUnit: "" },
  "corn": { name: "sweet corn", defaultQuantity: "2", defaultUnit: "ears" },
  "asparagus": { name: "fresh asparagus", defaultQuantity: "1", defaultUnit: "bunch" },

  "cilantro": { name: "fresh cilantro", defaultQuantity: "1", defaultUnit: "bunch" },
  "parsley": { name: "fresh flat-leaf parsley", defaultQuantity: "1", defaultUnit: "bunch" },
  "basil": { name: "fresh basil", defaultQuantity: "1", defaultUnit: "bunch" },
  "rosemary": { name: "fresh rosemary", defaultQuantity: "3", defaultUnit: "sprigs" },
  "thyme": { name: "fresh thyme", defaultQuantity: "6", defaultUnit: "sprigs" },
  "dill": { name: "fresh dill", defaultQuantity: "1", defaultUnit: "bunch" },
  "mint": { name: "fresh mint", defaultQuantity: "1", defaultUnit: "bunch" },
  "sage": { name: "fresh sage", defaultQuantity: "8", defaultUnit: "leaves" },
  "chives": { name: "fresh chives", defaultQuantity: "1", defaultUnit: "bunch" },
  "oregano": { name: "dried oregano", defaultQuantity: "1", defaultUnit: "jar" },
  "bay leaf": { name: "dried bay leaf", defaultQuantity: "3", defaultUnit: "" },
  "bay leaves": { name: "dried bay leaves", defaultQuantity: "6", defaultUnit: "" },

  "cumin": { name: "ground cumin", defaultQuantity: "50", defaultUnit: "g" },
  "paprika": { name: "sweet paprika", defaultQuantity: "50", defaultUnit: "g" },
  "smoked paprika": { name: "smoked paprika (pimentón)", defaultQuantity: "50", defaultUnit: "g" },
  "cinnamon": { name: "ground cinnamon", defaultQuantity: "50", defaultUnit: "g" },
  "nutmeg": { name: "whole nutmeg", defaultQuantity: "1", defaultUnit: "" },
  "turmeric": { name: "ground turmeric", defaultQuantity: "50", defaultUnit: "g" },
  "cayenne": { name: "cayenne pepper", defaultQuantity: "50", defaultUnit: "g" },
  "chili powder": { name: "chili powder", defaultQuantity: "50", defaultUnit: "g" },
  "curry powder": { name: "curry powder", defaultQuantity: "50", defaultUnit: "g" },
  "red pepper flakes": { name: "crushed red pepper flakes", defaultQuantity: "50", defaultUnit: "g" },
  "garlic powder": { name: "garlic powder", defaultQuantity: "75", defaultUnit: "g" },
  "onion powder": { name: "onion powder", defaultQuantity: "75", defaultUnit: "g" },
  "italian seasoning": { name: "Italian seasoning blend", defaultQuantity: "30", defaultUnit: "g" },

  "soy sauce": { name: "low-sodium soy sauce", defaultQuantity: "250", defaultUnit: "ml" },
  "vinegar": { name: "white distilled vinegar", defaultQuantity: "500", defaultUnit: "ml" },
  "balsamic vinegar": { name: "balsamic vinegar of Modena", defaultQuantity: "250", defaultUnit: "ml" },
  "apple cider vinegar": { name: "raw apple cider vinegar", defaultQuantity: "500", defaultUnit: "ml" },
  "rice vinegar": { name: "seasoned rice vinegar", defaultQuantity: "250", defaultUnit: "ml" },
  "wine vinegar": { name: "red wine vinegar", defaultQuantity: "250", defaultUnit: "ml" },
  "hot sauce": { name: "hot sauce", defaultQuantity: "150", defaultUnit: "ml" },
  "worcestershire": { name: "Worcestershire sauce", defaultQuantity: "150", defaultUnit: "ml" },
  "fish sauce": { name: "fish sauce", defaultQuantity: "250", defaultUnit: "ml" },
  "oyster sauce": { name: "oyster sauce", defaultQuantity: "250", defaultUnit: "ml" },
  "sriracha": { name: "sriracha hot chili sauce", defaultQuantity: "250", defaultUnit: "ml" },
  "mustard": { name: "Dijon mustard", defaultQuantity: "200", defaultUnit: "g" },
  "dijon": { name: "Dijon mustard", defaultQuantity: "200", defaultUnit: "g" },
  "ketchup": { name: "tomato ketchup", defaultQuantity: "400", defaultUnit: "ml" },
  "mayo": { name: "mayonnaise", defaultQuantity: "400", defaultUnit: "g" },
  "mayonnaise": { name: "mayonnaise", defaultQuantity: "400", defaultUnit: "g" },

  "honey": { name: "raw honey", defaultQuantity: "500", defaultUnit: "g" },
  "maple syrup": { name: "pure maple syrup", defaultQuantity: "250", defaultUnit: "ml" },
  "vanilla": { name: "pure vanilla extract", defaultQuantity: "60", defaultUnit: "ml" },
  "vanilla extract": { name: "pure vanilla extract", defaultQuantity: "60", defaultUnit: "ml" },

  "baking powder": { name: "double-acting baking powder", defaultQuantity: "200", defaultUnit: "g" },
  "baking soda": { name: "baking soda (bicarbonate)", defaultQuantity: "250", defaultUnit: "g" },
  "yeast": { name: "active dry yeast", defaultQuantity: "7", defaultUnit: "g" },
  "cornstarch": { name: "cornstarch (corn flour)", defaultQuantity: "250", defaultUnit: "g" },
  "corn starch": { name: "cornstarch (corn flour)", defaultQuantity: "250", defaultUnit: "g" },
  "cocoa": { name: "unsweetened cocoa powder", defaultQuantity: "200", defaultUnit: "g" },
  "cocoa powder": { name: "unsweetened cocoa powder", defaultQuantity: "200", defaultUnit: "g" },
  "chocolate": { name: "semi-sweet chocolate", defaultQuantity: "200", defaultUnit: "g" },
  "chocolate chips": { name: "semi-sweet chocolate chips", defaultQuantity: "350", defaultUnit: "g" },
  "gelatin": { name: "unflavored gelatin powder", defaultQuantity: "7", defaultUnit: "g" },

  "broth": { name: "low-sodium chicken broth", defaultQuantity: "1", defaultUnit: "liter" },
  "chicken broth": { name: "low-sodium chicken broth", defaultQuantity: "1", defaultUnit: "liter" },
  "chicken stock": { name: "chicken stock", defaultQuantity: "1", defaultUnit: "liter" },
  "beef broth": { name: "low-sodium beef broth", defaultQuantity: "1", defaultUnit: "liter" },
  "beef stock": { name: "beef stock", defaultQuantity: "1", defaultUnit: "liter" },
  "vegetable broth": { name: "vegetable broth", defaultQuantity: "1", defaultUnit: "liter" },
  "stock": { name: "chicken stock", defaultQuantity: "1", defaultUnit: "liter" },

  "bread": { name: "crusty sourdough bread", defaultQuantity: "1", defaultUnit: "loaf" },
  "tortilla": { name: "flour tortilla (10-inch)", defaultQuantity: "8", defaultUnit: "" },
  "tortillas": { name: "flour tortillas (10-inch)", defaultQuantity: "8", defaultUnit: "" },
  "pita": { name: "pita bread", defaultQuantity: "6", defaultUnit: "" },
  "naan": { name: "naan bread", defaultQuantity: "4", defaultUnit: "" },

  "beans": { name: "canned black beans, drained", defaultQuantity: "400", defaultUnit: "g" },
  "black beans": { name: "canned black beans, drained", defaultQuantity: "400", defaultUnit: "g" },
  "chickpeas": { name: "canned chickpeas, drained", defaultQuantity: "400", defaultUnit: "g" },
  "lentils": { name: "dried green lentils", defaultQuantity: "500", defaultUnit: "g" },
  "kidney beans": { name: "canned kidney beans, drained", defaultQuantity: "400", defaultUnit: "g" },
  "white beans": { name: "canned cannellini beans, drained", defaultQuantity: "400", defaultUnit: "g" },

  "coconut milk": { name: "full-fat coconut milk", defaultQuantity: "400", defaultUnit: "ml" },
  "almond milk": { name: "unsweetened almond milk", defaultQuantity: "1", defaultUnit: "liter" },
  "oat milk": { name: "oat milk", defaultQuantity: "1", defaultUnit: "liter" },

  "tofu": { name: "extra-firm tofu", defaultQuantity: "400", defaultUnit: "g" },
  "tempeh": { name: "tempeh", defaultQuantity: "250", defaultUnit: "g" },

  "peanut butter": { name: "creamy peanut butter", defaultQuantity: "500", defaultUnit: "g" },
  "almond butter": { name: "almond butter", defaultQuantity: "350", defaultUnit: "g" },
  "tahini": { name: "tahini (sesame paste)", defaultQuantity: "250", defaultUnit: "g" },

  "wine": { name: "dry white wine", defaultQuantity: "750", defaultUnit: "ml" },
  "white wine": { name: "dry white wine", defaultQuantity: "750", defaultUnit: "ml" },
  "red wine": { name: "dry red wine", defaultQuantity: "750", defaultUnit: "ml" },

  "walnuts": { name: "walnut halves", defaultQuantity: "200", defaultUnit: "g" },
  "almonds": { name: "whole almonds", defaultQuantity: "200", defaultUnit: "g" },
  "pecans": { name: "pecan halves", defaultQuantity: "200", defaultUnit: "g" },
  "pine nuts": { name: "pine nuts", defaultQuantity: "100", defaultUnit: "g" },
  "cashews": { name: "raw cashews", defaultQuantity: "200", defaultUnit: "g" },
  "peanuts": { name: "roasted peanuts", defaultQuantity: "200", defaultUnit: "g" },
};

export interface NormalizationResult {
  original: string;
  normalized: string;
  defaultQuantity: string;
  defaultUnit: string;
  wasNormalized: boolean;
}

export function normalizeIngredientName(name: string): NormalizationResult {
  const lower = name.toLowerCase().trim();
  const match = NORMALIZATION_MAP[lower];

  if (match) {
    console.log(`[Normalizer] "${name}" → "${match.name}" (${match.defaultQuantity} ${match.defaultUnit})`);
    return {
      original: name,
      normalized: match.name,
      defaultQuantity: match.defaultQuantity,
      defaultUnit: match.defaultUnit,
      wasNormalized: true,
    };
  }

  return {
    original: name,
    normalized: name,
    defaultQuantity: "",
    defaultUnit: "",
    wasNormalized: false,
  };
}

export function normalizeIngredient(ingredient: Ingredient): { ingredient: Ingredient; wasNormalized: boolean } {
  const result = normalizeIngredientName(ingredient.name);

  if (!result.wasNormalized) {
    return { ingredient, wasNormalized: false };
  }

  const hasQuantity = ingredient.quantity && ingredient.quantity.trim() !== "";
  const hasUnit = ingredient.unit && ingredient.unit.trim() !== "";

  return {
    ingredient: {
      ...ingredient,
      name: result.normalized,
      quantity: hasQuantity ? ingredient.quantity : result.defaultQuantity,
      unit: hasUnit ? ingredient.unit : result.defaultUnit,
    },
    wasNormalized: true,
  };
}

export function normalizeIngredients(ingredients: Ingredient[]): {
  ingredients: Ingredient[];
  normalizedCount: number;
} {
  let normalizedCount = 0;
  const normalized = ingredients.map((ing) => {
    const result = normalizeIngredient(ing);
    if (result.wasNormalized) normalizedCount++;
    return result.ingredient;
  });

  console.log(`[Normalizer] Normalized ${normalizedCount}/${ingredients.length} ingredients`);
  return { ingredients: normalized, normalizedCount };
}

export function getNormalizationPreview(ingredient: Ingredient): NormalizationResult | null {
  const result = normalizeIngredientName(ingredient.name);
  if (!result.wasNormalized) return null;

  if (result.normalized.toLowerCase() === ingredient.name.toLowerCase()) {
    return null;
  }

  return result;
}

export function hasNormalizablIngredients(ingredients: Ingredient[]): boolean {
  return ingredients.some((ing) => {
    const result = normalizeIngredientName(ing.name);
    return result.wasNormalized && result.normalized.toLowerCase() !== ing.name.toLowerCase();
  });
}
