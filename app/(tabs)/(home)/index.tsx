import { Image } from "expo-image";
import { useRouter, Stack } from "expo-router";
import { Plus, Link2, Clock, Trash2, UtensilsCrossed } from "lucide-react-native";
import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";

import Colors from "@/constants/colors";
import { useChase } from "@/contexts/ChaseContext";
import { Recipe } from "@/types";

export default function RecipesScreen() {
  const router = useRouter();
  const { recipes, deleteRecipe } = useChase();

  const handleDelete = useCallback(
    (recipe: Recipe) => {
      Alert.alert(
        "Delete Recipe",
        `Remove "${recipe.title}" and its grocery list?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => deleteRecipe(recipe.id),
          },
        ]
      );
    },
    [deleteRecipe]
  );

  const renderRecipeCard = useCallback(
    ({ item }: { item: Recipe }) => {
      const date = new Date(item.createdAt);
      const timeAgo = getTimeAgo(date);

      return (
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.7}
          onPress={() => router.push(`/recipe-detail?id=${item.id}`)}
          testID={`recipe-card-${item.id}`}
        >
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.cardImage}
            contentFit="cover"
          />
          <View style={styles.cardOverlay}>
            <View style={styles.timeBadge}>
              <Clock size={10} color="#FFFFFF" />
              <Text style={styles.timeBadgeText}>{timeAgo}</Text>
            </View>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.cardMeta}>
              <View style={styles.metaItem}>
                <Link2 size={12} color={Colors.textTertiary} />
                <Text style={styles.metaText} numberOfLines={1}>{item.source}</Text>
              </View>
            </View>
            <View style={styles.cardFooter}>
              <View style={styles.ingredientBadge}>
                <UtensilsCrossed size={11} color={Colors.primary} />
                <Text style={styles.ingredientCount}>
                  {item.ingredients.length} ingredients
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDelete(item)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.deleteButton}
                testID={`delete-recipe-${item.id}`}
              >
                <Trash2 size={15} color={Colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [router, handleDelete]
  );

  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <View style={styles.potIcon}>
            <Text style={styles.potIconText}>🍲</Text>
          </View>
        </View>
        <Text style={styles.emptyTitle}>No recipes yet</Text>
        <Text style={styles.emptySubtitle}>
          {"Paste a link to any recipe website\nor video to get started"}
        </Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => router.push("/add-recipe")}
          activeOpacity={0.8}
          testID="empty-add-recipe"
        >
          <Plus size={18} color={Colors.textOnPrimary} />
          <Text style={styles.emptyButtonText}>Add Your First Recipe</Text>
        </TouchableOpacity>
      </View>
    ),
    [router]
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "My Recipes",
          headerStyle: { backgroundColor: Colors.background },
          headerTitleStyle: { fontWeight: "700" as const, color: Colors.text, fontSize: 18 },
          headerRight: () =>
            recipes.length > 0 ? (
              <TouchableOpacity
                onPress={() => router.push("/add-recipe")}
                style={styles.headerButton}
                activeOpacity={0.7}
                testID="add-recipe-button"
              >
                <View style={styles.headerAddButton}>
                  <Plus size={18} color={Colors.textOnPrimary} />
                </View>
              </TouchableOpacity>
            ) : null,
        }}
      />
      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        renderItem={renderRecipeCard}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          recipes.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerButton: {
    marginRight: 4,
  },
  headerAddButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  listContentEmpty: {
    flex: 1,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cardImage: {
    width: "100%",
    height: 180,
  },
  cardOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(44, 24, 16, 0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeBadgeText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "600" as const,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 8,
    lineHeight: 23,
  },
  cardMeta: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ingredientBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  ingredientCount: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "600" as const,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyButtonText: {
    color: Colors.textOnPrimary,
    fontSize: 16,
    fontWeight: "600" as const,
  },
  potIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.cardBorder,
  },
  potIconText: {
    fontSize: 40,
  },
});
