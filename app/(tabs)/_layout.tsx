import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: "#126B5D",
          borderTopColor: "#BFE7DE",
          borderTopWidth: 1
        },
        tabBarInactiveTintColor: "#D9F4EF",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700"
        },
        tabBarItemStyle: {
          paddingVertical: 4
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarLabel: "Home",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home" size={24} color={color} />
          )
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: "Research Scope",
          tabBarLabel: "Research",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="compass" size={24} color={color} />
          )
        }}
      />

      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Project Dashboard",
          tabBarLabel: "Projects",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="view-dashboard-outline"
              size={24}
              color={color}
            />
          )
        }}
      />

      <Tabs.Screen
        name="metrics"
        options={{
          title: "Quality Metrics",
          tabBarLabel: "Quality",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="chart-box-outline"
              size={24}
              color={color}
            />
          )
        }}
      />

      <Tabs.Screen
        name="comparison"
        options={{
          title: "Sprint Comparison",
          tabBarLabel: "Compare",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="compare-horizontal"
              size={24}
              color={color}
            />
          )
        }}
      />

      <Tabs.Screen
        name="performance"
        options={{
          title: "API Performance",
          tabBarLabel: "Speed",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="speedometer"
              size={24}
              color={color}
            />
          )
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: "Sprint History",
          tabBarLabel: "Sprints",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="timeline-clock-outline"
              size={24}
              color={color}
            />
          )
        }}
      />
    </Tabs>
  );
}
