import { Image } from "expo-image";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import {
  ShoppingBasket,
  Check,
  ExternalLink,
  ChevronLeft,
  UtensilsCrossed,
} from "lucide-react-native";
import React, { useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";

import Colors from "@/constants/colors";
import { useChase } from "@/contexts/ChaseContext";
import { Ingredient } from "@/types";

const CATEGORY_LABELS: Record<string, string> = {
  produce: "🥬 Produce",
  fruits_vegetables: "🍎 Fruits & Vegetables",
  dairy: "🥛 Dairy & Eggs",
  meat: "🥩 Meat",
  seafood: "🐟 Seafood",
  bakery: "🍞 Bakery",
  pantry: "🫙 Pantry Staples",
  frozen: "🧊 Frozen",
  beverages: "🥤 Beverages",
  spices: "🧂 Spices & Seasonings",
  other: "📦 Other",
};

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { recipes, checkRecipeAgainstPantry, generateGroceryList } = useChase();

  const recipe = useMemo(
    () => recipes.find((r) => r.id === id),
    [recipes, id]
  );

  const checkedIngredients = useMemo(() => {
    if (!recipe) return [];
    return checkRecipeAgainstPantry(recipe.ingredients);
  }, [recipe, checkRecipeAgainstPantry]);

  const groupedIngredients = useMemo(() => {
    const groups: Record<string, (Ingredient & { inPantry: boolean })[]> = {};
    checkedIngredients.forEach((ing) => {
      if (!groups[ing.category]) groups[ing.category] = [];
      groups[ing.category].push(ing);
    });
    return groups;
  }, [checkedIngredients]);

  const missingCount = useMemo(
    () => checkedIngredients.filter((i) => !i.inPantry).length,
    [checkedIngredients]
  );

  const handleGenerateGroceryList = useCallback(() => {
    if (!recipe) return;
    const list = generateGroceryList(recipe);
    Alert.alert(
      "Grocery List Created",
      `Added ${list.items.length} items to your grocery list.`,
      [
        { text: "View List", onPress: () => router.push("/groceries") },
        { text: "OK" },
      ]
    );
  }, [recipe, generateGroceryList, router]);

  if (!recipe) {
    return (
      <View style={styles.notFound}>
        <Stack.Screen options={{ title: "Not Found" }} />
        <Text style={styles.notFoundText}>Recipe not found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.notFoundButton}
        >
          <ChevronLeft size={18} color={Colors.primary} />
          <Text style={styles.notFoundLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "",
          headerBackTitle: "Recipes",
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.primary,
        }}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image
          source={{ uri: recipe.imageUrl }}
          style={styles.heroImage}
          contentFit="cover"
        />

        <View style={styles.content}>
          <Text style={styles.title}>{recipe.title}</Text>

          <TouchableOpacity
            style={styles.sourceButton}
            onPress={() => Linking.openURL(recipe.url)}
            activeOpacity={0.7}
          >
            <ExternalLink size={14} color={Colors.primary} />
            <Text style={styles.sourceText}>{recipe.source}</Text>
          </TouchableOpacity>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <UtensilsCrossed size={16} color={Colors.text} />
              <Text style={styles.statNumber}>{recipe.ingredients.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={[styles.statCard, styles.statCardSuccess]}>
              <Check size={16} color={Colors.success} />
              <Text style={[styles.statNumber, { color: Colors.success }]}>
                {recipe.ingredients.length - missingCount}
              </Text>
              <Text style={styles.statLabel}>In Pantry</Text>
            </View>
            <View style={[styles.statCard, styles.statCardWarning]}>
              <ShoppingBasket size={16} color={Colors.primary} />
              <Text style={[styles.statNumber, { color: Colors.primary }]}>
                {missingCount}
              </Text>
              <Text style={styles.statLabel}>Missing</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerateGroceryList}
            activeOpacity={0.8}
            testID="generate-grocery-list"
          >
            <ShoppingBasket size={20} color={Colors.textOnPrimary} />
            <Text style={styles.generateButtonText}>Generate Grocery List</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Ingredients</Text>
          {missingCount > 0 && (
            <View style={styles.missingBanner}>
              <Text style={styles.missingBannerText}>
                {missingCount} item{missingCount !== 1 ? "s" : ""} not in your pantry
              </Text>
            </View>
          )}

          {Object.entries(groupedIngredients).map(([category, ingredients]) => (
            <View key={category} style={styles.categoryGroup}>
              <Text style={styles.categoryLabel}>
                {CATEGORY_LABELS[category] || category}
              </Text>
              {ingredients.map((ing) => (
                <View
                  key={ing.id}
                  style={[
                    styles.ingredientRow,
                    ing.inPantry ? styles.ingredientInPantry : styles.ingredientMissing,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: ing.inPantry ? Colors.inPantryText : Colors.primary },
                    ]}
                  />
                  <View style={styles.ingredientInfo}>
                    <Text
                      style={[
                        styles.ingredientName,
                        ing.inPantry && styles.ingredientNameInPantry,
                      ]}
                    >
                      {ing.name}
                    </Text>
                    <Text style={styles.ingredientQty}>
                      {ing.quantity} {ing.unit}
                    </Text>
                  </View>
                  {ing.inPantry ? (
                    <View style={styles.pantryTag}>
                      <Check size={12} color={Colors.inPantryText} />
                      <Text style={styles.pantryTagText}>In pantry</Text>
                    </View>
                  ) : (
                    <View style={styles.missingTag}>
                      <Text style={styles.missingTagText}>Need</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  heroImage: {
    width: "100%",
    height: 260,
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: "800" as const,
    color: Colors.text,
    marginBottom: 8,
    lineHeight: 30,
  },
  sourceButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
    backgroundColor: Colors.surfaceAlt,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sourceText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "500" as const,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 4,
  },
  statCardSuccess: {
    backgroundColor: Colors.inPantry,
    borderColor: "rgba(58, 125, 74, 0.15)",
  },
  statCardWarning: {
    backgroundColor: Colors.missing,
    borderColor: "rgba(200, 75, 49, 0.15)",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "500" as const,
  },
  generateButton: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 28,
  },
  generateButtonText: {
    color: Colors.textOnPrimary,
    fontSize: 16,
    fontWeight: "700" as const,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 12,
  },
  missingBanner: {
    backgroundColor: Colors.missing,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  missingBannerText: {
    color: Colors.missingText,
    fontSize: 13,
    fontWeight: "600" as const,
    textAlign: "center",
  },
  categoryGroup: {
    marginBottom: 20,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 6,
    gap: 12,
  },
  ingredientInPantry: {
    backgroundColor: Colors.inPantry,
  },
  ingredientMissing: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  ingredientNameInPantry: {
    color: Colors.inPantryText,
  },
  ingredientQty: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  pantryTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(58, 125, 74, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pantryTagText: {
    fontSize: 11,
    color: Colors.inPantryText,
    fontWeight: "600" as const,
  },
  missingTag: {
    backgroundColor: "rgba(200, 75, 49, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  missingTagText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: "600" as const,
  },
  notFound: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  notFoundText: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  notFoundButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  notFoundLink: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: "600" as const,
  },
});
