import AnimatedTabBar from "@/components/ui/AnimatedTabBar";
import { useTabsRouteGuard } from "@/hooks/useRouteGuards";
import { Tabs } from "expo-router";
import React from "react";

export default function TabsLayout() {
  useTabsRouteGuard();

  return (
    <Tabs
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarLabel: "Home",
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarLabel: "Search",
        }}
      />
      <Tabs.Screen
        name="my-rentals"
        options={{
          title: "Orders",
          tabBarLabel: "Orders",
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarLabel: "History",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
        }}
      />
    </Tabs>
  );
}
