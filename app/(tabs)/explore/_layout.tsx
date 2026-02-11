import { Stack } from "expo-router";
import React from "react";

import Colors from "@/constants/colors";

export default function ExploreLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTitleStyle: { fontWeight: "700" as const, color: Colors.text },
        headerTintColor: Colors.primary,
      }}
    />
  );
}
