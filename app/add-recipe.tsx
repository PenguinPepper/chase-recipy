import { Image } from "expo-image";
import { useMutation } from "@tanstack/react-query";
import { useRouter, Stack } from "expo-router";
import {
  Link2,
  Loader,
  X,
  Sparkles,
  Plus,
  Trash2,
  ChevronRight,
  Edit3,
  CheckCircle2,
} from "lucide-react-native";
import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";

import Colors from "@/constants/colors";
import { useChase } from "@/contexts/ChaseContext";
import { Ingredient } from "@/types";
import {
  extractRecipeMetadata,
  createIngredientFromText,
  RecipeMetadata,
} from "@/utils/recipeExtractor";

type Step = "url" | "details";

export default function AddRecipeScreen() {
  const router = useRouter();
  const { addRecipe } = useChase();
  const [step, setStep] = useState<Step>("url");
  const [url, setUrl] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [source, setSource] = useState<string>("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [newIngredientText, setNewIngredientText] = useState<string>("");
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const ingredientInputRef = useRef<TextInput>(null);

  const { mutate: fetchMetadata, isPending: isFetching } = useMutation({
    mutationFn: async (recipeUrl: string): Promise<RecipeMetadata> => {
      return extractRecipeMetadata(recipeUrl);
    },
    onSuccess: (data) => {
      console.log("[AddRecipe] Metadata fetched:", data.title, "ingredients:", data.ingredients.length);
      setTitle(data.title);
      setImageUrl(data.imageUrl);
      setSource(data.source);
      setIngredients(data.ingredients);
      setStep("details");
    },
    onError: (err) => {
      console.log("[AddRecipe] Metadata fetch error:", err);
      Alert.alert(
        "Couldn\u2019t load metadata",
        "We\u2019ll use the link as-is. You can set the title and add ingredients manually.",
        [
          {
            text: "Continue",
            onPress: () => {
              try {
                const hostname = new URL(url.trim()).hostname.replace("www.", "");
                setSource(hostname);
              } catch {
                setSource("Unknown");
              }
              setTitle("");
              setImageUrl("https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80");
              setStep("details");
            },
          },
        ]
      );
    },
  });

  const startSpinning = useCallback(() => {
    spinAnim.setValue(0);
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  }, [spinAnim]);

  const handleFetchLink = useCallback(() => {
    const trimmed = url.trim();
    if (!trimmed) {
      Alert.alert("Missing URL", "Please paste a recipe link.");
      return;
    }
    try {
      new URL(trimmed);
    } catch {
      Alert.alert("Invalid URL", "Please enter a valid web address.");
      return;
    }
    startSpinning();
    fetchMetadata(trimmed);
  }, [url, fetchMetadata, startSpinning]);

  const handleAddIngredient = useCallback(() => {
    const text = newIngredientText.trim();
    if (!text) return;
    const ingredient = createIngredientFromText(text);
    setIngredients((prev) => [...prev, ingredient]);
    setNewIngredientText("");
    ingredientInputRef.current?.focus();
  }, [newIngredientText]);

  const handleRemoveIngredient = useCallback((id: string) => {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const handleSaveRecipe = useCallback(() => {
    if (!title.trim()) {
      Alert.alert("Missing Title", "Please enter a recipe title.");
      return;
    }
    if (ingredients.length === 0) {
      Alert.alert(
        "No Ingredients",
        "Add at least one ingredient before saving.",
        [{ text: "OK" }]
      );
      return;
    }
    addRecipe({
      title: title.trim(),
      url: url.trim(),
      source,
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80",
      ingredients,
    });
    router.back();
  }, [title, url, source, imageUrl, ingredients, addRecipe, router]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Stack.Screen
        options={{
          title: step === "url" ? "Add Recipe" : "Recipe Details",
          presentation: "modal",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                if (step === "details") {
                  Alert.alert("Discard?", "You\u2019ll lose your changes.", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Discard", style: "destructive", onPress: () => router.back() },
                  ]);
                } else {
                  router.back();
                }
              }}
              testID="close-modal"
            >
              <X size={22} color={Colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () =>
            step === "details" ? (
              <TouchableOpacity onPress={handleSaveRecipe} testID="save-recipe-button">
                <Text style={styles.saveHeaderText}>Save</Text>
              </TouchableOpacity>
            ) : null,
        }}
      />

      {step === "url" ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroSection}>
            <View style={styles.heroIcon}>
              <Text style={{ fontSize: 48 }}>🔗</Text>
            </View>
            <Text style={styles.heroTitle}>Save a Recipe</Text>
            <Text style={styles.heroSubtitle}>
              {"Paste a recipe link and we\u2019ll grab the\ntitle, image, and ingredients for you"}
            </Text>
          </View>

          <View style={styles.inputSection}>
            <View style={styles.inputContainer}>
              <Link2 size={20} color={Colors.textTertiary} />
              <TextInput
                style={styles.input}
                placeholder="https://example.com/recipe..."
                placeholderTextColor={Colors.textTertiary}
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="go"
                onSubmitEditing={handleFetchLink}
                editable={!isFetching}
                testID="recipe-url-input"
              />
            </View>

            <TouchableOpacity
              style={[styles.extractButton, isFetching && styles.extractButtonDisabled]}
              onPress={handleFetchLink}
              disabled={isFetching}
              activeOpacity={0.8}
              testID="extract-button"
            >
              {isFetching ? (
                <>
                  <Animated.View style={{ transform: [{ rotate: spin }] }}>
                    <Loader size={20} color={Colors.textOnPrimary} />
                  </Animated.View>
                  <Text style={styles.extractButtonText}>Loading recipe info...</Text>
                </>
              ) : (
                <>
                  <Sparkles size={20} color={Colors.textOnPrimary} />
                  <Text style={styles.extractButtonText}>Fetch Recipe</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>How it works</Text>
            <View style={styles.tipRow}>
              <View style={styles.tipNumber}>
                <Text style={styles.tipNumberText}>1</Text>
              </View>
              <Text style={styles.tipText}>Paste a link to any recipe page</Text>
            </View>
            <View style={styles.tipRow}>
              <View style={styles.tipNumber}>
                <Text style={styles.tipNumberText}>2</Text>
              </View>
              <Text style={styles.tipText}>We read the recipe schema for title & ingredients</Text>
            </View>
            <View style={styles.tipRow}>
              <View style={styles.tipNumber}>
                <Text style={styles.tipNumberText}>3</Text>
              </View>
              <Text style={styles.tipText}>Edit or add ingredients manually, then save</Text>
            </View>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.detailsScroll}
          keyboardShouldPersistTaps="handled"
        >
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.previewImage}
              contentFit="cover"
            />
          ) : null}

          <View style={styles.detailsContent}>
            <View style={styles.titleSection}>
              {isEditingTitle ? (
                <TextInput
                  style={styles.titleInput}
                  value={title}
                  onChangeText={setTitle}
                  onBlur={() => setIsEditingTitle(false)}
                  onSubmitEditing={() => setIsEditingTitle(false)}
                  autoFocus
                  placeholder="Recipe title..."
                  placeholderTextColor={Colors.textTertiary}
                  testID="recipe-title-input"
                />
              ) : (
                <TouchableOpacity
                  style={styles.titleRow}
                  onPress={() => setIsEditingTitle(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.titleText} numberOfLines={2}>
                    {title || "Tap to set title"}
                  </Text>
                  <Edit3 size={16} color={Colors.textTertiary} />
                </TouchableOpacity>
              )}
              <View style={styles.sourceChip}>
                <Link2 size={12} color={Colors.primary} />
                <Text style={styles.sourceChipText} numberOfLines={1}>
                  {source}
                </Text>
              </View>
            </View>

            {ingredients.length > 0 && (
              <View style={styles.autoExtractBanner}>
                <CheckCircle2 size={16} color={Colors.success} />
                <Text style={styles.autoExtractText}>
                  {ingredients.length} ingredient{ingredients.length !== 1 ? "s" : ""} found from recipe
                </Text>
              </View>
            )}

            <Text style={styles.sectionLabel}>Ingredients</Text>

            {ingredients.map((ing) => (
              <View key={ing.id} style={styles.ingredientItem}>
                <View style={styles.ingredientDot} />
                <View style={styles.ingredientDetails}>
                  <Text style={styles.ingredientName}>{ing.name}</Text>
                  {(ing.quantity || ing.unit) ? (
                    <Text style={styles.ingredientMeta}>
                      {ing.quantity}{ing.unit ? ` ${ing.unit}` : ""}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.categoryChip}>
                  <Text style={styles.categoryChipText}>{ing.category}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveIngredient(ing.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  testID={`remove-ingredient-${ing.id}`}
                >
                  <Trash2 size={14} color={Colors.textTertiary} />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.addIngredientSection}>
              <View style={styles.addIngredientRow}>
                <TextInput
                  ref={ingredientInputRef}
                  style={styles.addIngredientInput}
                  placeholder='e.g. "2 cups flour" or "salmon fillet"'
                  placeholderTextColor={Colors.textTertiary}
                  value={newIngredientText}
                  onChangeText={setNewIngredientText}
                  onSubmitEditing={handleAddIngredient}
                  returnKeyType="done"
                  testID="add-ingredient-input"
                />
                <TouchableOpacity
                  style={[
                    styles.addIngredientButton,
                    !newIngredientText.trim() && styles.addIngredientButtonDisabled,
                  ]}
                  onPress={handleAddIngredient}
                  disabled={!newIngredientText.trim()}
                  testID="add-ingredient-button"
                >
                  <Plus size={18} color={Colors.textOnPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.saveButton,
                (!title.trim() || ingredients.length === 0) && styles.saveButtonDisabled,
              ]}
              onPress={handleSaveRecipe}
              activeOpacity={0.8}
              testID="save-recipe"
            >
              <ChevronRight size={20} color={Colors.textOnPrimary} />
              <Text style={styles.saveButtonText}>Save Recipe</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 16,
  },
  saveHeaderText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  heroIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  inputSection: {
    gap: 16,
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 14,
  },
  extractButton: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  extractButtonDisabled: {
    backgroundColor: Colors.primaryLight,
  },
  extractButtonText: {
    color: Colors.textOnPrimary,
    fontSize: 16,
    fontWeight: "700" as const,
  },
  tipsSection: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 14,
    padding: 20,
    gap: 14,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tipNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  tipNumberText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.textOnPrimary,
  },
  tipText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  detailsScroll: {
    paddingBottom: 40,
  },
  previewImage: {
    width: "100%",
    height: 200,
  },
  detailsContent: {
    padding: 20,
  },
  titleSection: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  titleText: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.text,
    flex: 1,
    lineHeight: 28,
  },
  titleInput: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.text,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    paddingBottom: 4,
    marginBottom: 8,
  },
  sourceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.surfaceAlt,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  sourceChipText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "500" as const,
    maxWidth: 200,
  },
  autoExtractBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.inPantry,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  autoExtractText: {
    fontSize: 13,
    color: Colors.inPantryText,
    fontWeight: "600" as const,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 12,
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 10,
  },
  ingredientDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  ingredientDetails: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  ingredientMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  categoryChip: {
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryChipText: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    textTransform: "capitalize" as const,
  },
  addIngredientSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  addIngredientRow: {
    flexDirection: "row",
    gap: 8,
  },
  addIngredientInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  addIngredientButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  addIngredientButtonDisabled: {
    backgroundColor: Colors.primaryLight,
    opacity: 0.5,
  },
  saveButton: {
    backgroundColor: Colors.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: Colors.textOnPrimary,
    fontSize: 16,
    fontWeight: "700" as const,
  },
});
