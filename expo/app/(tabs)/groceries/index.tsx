import { useMutation } from "@tanstack/react-query";
import { useRouter, Stack } from "expo-router";
import { Check, Trash2, ShoppingBasket, Share2, Copy, Download } from "lucide-react-native";
import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from "react-native";

import Colors from "@/constants/colors";
import { useChase } from "@/contexts/ChaseContext";
import { getSharedGroceryList } from "@/lib/sharedGrocery";
import { GroceryList, GroceryItem } from "@/types";

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
  spices: "🧂 Spices",
  other: "📦 Other",
};

export default function GroceriesScreen() {
  const { groceryLists, toggleGroceryItem, deleteGroceryList, shareList, importSharedList } = useChase();
  const router = useRouter();
  const [shareCodeInput, setShareCodeInput] = React.useState<string>("");
  const [showImport, setShowImport] = React.useState<boolean>(false);

  const { mutate: doShare, isPending: isSharing } = useMutation({
    mutationFn: async (listId: string) => {
      return shareList(listId);
    },
    onSuccess: (code) => {
      Alert.alert(
        "List Shared!",
        `Share code: ${code}\n\nAnyone can import this grocery list using this code.`,
        [
          {
            text: "Copy Code",
            onPress: () => {
              try {
                const Clipboard = require("expo-clipboard");
                Clipboard.setStringAsync(code);
              } catch {
                console.log("[Grocery] Clipboard not available");
              }
            },
          },
          { text: "OK" },
        ]
      );
    },
    onError: (err: Error) => {
      Alert.alert("Share Failed", err.message);
    },
  });

  const { mutate: doImport, isPending: isImporting } = useMutation({
    mutationFn: async (code: string) => {
      const shared = await getSharedGroceryList(code);
      if (!shared) throw new Error("No list found with that code");
      return shared;
    },
    onSuccess: (shared) => {
      importSharedList({
        recipeTitle: shared.recipe_title,
        items: shared.items,
      });
      setShareCodeInput("");
      setShowImport(false);
      Alert.alert("Imported!", `Grocery list for "${shared.recipe_title}" has been added.`);
    },
    onError: (err: Error) => {
      Alert.alert("Import Failed", err.message);
    },
  });

  const handleDeleteList = useCallback(
    (list: GroceryList) => {
      Alert.alert("Delete List", `Remove grocery list for "${list.recipeTitle}"?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteGroceryList(list.id),
        },
      ]);
    },
    [deleteGroceryList]
  );

  const renderGroceryList = useCallback(
    ({ item: list }: { item: GroceryList }) => {
      const checkedCount = list.items.filter((i) => i.checked).length;
      const total = list.items.length;
      const progress = total > 0 ? checkedCount / total : 0;
      const inPantryCount = list.items.filter((i) => i.inPantry).length;

      const groupedItems: Record<string, GroceryItem[]> = {};
      list.items.forEach((item) => {
        if (!groupedItems[item.category]) groupedItems[item.category] = [];
        groupedItems[item.category].push(item);
      });

      return (
        <View style={styles.listCard}>
          <View style={styles.listHeader}>
            <View style={styles.listHeaderLeft}>
              <Text style={styles.listTitle} numberOfLines={1}>
                {list.recipeTitle}
              </Text>
              <Text style={styles.listSubtitle}>
                {checkedCount}/{total} items checked
                {inPantryCount > 0 ? ` · ${inPantryCount} in pantry` : ""}
              </Text>
              {list.shareCode && (
                <View style={styles.shareCodeBadge}>
                  <Share2 size={10} color={Colors.success} />
                  <Text style={styles.shareCodeText}>Code: {list.shareCode}</Text>
                </View>
              )}
            </View>
            <View style={styles.listActions}>
              <TouchableOpacity
                onPress={() => doShare(list.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.shareBtn}
              >
                <Share2 size={15} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteList(list)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.deleteBtn}
              >
                <Trash2 size={16} color={Colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
          </View>

          {Object.entries(groupedItems).map(([category, items]) => (
            <View key={category} style={styles.categorySection}>
              <Text style={styles.categoryLabel}>
                {CATEGORY_LABELS[category] || category}
              </Text>
              {items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.itemRow,
                    item.checked && styles.itemRowChecked,
                  ]}
                  onPress={() => toggleGroceryItem(list.id, item.id)}
                  activeOpacity={0.7}
                  testID={`grocery-item-${item.id}`}
                >
                  <View
                    style={[
                      styles.checkbox,
                      item.checked && styles.checkboxChecked,
                    ]}
                  >
                    {item.checked && <Check size={12} color={Colors.textOnPrimary} />}
                  </View>
                  <View style={styles.itemInfo}>
                    <Text
                      style={[
                        styles.itemName,
                        item.checked && styles.itemNameChecked,
                      ]}
                    >
                      {item.name}
                    </Text>
                    <Text style={styles.itemQty}>
                      {item.quantity} {item.unit}
                    </Text>
                  </View>
                  {item.inPantry && !item.checked && (
                    <View style={styles.inPantryBadge}>
                      <Text style={styles.inPantryBadgeText}>In pantry</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      );
    },
    [toggleGroceryItem, handleDeleteList]
  );

  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrap}>
          <ShoppingBasket size={36} color={Colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>No grocery lists</Text>
        <Text style={styles.emptySubtitle}>
          {"Generate a grocery list from\nany saved recipe"}
        </Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => router.push("/")}
          activeOpacity={0.8}
        >
          <Text style={styles.emptyButtonText}>Browse Recipes</Text>
        </TouchableOpacity>
      </View>
    ),
    [router]
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Grocery Lists",
          headerStyle: { backgroundColor: Colors.background },
          headerTitleStyle: { fontWeight: "700" as const, color: Colors.text, fontSize: 18 },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setShowImport(!showImport)}
              style={styles.headerImportBtn}
              activeOpacity={0.7}
            >
              <Download size={18} color={Colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      {showImport && (
        <View style={styles.importSection}>
          <Text style={styles.importTitle}>Import Shared List</Text>
          <View style={styles.importRow}>
            <View style={styles.importInputContainer}>
              <Copy size={16} color={Colors.textTertiary} />
              <TextInput
                style={styles.importInput}
                placeholder="Enter share code..."
                placeholderTextColor={Colors.textTertiary}
                value={shareCodeInput}
                onChangeText={setShareCodeInput}
                autoCapitalize="characters"
                maxLength={6}
                returnKeyType="go"
                onSubmitEditing={() => {
                  if (shareCodeInput.trim()) doImport(shareCodeInput.trim());
                }}
                testID="import-code-input"
              />
            </View>
            <TouchableOpacity
              style={[
                styles.importButton,
                (!shareCodeInput.trim() || isImporting) && styles.importButtonDisabled,
              ]}
              onPress={() => doImport(shareCodeInput.trim())}
              disabled={!shareCodeInput.trim() || isImporting}
              activeOpacity={0.7}
              testID="import-button"
            >
              <Text style={styles.importButtonText}>
                {isImporting ? "..." : "Import"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={groceryLists}
        keyExtractor={(item) => item.id}
        renderItem={renderGroceryList}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          groceryLists.length === 0 && styles.listContentEmpty,
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
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  listContentEmpty: {
    flex: 1,
  },
  listCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    paddingBottom: 12,
  },
  listHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  listTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  listSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  listActions: {
    flexDirection: "row",
    gap: 6,
  },
  shareBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.inPantry,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  shareCodeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  shareCodeText: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: "600" as const,
  },
  headerImportBtn: {
    marginRight: 4,
  },
  importSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  importTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  importRow: {
    flexDirection: "row",
    gap: 8,
  },
  importInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  importInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 10,
    letterSpacing: 2,
    fontWeight: "700" as const,
  },
  importButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  importButtonDisabled: {
    opacity: 0.5,
  },
  importButtonText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.textOnPrimary,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: Colors.divider,
    marginHorizontal: 16,
    borderRadius: 2,
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  categorySection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.textTertiary,
    marginBottom: 6,
    paddingLeft: 2,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 4,
    gap: 12,
  },
  itemRowChecked: {
    backgroundColor: Colors.surfaceAlt,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: Colors.text,
  },
  itemNameChecked: {
    textDecorationLine: "line-through",
    color: Colors.textTertiary,
  },
  itemQty: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  inPantryBadge: {
    backgroundColor: Colors.inPantry,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  inPantryBadgeText: {
    fontSize: 10,
    color: Colors.inPantryText,
    fontWeight: "600" as const,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
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
    marginBottom: 28,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyButtonText: {
    color: Colors.textOnPrimary,
    fontSize: 16,
    fontWeight: "600" as const,
  },
});
