import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { useCartStore } from "@/store/cart-store";
import { Colors } from "@/constants/theme";
import { TabIcon, TabIconName } from "./TabIcon";

type TabBarArgs = Parameters<
  NonNullable<React.ComponentProps<typeof Tabs>["tabBar"]>
>[0];

const TAB_CONFIG: Record<
  string,
  { label: string; icon: TabIconName }
> = {
  index: { label: "Home", icon: "home" },
  explore: { label: "Explore", icon: "explore" },
  cart: { label: "Cart", icon: "cart" },
  orders: { label: "Orders", icon: "orders" },
  profile: { label: "Profile", icon: "profile" },
};

function CustomBottomTabBar({
  state,
  descriptors,
  navigateToTab,
  insets,
}: TabBarArgs) {
  const cartTotalItems = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + item.quantity, 0)
  );

  const bottomInset = insets?.bottom ?? 0;

  return (
    <View
      style={[
        styles.tabBar,
        {
          paddingBottom: Math.max(bottomInset, 8),
          height: 56 + Math.max(bottomInset, 8),
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const descriptor = descriptors[route.key];
        const isFocused = state.index === index;
        const config = TAB_CONFIG[route.name] ?? {
          label: descriptor?.options?.title ?? route.name,
          icon: "home" as TabIconName,
        };

        const onPress = () => {
          if (!isFocused) {
            navigateToTab(route.key);
          }
        };

        const activeColor = Colors.light.primary;
        const inactiveColor = Colors.light.textSecondary;
        const color = isFocused ? activeColor : inactiveColor;
        const badgeCount = route.name === "cart" ? cartTotalItems : 0;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={
              descriptor?.options?.tabBarAccessibilityLabel ?? config.label
            }
            onPress={onPress}
            style={({ pressed }) => [
              styles.tabItem,
              pressed && styles.tabItemPressed,
            ]}
          >
            <View style={styles.iconWrapper}>
              <TabIcon
                name={config.icon}
                color={color}
                focused={isFocused}
                size={22}
                badgeCount={badgeCount}
              />
            </View>

            <Text
              style={[
                styles.tabLabel,
                {
                  color,
                  fontWeight: isFocused ? "700" : "500",
                },
              ]}
              numberOfLines={1}
            >
              {config.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function AppTabs() {
  return (
    <Tabs
      tabBar={(props) => <CustomBottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 6,
    paddingHorizontal: 8,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
    borderRadius: 8,
  },
  tabItemPressed: {
    opacity: 0.7,
  },
  iconWrapper: {
    width: 28,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 3,
    textAlign: "center",
  },
});
