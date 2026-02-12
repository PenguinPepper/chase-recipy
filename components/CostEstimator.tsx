import {
  DollarSign,
  TrendingDown,
  Store,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Tag,
} from "lucide-react-native";
import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Linking,
} from "react-native";

import Colors from "@/constants/colors";
import { Ingredient } from "@/types";
import { getGrocerySearchTerm } from "@/utils/grocerySearchTerms";
import { trpc } from "@/lib/trpc";

interface CostEstimatorProps {
  ingredients: Ingredient[];
  recipeId: string;
}

interface IngredientPriceResult {
  ingredientId: string;
  ingredientName: string;
  searchTerm: string;
  matches: {
    name: string;
    price: number;
    currency: string;
    unitSize: string;
    unitPrice: number;
    unitLabel: string;
    store: string;
    url: string;
    imageUrl?: string;
  }[];
  bestMatch: {
    name: string;
    price: number;
    currency: string;
    unitSize: string;
    unitPrice: number;
    unitLabel: string;
    store: string;
    url: string;
    imageUrl?: string;
  } | null;
}

interface StoreBreakdownItem {
  store: string;
  total: number;
  itemCount: number;
  missingCount: number;
}

interface PriceResults {
  ingredientPrices: IngredientPriceResult[];
  totalEstimated: number;
  currency: string;
  storeBreakdown: StoreBreakdownItem[];
  fetchedAt: string;
}

const ZYTE_API_KEY = process.env.EXPO_PUBLIC_ZYTE_API_KEY || "";

