import { HapticTab } from "@/components/haptic-tab";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StatusBar } from "react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <>
      <StatusBar backgroundColor="#FF9F1C" barStyle="light-content" />

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "600",
            marginBottom: 5,
          },
          tabBarStyle: Platform.select({
            ios: {
              position: "absolute",
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              borderTopWidth: 0,
              elevation: 0,
            },
            default: {
              backgroundColor: "#fff",
              borderTopWidth: 0,
              elevation: 15,
              height: 85,
              paddingBottom: 30,
              paddingTop: 10,
            },
          }),
        }}
      >
        {/* 1. HOME - Orange */}
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarActiveTintColor: "#FF9F1C",
            tabBarInactiveTintColor: "#999",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                size={26}
                name={focused ? "home" : "home-outline"}
                color={color}
              />
            ),
          }}
        />

        {/* 2. LIVE - Cyan/Blue */}
        <Tabs.Screen
          name="live-dashboard"
          options={{
            title: "Live",
            tabBarActiveTintColor: "#4CC9F0",
            tabBarInactiveTintColor: "#999",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                size={26}
                name={focused ? "speedometer" : "speedometer-outline"}
                color={color}
              />
            ),
          }}
        />

        {/* 3. SCHEDULE (NEW) - Green */}
        <Tabs.Screen
          name="schedule"
          options={{
            title: "Plan",
            tabBarActiveTintColor: "#06D6A0",
            tabBarInactiveTintColor: "#999",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                size={26}
                name={focused ? "calendar" : "calendar-outline"}
                color={color}
              />
            ),
          }}
        />

        {/* 4. PREDICTIONS - Pink */}
        <Tabs.Screen
          name="prediction-dashboard"
          options={{
            title: "Forecast",
            tabBarActiveTintColor: "#F72585",
            tabBarInactiveTintColor: "#999",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                size={26}
                name={focused ? "trending-up" : "trending-up-outline"}
                color={color}
              />
            ),
          }}
        />

        {/* 5. ANALYTICS - Purple */}
        <Tabs.Screen
          name="chart-dashboard"
          options={{
            title: "Analytics",
            tabBarActiveTintColor: "#7209B7",
            tabBarInactiveTintColor: "#999",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                size={26}
                name={focused ? "stats-chart" : "stats-chart-outline"}
                color={color}
              />
            ),
          }}
        />

        {/* HIDDEN TABS */}
        <Tabs.Screen
          name="explore"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </>
  );
}
