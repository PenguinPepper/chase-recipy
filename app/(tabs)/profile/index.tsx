import { Stack } from "expo-router";
import {
  LogOut,
  ChefHat,
  ShoppingBasket,
  Refrigerator,
  User,
  Mail,
  Shield,
} from "lucide-react-native";
import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";

import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useChase } from "@/contexts/ChaseContext";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { recipes, groceryLists, pantryItems } = useChase();

  const displayName = useMemo(() => {
    return user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Chef";
  }, [user]);

  const stats = useMemo(
    () => [
      {
        label: "Recipes",
        value: recipes.length,
        icon: ChefHat,
        color: Colors.primary,
        bg: "#FDE8E4",
      },
      {
        label: "Grocery Lists",
        value: groceryLists.length,
        icon: ShoppingBasket,
        color: Colors.accent,
        bg: "#FEF3D9",
      },
      {
        label: "Pantry Items",
        value: pantryItems.length,
        icon: Refrigerator,
        color: Colors.success,
        bg: "#E6F2E8",
      },
    ],
    [recipes.length, groceryLists.length, pantryItems.length]
  );

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Profile" }} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User size={32} color={Colors.primary} />
            </View>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <View style={styles.emailRow}>
            <Mail size={13} color={Colors.textTertiary} />
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
                <stat.icon size={18} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.sectionCard}>
            <View style={styles.infoRow}>
              <Shield size={16} color={Colors.textSecondary} />
              <Text style={styles.infoLabel}>Account ID</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {user?.id?.slice(0, 8)}...
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Mail size={16} color={Colors.textSecondary} />
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {user?.email}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.7}
          testID="sign-out-button"
        >
          <LogOut size={18} color={Colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 16,
  },
  avatarContainer: {
    marginBottom: 14,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.cardBorder,
  },
  name: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  email: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 2,
    fontWeight: "500" as const,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.textSecondary,
    marginBottom: 10,
    marginLeft: 4,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: "500" as const,
    maxWidth: 160,
    textAlign: "right" as const,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 10,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F5D5D5",
  },
  signOutText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.error,
  },
});