export default function CostEstimator({ ingredients, recipeId }: CostEstimatorProps) {
  const [results, setResults] = useState<PriceResults | null>(null);
  const [expandedIngredient, setExpandedIngredient] = useState<string | null>(null);
  const [showStoreBreakdown, setShowStoreBreakdown] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  const searchMutation = trpc.prices.searchRecipeIngredients.useMutation({
    onSuccess: (data) => {
      console.log("[CostEstimator] Got price results:", data.totalEstimated);
      setResults(data);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    },
    onError: (error) => {
      console.log("[CostEstimator] Error:", error.message);
    },
  });

  const handleEstimateCost = useCallback(() => {
    if (!ZYTE_API_KEY) {
      console.log("[CostEstimator] No Zyte API key configured");
      return;
    }

    fadeAnim.setValue(0);
    slideAnim.setValue(-20);

    const ingredientInputs = ingredients.map((ing) => ({
      id: ing.id,
      name: ing.name,
      searchTerm: getGrocerySearchTerm(ing.name),
    }));

    console.log("[CostEstimator] Searching prices for", ingredientInputs.length, "ingredients");

    searchMutation.mutate({
      ingredients: ingredientInputs,
      apiKey: ZYTE_API_KEY,
    });
  }, [ingredients, searchMutation, fadeAnim, slideAnim]);

  const toggleIngredient = useCallback((id: string) => {
    setExpandedIngredient((prev) => (prev === id ? null : id));
  }, []);

  const pricedCount = useMemo(() => {
    if (!results) return 0;
    return results.ingredientPrices.filter((p) => p.bestMatch !== null).length;
  }, [results]);

  const missingApiKey = !ZYTE_API_KEY;

  if (missingApiKey) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <DollarSign size={18} color={Colors.accent} />
          </View>
          <Text style={styles.headerTitle}>Cost Estimator</Text>
        </View>
        <View style={styles.apiKeyWarning}>
          <AlertCircle size={16} color={Colors.textSecondary} />
          <Text style={styles.apiKeyWarningText}>
            Set EXPO_PUBLIC_ZYTE_API_KEY to enable price estimation
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <DollarSign size={18} color={Colors.accent} />
        </View>
        <Text style={styles.headerTitle}>Cost Estimator</Text>
      </View>

      {!results && !searchMutation.isPending && (
        <TouchableOpacity
          style={styles.estimateButton}
          onPress={handleEstimateCost}
          activeOpacity={0.8}
          testID="estimate-cost-button"
        >
          <Tag size={18} color="#FFF" />
          <Text style={styles.estimateButtonText}>Estimate Recipe Cost</Text>
        </TouchableOpacity>
      )}

      {searchMutation.isPending && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.accent} />
          <Text style={styles.loadingText}>
            Searching grocery stores for prices...
          </Text>
          <Text style={styles.loadingSubtext}>
            This may take a moment
          </Text>
        </View>
      )}

      {searchMutation.isError && !results && (
        <View style={styles.errorContainer}>
          <AlertCircle size={18} color={Colors.error} />
          <Text style={styles.errorText}>
            Failed to fetch prices. Please try again.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleEstimateCost}
            activeOpacity={0.7}
          >
            <RefreshCw size={14} color={Colors.primary} />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {results && (
        <Animated.View
          style={[
            styles.resultsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Estimated Total</Text>
            <Text style={styles.totalPrice}>
              ${results.totalEstimated.toFixed(2)}
            </Text>
            <Text style={styles.totalSubtext}>
              {pricedCount}/{results.ingredientPrices.length} items priced
            </Text>
          </View>

          {results.storeBreakdown.length > 0 && (
            <View style={styles.storeSection}>
              <TouchableOpacity
                style={styles.storeSectionHeader}
                onPress={() => setShowStoreBreakdown(!showStoreBreakdown)}
                activeOpacity={0.7}
              >
                <Store size={16} color={Colors.textSecondary} />
                <Text style={styles.storeSectionTitle}>Store Comparison</Text>
                {showStoreBreakdown ? (
                  <ChevronUp size={16} color={Colors.textSecondary} />
                ) : (
                  <ChevronDown size={16} color={Colors.textSecondary} />
                )}
              </TouchableOpacity>

              {showStoreBreakdown && (
                <View style={styles.storeList}>
                  {results.storeBreakdown.map((store, index) => (
                    <View
                      key={store.store}
                      style={[
                        styles.storeRow,
                        index === 0 && styles.storeRowCheapest,
                      ]}
                    >
                      <View style={styles.storeInfo}>
                        <Text
                          style={[
                            styles.storeName,
                            index === 0 && styles.storeNameCheapest,
                          ]}
                        >
                          {store.store}
                        </Text>
                        {index === 0 && (
                          <View style={styles.cheapestBadge}>
                            <TrendingDown size={10} color={Colors.success} />
                            <Text style={styles.cheapestText}>Cheapest</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.storeDetails}>
                        <Text
                          style={[
                            styles.storeTotal,
                            index === 0 && styles.storeTotalCheapest,
                          ]}
                        >
                          ${store.total.toFixed(2)}
                        </Text>
                        <Text style={styles.storeItemCount}>
                          {store.itemCount} items
                          {store.missingCount > 0 &&
                            ` · ${store.missingCount} missing`}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          <View style={styles.ingredientPricesList}>
            <Text style={styles.ingredientPricesTitle}>Price Breakdown</Text>
            {results.ingredientPrices.map((item) => (
              <View key={item.ingredientId}>
                <TouchableOpacity
                  style={[
                    styles.ingredientPriceRow,
                    item.bestMatch === null && styles.ingredientPriceRowMissing,
                  ]}
                  onPress={() => toggleIngredient(item.ingredientId)}
                  activeOpacity={0.7}
                >
                  <View style={styles.ingredientPriceInfo}>
                    <Text style={styles.ingredientPriceName} numberOfLines={1}>
                      {item.ingredientName}
                    </Text>
                    {item.bestMatch ? (
                      <Text style={styles.ingredientPriceStore}>
                        {item.bestMatch.store} · {item.bestMatch.unitSize}
                      </Text>
                    ) : (
                      <Text style={styles.ingredientPriceNotFound}>
                        No prices found
                      </Text>
                    )}
                  </View>
                  <View style={styles.ingredientPriceRight}>
                    {item.bestMatch ? (
                      <>
                        <Text style={styles.ingredientPriceAmount}>
                          ${item.bestMatch.price.toFixed(2)}
                        </Text>
                        <Text style={styles.ingredientUnitPrice}>
                          ${item.bestMatch.unitPrice.toFixed(2)}{" "}
                          {item.bestMatch.unitLabel}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.ingredientPriceDash}>—</Text>
                    )}
                    {item.matches.length > 1 &&
                      (expandedIngredient === item.ingredientId ? (
                        <ChevronUp size={14} color={Colors.textTertiary} />
                      ) : (
                        <ChevronDown size={14} color={Colors.textTertiary} />
                      ))}
                  </View>
                </TouchableOpacity>

                {expandedIngredient === item.ingredientId &&
                  item.matches.length > 1 && (
                    <View style={styles.altMatches}>
                      {item.matches.slice(1, 5).map((match, idx) => (
                        <TouchableOpacity
                          key={`${match.store}-${idx}`}
                          style={styles.altMatchRow}
                          onPress={() => {
                            if (match.url) Linking.openURL(match.url);
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={styles.altMatchInfo}>
                            <Text
                              style={styles.altMatchName}
                              numberOfLines={1}
                            >
                              {match.name}
                            </Text>
                            <Text style={styles.altMatchStore}>
                              {match.store} · {match.unitSize}
                            </Text>
                          </View>
                          <Text style={styles.altMatchPrice}>
                            ${match.price.toFixed(2)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleEstimateCost}
            activeOpacity={0.7}
          >
            <RefreshCw size={14} color={Colors.primary} />
            <Text style={styles.refreshText}>Refresh Prices</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(232, 168, 56, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  apiKeyWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surfaceAlt,
    padding: 14,
    borderRadius: 12,
  },
  apiKeyWarningText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  estimateButton: {
    backgroundColor: Colors.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 15,
    borderRadius: 14,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  estimateButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  loadingContainer: {
    alignItems: "center",
    padding: 28,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  loadingSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  errorContainer: {
    alignItems: "center",
    padding: 20,
    backgroundColor: Colors.missing,
    borderRadius: 14,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    textAlign: "center",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    marginTop: 4,
  },
  retryText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  resultsContainer: {
    gap: 14,
  },
  totalCard: {
    backgroundColor: Colors.accent,
    borderRadius: 18,
    padding: 22,
    alignItems: "center",
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "rgba(255,255,255,0.8)",
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  totalPrice: {
    fontSize: 42,
    fontWeight: "800" as const,
    color: "#FFF",
    marginTop: 4,
  },
  totalSubtext: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
  },
  storeSection: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: "hidden",
  },
  storeSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
  },
  storeSectionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  storeList: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 8,
  },
  storeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
  },
  storeRowCheapest: {
    backgroundColor: Colors.inPantry,
    borderWidth: 1,
    borderColor: "rgba(58, 125, 74, 0.2)",
  },
  storeInfo: {
    flex: 1,
    gap: 4,
  },
  storeName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  storeNameCheapest: {
    color: Colors.success,
  },
  cheapestBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
  },
  cheapestText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.success,
  },
  storeDetails: {
    alignItems: "flex-end",
  },
  storeTotal: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  storeTotalCheapest: {
    color: Colors.success,
  },
  storeItemCount: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  ingredientPricesList: {
    gap: 6,
  },
  ingredientPricesTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 6,
  },
  ingredientPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 11,
    paddingHorizontal: 14,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  ingredientPriceRowMissing: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.divider,
  },
  ingredientPriceInfo: {
    flex: 1,
    marginRight: 12,
  },
  ingredientPriceName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  ingredientPriceStore: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  ingredientPriceNotFound: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontStyle: "italic" as const,
    marginTop: 2,
  },
  ingredientPriceRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  ingredientPriceAmount: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  ingredientUnitPrice: {
    fontSize: 10,
    color: Colors.textTertiary,
  },
  ingredientPriceDash: {
    fontSize: 16,
    color: Colors.textTertiary,
  },
  altMatches: {
    marginLeft: 14,
    marginRight: 14,
    marginBottom: 6,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: Colors.divider,
    gap: 4,
  },
  altMatchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: Colors.surfaceAlt,
  },
  altMatchInfo: {
    flex: 1,
    marginRight: 10,
  },
  altMatchName: {
    fontSize: 12,
    color: Colors.text,
  },
  altMatchStore: {
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  altMatchPrice: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
  },
  refreshText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
});
