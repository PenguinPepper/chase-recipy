import { Stack } from "expo-router";
import { Plus, Trash2, Search, ChevronDown } from "lucide-react-native";
import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import Colors from "@/constants/colors";
import { useChase } from "@/contexts/ChaseContext";
import { PantryItem, IngredientCategory } from "@/types";
import { categorizeIngredient } from "@/utils/recipeExtractor";

const CATEGORIES: { value: IngredientCategory; label: string; emoji: string }[] = [
  { value: "produce", label: "Produce", emoji: "🥬" },
  { value: "fruits_vegetables", label: "Fruits & Vegetables", emoji: "🍎" },
  { value: "dairy", label: "Dairy & Eggs", emoji: "🥛" },
  { value: "meat", label: "Meat", emoji: "🥩" },
  { value: "seafood", label: "Seafood", emoji: "🐟" },
  { value: "bakery", label: "Bakery", emoji: "🍞" },
  { value: "pantry", label: "Pantry Staples", emoji: "🫙" },
  { value: "frozen", label: "Frozen", emoji: "🧊" },
  { value: "beverages", label: "Beverages", emoji: "🥤" },
  { value: "spices", label: "Spices", emoji: "🧂" },
  { value: "other", label: "Other", emoji: "📦" },
];

export default function PantryScreen() {
  const { pantryItems, addPantryItem, removePantryItem } = useChase();
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [newItemName, setNewItemName] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<IngredientCategory>("pantry");
  const [showCategoryPicker, setShowCategoryPicker] = useState<boolean>(false);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return pantryItems;
    const q = searchQuery.toLowerCase();
    return pantryItems.filter((item) => item.name.toLowerCase().includes(q));
  }, [pantryItems, searchQuery]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, PantryItem[]> = {};
    filteredItems.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  const handleAddItem = useCallback(() => {
    const trimmed = newItemName.trim();
    if (!trimmed) {
      Alert.alert("Enter a name", "Please enter the item name.");
      return;
    }
    addPantryItem(trimmed, selectedCategory);
    setNewItemName("");
    setShowAddModal(false);
  }, [newItemName, selectedCategory, addPantryItem]);

  const handleRemoveItem = useCallback(
    (item: PantryItem) => {
      Alert.alert("Remove Item", `Remove "${item.name}" from pantry?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removePantryItem(item.id),
        },
      ]);
    },
    [removePantryItem]
  );

  const handleNameChange = useCallback((text: string) => {
    setNewItemName(text);
    if (text.trim().length > 1) {
      const auto = categorizeIngredient(text.trim());
      setSelectedCategory(auto);
    }
  }, []);

  const selectedCategoryData = CATEGORIES.find((c) => c.value === selectedCategory);

  const sections = Object.entries(groupedItems);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Pantry",
          headerRight: () =>
            pantryItems.length > 0 ? (
              <TouchableOpacity
                onPress={() => setShowAddModal(true)}
                style={styles.headerButton}
                testID="add-pantry-button"
              >
                <Plus size={22} color={Colors.primary} />
              </TouchableOpacity>
            ) : null,
        }}
      />

      {pantryItems.length > 0 && (
        <View style={styles.searchContainer}>
          <Search size={18} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search pantry..."
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            testID="pantry-search"
          />
        </View>
      )}

      {pantryItems.length > 0 ? (
        <FlatList
          data={sections}
          keyExtractor={([category]) => category}
          renderItem={({ item: [category, items] }) => (
            <View style={styles.categorySection}>
              <Text style={styles.categoryHeader}>
                {CATEGORIES.find((c) => c.value === category)?.emoji || "📦"}{" "}
                {CATEGORIES.find((c) => c.value === category)?.label || category}
                <Text style={styles.categoryCount}> ({items.length})</Text>
              </Text>
              {items.map((pantryItem) => (
                <View key={pantryItem.id} style={styles.pantryItemRow}>
                  <View style={styles.pantryItemDot} />
                  <Text style={styles.pantryItemName}>{pantryItem.name}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveItem(pantryItem)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    testID={`remove-pantry-${pantryItem.id}`}
                  >
                    <Trash2 size={16} color={Colors.textTertiary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            searchQuery ? (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>
                  {"No items match your search"}
                </Text>
              </View>
            ) : null
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Text style={{ fontSize: 36 }}>📦</Text>
          </View>
          <Text style={styles.emptyTitle}>Your pantry is empty</Text>
          <Text style={styles.emptySubtitle}>
            {"Add items you have at home to\nsee what you need for recipes"}
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => setShowAddModal(true)}
            testID="empty-add-pantry"
          >
            <Plus size={18} color={Colors.textOnPrimary} />
            <Text style={styles.emptyButtonText}>Add Pantry Item</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add to Pantry</Text>
            <TouchableOpacity onPress={handleAddItem}>
              <Text style={styles.modalDone}>Add</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalLabel}>Item Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g., Olive Oil, Eggs, Garlic..."
              placeholderTextColor={Colors.textTertiary}
              value={newItemName}
              onChangeText={handleNameChange}
              autoFocus
              testID="pantry-item-input"
            />

            <Text style={styles.modalLabel}>Category</Text>
            <TouchableOpacity
              style={styles.categorySelector}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <Text style={styles.categorySelectorText}>
                {selectedCategoryData?.emoji} {selectedCategoryData?.label}
              </Text>
              <ChevronDown size={18} color={Colors.textSecondary} />
            </TouchableOpacity>

            {showCategoryPicker && (
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.categoryChip,
                      selectedCategory === cat.value && styles.categoryChipSelected,
                    ]}
                    onPress={() => {
                      setSelectedCategory(cat.value);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <Text style={styles.categoryChipEmoji}>{cat.emoji}</Text>
                    <Text
                      style={[
                        styles.categoryChipText,
                        selectedCategory === cat.value && styles.categoryChipTextSelected,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerButton: {
    padding: 4,
    marginRight: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 12,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryHeader: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  categoryCount: {
    fontWeight: "400" as const,
    color: Colors.textTertiary,
  },
  pantryItemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 12,
  },
  pantryItemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  pantryItemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500" as const,
    color: Colors.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
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
  noResults: {
    padding: 40,
    alignItems: "center",
  },
  noResultsText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  modalCancel: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  modalDone: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: "700" as const,
  },
  modalContent: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
  },
  modalInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  categorySelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  categorySelectorText: {
    fontSize: 16,
    color: Colors.text,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  categoryChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.inPantry,
  },
  categoryChipEmoji: {
    fontSize: 14,
  },
  categoryChipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500" as const,
  },
  categoryChipTextSelected: {
    color: Colors.primary,
    fontWeight: "600" as const,
  },
});
