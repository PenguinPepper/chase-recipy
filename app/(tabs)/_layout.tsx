import { Tabs } from "expo-router";
import { CookingPot, ShoppingBasket, Refrigerator, UserRound } from "lucide-react-native";
import React from "react";
import { Platform } from "react-native";

import Colors from "@/constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: Colors.tabBar,
          borderTopColor: Colors.tabBarBorder,
          borderTopWidth: 1,
          ...(Platform.OS === "web" ? { height: 60 } : {}),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600" as const,
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: "Recipes",
          tabBarIcon: ({ color, size }) => <CookingPot size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="groceries"
        options={{
          title: "Groceries",
          tabBarIcon: ({ color, size }) => <ShoppingBasket size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="pantry"
        options={{
          title: "Pantry",
          tabBarIcon: ({ color, size }) => <Refrigerator size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <UserRound size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
