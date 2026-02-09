import { useMutation } from "@tanstack/react-query";
import { useRouter, Stack } from "expo-router";
import { Link2, Loader, X, Sparkles } from "lucide-react-native";
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
import { extractRecipeFromUrl } from "@/utils/recipeExtractor";

export default function AddRecipeScreen() {
  const router = useRouter();
  const { addRecipe } = useChase();
  const [url, setUrl] = useState<string>("");
  const spinAnim = useRef(new Animated.Value(0)).current;

  const { mutate: extractRecipe, isPending: isExtracting } = useMutation({
    mutationFn: async (recipeUrl: string) => {
      return extractRecipeFromUrl(recipeUrl);
    },
    onSuccess: (data) => {
      addRecipe({
        title: data.title,
        url: url.trim(),
        source: data.source,
        imageUrl: data.imageUrl,
        ingredients: data.ingredients,
      });
      router.back();
    },
    onError: () => {
      Alert.alert("Error", "Failed to extract recipe. Please try a different link.");
    },
  });

  const startSpinning = useCallback(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  }, [spinAnim]);

  const handleExtract = useCallback(() => {
    const trimmed = url.trim();
    if (!trimmed) {
      Alert.alert("Missing URL", "Please paste a recipe link.");
      return;
    }
    startSpinning();
    extractRecipe(trimmed);
  }, [url, extractRecipe, startSpinning]);

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
          title: "Add Recipe",
          presentation: "modal",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} testID="close-modal">
              <X size={22} color={Colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <Text style={{ fontSize: 48 }}>🔗</Text>
          </View>
          <Text style={styles.heroTitle}>Paste a Recipe Link</Text>
          <Text style={styles.heroSubtitle}>
            {"Share any recipe URL and we\u2019ll extract\nthe ingredients for you"}
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
              onSubmitEditing={handleExtract}
              editable={!isExtracting}
              testID="recipe-url-input"
            />
          </View>

          <TouchableOpacity
            style={[styles.extractButton, isExtracting && styles.extractButtonDisabled]}
            onPress={handleExtract}
            disabled={isExtracting}
            activeOpacity={0.8}
            testID="extract-button"
          >
            {isExtracting ? (
              <>
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <Loader size={20} color={Colors.textOnPrimary} />
                </Animated.View>
                <Text style={styles.extractButtonText}>Extracting ingredients...</Text>
              </>
            ) : (
              <>
                <Sparkles size={20} color={Colors.textOnPrimary} />
                <Text style={styles.extractButtonText}>Extract Ingredients</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Supported sources</Text>
          <View style={styles.tipRow}>
            <View style={styles.tipDot} />
            <Text style={styles.tipText}>Any recipe website or blog</Text>
          </View>
          <View style={styles.tipRow}>
            <View style={styles.tipDot} />
            <Text style={styles.tipText}>YouTube recipe video links</Text>
          </View>
          <View style={styles.tipRow}>
            <View style={styles.tipDot} />
            <Text style={styles.tipText}>Social media recipe posts</Text>
          </View>
        </View>
      </ScrollView>
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
    gap: 12,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  tipText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
