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
  Video,
  FileText,
  Clock,
  AlertCircle,
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
import {
  isVideoUrl,
  isInstagramUrl,
  extractVideoRecipe,
  formatTimestamp,
  VideoRecipeResult,
  TranscriptSegment,
} from "@/utils/videoExtractor";

type Step = "url" | "details" | "transcript";

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
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [isVideoLink, setIsVideoLink] = useState<boolean>(false);
  const [transcriptExpanded, setTranscriptExpanded] = useState<boolean>(false);
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
      setIsVideoLink(false);
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

  const { mutate: fetchVideo, isPending: isFetchingVideo } = useMutation({
    mutationFn: async (videoUrl: string): Promise<VideoRecipeResult> => {
      return extractVideoRecipe(videoUrl);
    },
    onSuccess: (data) => {
      console.log("[AddRecipe] Video extracted:", data.metadata.title, "transcript segments:", data.transcript.length, "ingredients:", data.ingredients.length);
      setTitle(data.metadata.title);
      setImageUrl(data.metadata.thumbnailUrl);
      setSource(data.metadata.source);
      setIngredients(data.ingredients);
      setTranscript(data.transcript);
      setIsVideoLink(true);
      if (data.transcript.length > 0) {
        setStep("transcript");
      } else {
        setStep("details");
      }
    },
    onError: (err) => {
      console.log("[AddRecipe] Video extraction error:", err);
      const message = err instanceof Error ? err.message : "Could not extract video recipe.";
      Alert.alert("Video Error", message, [
        {
          text: "Add Manually",
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
        { text: "Cancel", style: "cancel" },
      ]);
    },
  });

  const isPending = isFetching || isFetchingVideo;

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
    if (isVideoUrl(trimmed)) {
      console.log("[AddRecipe] Detected video URL, using video extractor");
      fetchVideo(trimmed);
    } else {
      fetchMetadata(trimmed);
    }
  }, [url, fetchMetadata, fetchVideo, startSpinning]);

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

  const handleContinueFromTranscript = useCallback(() => {
    setStep("details");
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const renderUrlStep = () => (
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
          {"Paste a recipe or video link and we\u2019ll grab the\ntitle, image, and ingredients for you"}
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
            editable={!isPending}
            testID="recipe-url-input"
          />
        </View>

        {url.trim() && isVideoUrl(url.trim()) && (
          <View style={[
            styles.videoDetectedBanner,
            isInstagramUrl(url.trim()) && styles.instagramDetectedBanner,
          ]}>
            <Video size={16} color={isInstagramUrl(url.trim()) ? "#E1306C" : "#6C3CE0"} />
            <Text style={[
              styles.videoDetectedText,
              isInstagramUrl(url.trim()) && styles.instagramDetectedText,
            ]}>
              {isInstagramUrl(url.trim())
                ? "Instagram Reel detected \u2014 will extract caption & ingredients"
                : "YouTube video detected \u2014 will auto-transcribe"}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.extractButton, isPending && styles.extractButtonDisabled]}
          onPress={handleFetchLink}
          disabled={isPending}
          activeOpacity={0.8}
          testID="extract-button"
        >
          {isPending ? (
            <>
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Loader size={20} color={Colors.textOnPrimary} />
              </Animated.View>
              <Text style={styles.extractButtonText}>
                {isFetchingVideo
                  ? (url.trim() && isInstagramUrl(url.trim()) ? "Extracting reel..." : "Transcribing video (may use AI)...")
                  : "Loading recipe info..."}
              </Text>
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
          <Text style={styles.tipText}>Paste a link to any recipe page or YouTube video</Text>
        </View>
        <View style={styles.tipRow}>
          <View style={styles.tipNumber}>
            <Text style={styles.tipNumberText}>2</Text>
          </View>
          <Text style={styles.tipText}>Videos are auto-transcribed with AI speech-to-text fallback</Text>
        </View>
        <View style={styles.tipRow}>
          <View style={styles.tipNumber}>
            <Text style={styles.tipNumberText}>3</Text>
          </View>
          <Text style={styles.tipText}>Edit or add ingredients manually, then save</Text>
        </View>
      </View>

      <View style={styles.supportedSection}>
        <View style={styles.supportedRow}>
          <View style={styles.supportedChip}>
            <Link2 size={12} color={Colors.primary} />
            <Text style={styles.supportedChipText}>Recipe websites</Text>
          </View>
          <View style={[styles.supportedChip, styles.videoChip]}>
            <Video size={12} color="#6C3CE0" />
            <Text style={[styles.supportedChipText, { color: "#6C3CE0" }]}>YouTube videos</Text>
          </View>
          <View style={[styles.supportedChip, styles.instagramChip]}>
            <Video size={12} color="#E1306C" />
            <Text style={[styles.supportedChipText, { color: "#E1306C" }]}>Instagram Reels</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderTranscriptStep = () => (
    <ScrollView
      contentContainerStyle={styles.detailsScroll}
      keyboardShouldPersistTaps="handled"
    >
      {imageUrl ? (
        <View style={styles.videoThumbnailContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.previewImage}
            contentFit="cover"
          />
          <View style={styles.videoOverlay}>
            <View style={styles.videoBadge}>
              <Video size={14} color="#FFFFFF" />
              <Text style={styles.videoBadgeText}>Video Recipe</Text>
            </View>
          </View>
        </View>
      ) : null}

      <View style={styles.detailsContent}>
        <Text style={styles.transcriptTitle} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.sourceChip}>
          <Video size={12} color="#6C3CE0" />
          <Text style={[styles.sourceChipText, { color: "#6C3CE0" }]} numberOfLines={1}>
            {source}
          </Text>
        </View>

        <View style={styles.transcriptStatusSection}>
          <View style={styles.transcriptStatusRow}>
            <CheckCircle2 size={18} color={Colors.success} />
            <View style={styles.transcriptStatusInfo}>
              <Text style={styles.transcriptStatusTitle}>Transcript extracted</Text>
              <Text style={styles.transcriptStatusMeta}>
                {transcript.length} segments · {formatTimestamp(transcript[transcript.length - 1]?.start ?? 0)} duration
              </Text>
            </View>
          </View>

          {ingredients.length > 0 ? (
            <View style={styles.ingredientFoundBanner}>
              <Sparkles size={16} color={Colors.primary} />
              <Text style={styles.ingredientFoundText}>
                {ingredients.length} ingredient{ingredients.length !== 1 ? "s" : ""} detected from transcript
              </Text>
            </View>
          ) : (
            <View style={styles.noIngredientBanner}>
              <AlertCircle size={16} color={Colors.accentLight} />
              <Text style={styles.noIngredientText}>
                No ingredients auto-detected — you can add them manually next
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.transcriptToggle}
          onPress={() => setTranscriptExpanded(!transcriptExpanded)}
          activeOpacity={0.7}
        >
          <FileText size={16} color={Colors.textSecondary} />
          <Text style={styles.transcriptToggleText}>
            {transcriptExpanded ? "Hide transcript" : "View full transcript"}
          </Text>
          <ChevronRight
            size={16}
            color={Colors.textTertiary}
            style={transcriptExpanded ? { transform: [{ rotate: "90deg" }] } : undefined}
          />
        </TouchableOpacity>

        {transcriptExpanded && (
          <View style={styles.transcriptContainer}>
            {transcript.map((seg, idx) => (
              <View key={idx} style={styles.transcriptLine}>
                <Text style={styles.transcriptTimestamp}>
                  <Clock size={10} color={Colors.textTertiary} />{" "}
                  {formatTimestamp(seg.start)}
                </Text>
                <Text style={styles.transcriptText}>{seg.text}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinueFromTranscript}
          activeOpacity={0.8}
          testID="continue-to-details"
        >
          <Text style={styles.continueButtonText}>
            {ingredients.length > 0 ? "Review & Edit Ingredients" : "Add Ingredients Manually"}
          </Text>
          <ChevronRight size={20} color={Colors.textOnPrimary} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderDetailsStep = () => (
    <ScrollView
      contentContainerStyle={styles.detailsScroll}
      keyboardShouldPersistTaps="handled"
    >
      {imageUrl ? (
        <View style={styles.videoThumbnailContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.previewImage}
            contentFit="cover"
          />
          {isVideoLink && (
            <View style={styles.videoOverlay}>
              <View style={styles.videoBadge}>
                <Video size={14} color="#FFFFFF" />
                <Text style={styles.videoBadgeText}>Video Recipe</Text>
              </View>
            </View>
          )}
        </View>
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
          <View style={isVideoLink ? [styles.sourceChip, styles.videoSourceChip] : styles.sourceChip}>
            {isVideoLink ? (
              <Video size={12} color="#6C3CE0" />
            ) : (
              <Link2 size={12} color={Colors.primary} />
            )}
            <Text
              style={[styles.sourceChipText, isVideoLink && { color: "#6C3CE0" }]}
              numberOfLines={1}
            >
              {source}
            </Text>
          </View>
        </View>

        {isVideoLink && transcript.length > 0 && (
          <View style={styles.transcriptMiniInfo}>
            <FileText size={14} color={Colors.textSecondary} />
            <Text style={styles.transcriptMiniText}>
              Transcribed from video · {transcript.length} segments
            </Text>
          </View>
        )}

        {ingredients.length > 0 && (
          <View style={styles.autoExtractBanner}>
            <CheckCircle2 size={16} color={Colors.success} />
            <Text style={styles.autoExtractText}>
              {ingredients.length} ingredient{ingredients.length !== 1 ? "s" : ""} found
              {isVideoLink ? " from transcript" : " from recipe"}
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
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Stack.Screen
        options={{
          title: step === "url" ? "Add Recipe" : step === "transcript" ? "Video Transcript" : "Recipe Details",
          presentation: "modal",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                if (step === "details") {
                  Alert.alert("Discard?", "You\u2019ll lose your changes.", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Discard", style: "destructive", onPress: () => router.back() },
                  ]);
                } else if (step === "transcript") {
                  setStep("details");
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

      {step === "url" && renderUrlStep()}
      {step === "transcript" && renderTranscriptStep()}
      {step === "details" && renderDetailsStep()}
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
    gap: 12,
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
  videoDetectedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F3EEFF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0D4F5",
  },
  videoDetectedText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#6C3CE0",
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
    marginBottom: 16,
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
  supportedSection: {
    alignItems: "center",
  },
  supportedRow: {
    flexDirection: "row",
    gap: 10,
  },
  supportedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.inPantry,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  videoChip: {
    backgroundColor: "#F3EEFF",
  },
  instagramChip: {
    backgroundColor: "#FFF0F5",
  },
  instagramDetectedBanner: {
    backgroundColor: "#FFF0F5",
    borderColor: "#FFD6E7",
  },
  instagramDetectedText: {
    color: "#E1306C",
  },
  supportedChipText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  detailsScroll: {
    paddingBottom: 40,
  },
  videoThumbnailContainer: {
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: 200,
  },
  videoOverlay: {
    position: "absolute",
    bottom: 10,
    left: 10,
  },
  videoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  videoBadgeText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  detailsContent: {
    padding: 20,
  },
  transcriptTitle: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.text,
    lineHeight: 28,
    marginBottom: 8,
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
    marginBottom: 16,
  },
  videoSourceChip: {
    backgroundColor: "#F3EEFF",
  },
  sourceChipText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "500" as const,
    maxWidth: 200,
  },
  transcriptStatusSection: {
    gap: 10,
    marginBottom: 20,
  },
  transcriptStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.inPantry,
    padding: 14,
    borderRadius: 12,
  },
  transcriptStatusInfo: {
    flex: 1,
  },
  transcriptStatusTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.inPantryText,
  },
  transcriptStatusMeta: {
    fontSize: 12,
    color: Colors.inPantryText,
    opacity: 0.8,
    marginTop: 2,
  },
  ingredientFoundBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surfaceAlt,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  ingredientFoundText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "600" as const,
    flex: 1,
  },
  noIngredientBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF8F0",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFE4C8",
  },
  noIngredientText: {
    fontSize: 13,
    color: "#B07020",
    fontWeight: "500" as const,
    flex: 1,
  },
  transcriptToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    marginBottom: 20,
  },
  transcriptToggleText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    flex: 1,
  },
  transcriptContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    maxHeight: 300,
  },
  transcriptLine: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
    alignItems: "flex-start",
  },
  transcriptTimestamp: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: "600" as const,
    minWidth: 40,
    marginTop: 2,
  },
  transcriptText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 19,
    flex: 1,
  },
  transcriptMiniInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    opacity: 0.7,
  },
  transcriptMiniText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  continueButtonText: {
    color: Colors.textOnPrimary,
    fontSize: 16,
    fontWeight: "700" as const,
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
