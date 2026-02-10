import { Stack } from "expo-router";
import React from "react";

import Colors from "@/constants/colors";

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.primary,
        headerTitleStyle: { fontWeight: "700" as const, color: Colors.text },
      }}
    />
  );
}
