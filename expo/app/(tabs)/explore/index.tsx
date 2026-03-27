import { Image } from "expo-image";
import { useMutation } from "@tanstack/react-query";
import { Stack } from "expo-router";
import {
  Search,
  Globe,
  ChefHat,
  UtensilsCrossed,
  Plus,
  Loader,
  TrendingUp,
} from "lucide-react-native";
import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
} from "react-native";

import Colors from "@/constants/colors";
import { useChase } from "@/contexts/ChaseContext";
import {
  searchPublicRecipes,
  getRecentPublicRecipes,
} from "@/lib/publicRecipes";
import { PublicRecipe, Ingredient } from "@/types";

export default function ExploreScreen() {
  const { addRecipe } = useChase();
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<PublicRecipe[]>([]);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const { mutate: doSearch, isPending: isSearching } = useMutation({
    mutationFn: async (q: string) => {
      if (q.trim()) {
        return searchPublicRecipes(q.trim());
      }
      return getRecentPublicRecipes();
    },
    onSuccess: (data) => {
      console.log("[Explore] Search results:", data.length);
      setResults(data);
      setHasSearched(true);
    },
    onError: (err) => {
      console.log("[Explore] Search error:", err);
      Alert.alert("Search Error", "Could not search recipes. Please try again.");
    },
  });

  const { mutate: loadRecent, isPending: isLoadingRecent } = useMutation({
    mutationFn: getRecentPublicRecipes,
    onSuccess: (data) => {
      console.log("[Explore] Recent recipes:", data.length);
      setResults(data);
    },
    onError: (err) => {
      console.log("[Explore] Load recent error:", err);
    },
  });

  useEffect(() => {
    loadRecent();
  }, []);

  const handleSearch = useCallback(() => {
    doSearch(query);
  }, [query, doSearch]);

  const handleSavePublicRecipe = useCallback(
    (recipe: PublicRecipe) => {
      const ingredients: Ingredient[] = (recipe.ingredients || []).map(
        (ing: Ingredient) => ({
          id: ing.id || Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
          name: ing.name,
          quantity: ing.quantity || "",
          unit: ing.unit || "",
          category: ing.category || "other",
        })
      );

      addRecipe({
        title: recipe.title,
        url: recipe.url,
        source: recipe.source,
        imageUrl: recipe.image_url,
        ingredients,
        isPublic: false,
      });

      Alert.alert("Saved!", `"${recipe.title}" has been added to your recipes.`);
    },
    [addRecipe]
  );

  const isPending = isSearching || isLoadingRecent;

  const renderRecipeCard = useCallback(
    ({ item }: { item: PublicRecipe }) => {
      const date = new Date(item.created_at);
      const dateStr = date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });

      return (
        <View style={styles.card}>
          <Image
            source={{ uri: item.image_url }}
            style={styles.cardImage}
            contentFit="cover"
          />
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>
            </View>
            <View style={styles.cardMeta}>
              <View style={styles.authorRow}>
                <ChefHat size={12} color={Colors.textTertiary} />
                <Text style={styles.authorText} numberOfLines={1}>
                  {item.author_name}
                </Text>
              </View>
              <View style={styles.metaRight}>
                <UtensilsCrossed size={11} color={Colors.primary} />
                <Text style={styles.ingredientCountText}>
                  {(item.ingredients || []).length}
                </Text>
              </View>
            </View>
            <View style={styles.cardFooter}>
              <View style={styles.sourceChip}>
                <Globe size={10} color={Colors.textTertiary} />
                <Text style={styles.sourceText} numberOfLines={1}>
                  {item.source}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => handleSavePublicRecipe(item)}
                activeOpacity={0.7}
                testID={`save-public-${item.id}`}
              >
                <Plus size={14} color={Colors.textOnPrimary} />
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    },
    [handleSavePublicRecipe]
  );

  const renderEmpty = useCallback(() => {
    if (isPending) {
      return (
        <View style={styles.emptyContainer}>
          <Animated.View>
            <Loader size={28} color={Colors.primary} />
          </Animated.View>
          <Text style={styles.emptySubtitle}>Loading recipes...</Text>
        </View>
      );
    }

    if (hasSearched && query.trim()) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Search size={32} color={Colors.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>No recipes found</Text>
          <Text style={styles.emptySubtitle}>
            {"Try a different search term or\nbrowse recent recipes"}
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => {
              setQuery("");
              loadRecent();
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.browseButtonText}>Browse Recent</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Globe size={32} color={Colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>Explore Recipes</Text>
        <Text style={styles.emptySubtitle}>
          {"Discover recipes shared by the\ncommunity. Search above or browse."}
        </Text>
      </View>
    );
  }, [isPending, hasSearched, query, loadRecent]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Explore",
          headerStyle: { backgroundColor: Colors.background },
          headerTitleStyle: {
            fontWeight: "700" as const,
            color: Colors.text,
            fontSize: 18,
          },
        }}
      />

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={18} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search community recipes..."
            placeholderTextColor={Colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            testID="explore-search-input"
          />
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          activeOpacity={0.7}
          testID="explore-search-button"
        >
          <Search size={18} color={Colors.textOnPrimary} />
        </TouchableOpacity>
      </View>

      {!hasSearched && results.length > 0 && (
        <View style={styles.sectionHeader}>
          <TrendingUp size={16} color={Colors.accent} />
          <Text style={styles.sectionHeaderText}>Recent Community Recipes</Text>
        </View>
      )}

      {hasSearched && query.trim() && results.length > 0 && (
        <View style={styles.sectionHeader}>
          <Search size={16} color={Colors.primary} />
          <Text style={styles.sectionHeaderText}>
            {results.length} result{results.length !== 1 ? "s" : ""}
          </Text>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderRecipeCard}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          results.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchSection: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 12,
  },
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.3,
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
    paddingBottom: 40,
  },
  listContentEmpty: {
    flex: 1,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    marginBottom: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cardImage: {
    width: "100%",
    height: 160,
  },
  cardContent: {
    padding: 14,
  },
  cardHeader: {
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
    lineHeight: 22,
  },
  cardMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flex: 1,
  },
  authorText: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: "500" as const,
  },
  metaRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  ingredientCountText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sourceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    marginRight: 10,
  },
  sourceText: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.textOnPrimary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  browseButton: {
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  browseButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
});
