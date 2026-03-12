import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { Tabs, useRouter } from "expo-router";
import { useEffect } from "react";
import { Text } from "react-native";

export default function TabsLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/(auth)/sign-in");
    } else if (user.role === "admin") {
      router.replace("/(admin)/dashboard");
    }
  }, [user, isLoading]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>📚</Text>,
        }}
      />
      <Tabs.Screen
        name="my-rentals"
        options={{
          title: "My Rentals",
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>📋</Text>,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>📜</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}
