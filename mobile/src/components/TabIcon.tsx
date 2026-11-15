import React from "react";
import { View, StyleSheet, Text } from "react-native";

export type TabIconName = "home" | "explore" | "cart" | "orders" | "profile";

interface TabIconProps {
  name: TabIconName;
  color: string;
  focused: boolean;
  size?: number;
  badgeCount?: number;
}

export function TabIcon({
  name,
  color,
  focused,
  size = 24,
  badgeCount = 0,
}: TabIconProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {name === "home" && <HomeIcon color={color} focused={focused} />}
      {name === "explore" && <ExploreIcon color={color} focused={focused} />}
      {name === "cart" && <CartIcon color={color} focused={focused} />}
      {name === "orders" && <OrdersIcon color={color} focused={focused} />}
      {name === "profile" && <ProfileIcon color={color} focused={focused} />}

      {badgeCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {badgeCount > 99 ? "99+" : badgeCount}
          </Text>
        </View>
      )}
    </View>
  );
}

function HomeIcon({ color, focused }: { color: string; focused: boolean }) {
  return (
    <View style={styles.iconBox}>
      {/* Roof peak triangle */}
      <View
        style={[
          styles.roofTriangle,
          {
            borderBottomColor: color,
          },
        ]}
      />
      {/* House body */}
      <View
        style={[
          styles.houseBody,
          {
            borderColor: color,
            borderWidth: focused ? 0 : 2,
            backgroundColor: focused ? color : "transparent",
          },
        ]}
      >
        {/* Door cutout */}
        <View
          style={[
            styles.houseDoor,
            {
              backgroundColor: focused ? "#FFFFFF" : color,
            },
          ]}
        />
      </View>
    </View>
  );
}

function ExploreIcon({ color, focused }: { color: string; focused: boolean }) {
  return (
    <View style={styles.iconBox}>
      {/* Magnifier glass circle */}
      <View
        style={[
          styles.searchCircle,
          {
            borderColor: color,
            borderWidth: 2,
            backgroundColor: focused ? `${color}20` : "transparent",
          },
        ]}
      />
      {/* Compass / search handle */}
      <View
        style={[
          styles.searchHandle,
          {
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

function CartIcon({ color, focused }: { color: string; focused: boolean }) {
  return (
    <View style={styles.iconBox}>
      {/* Handle */}
      <View style={[styles.cartHandle, { backgroundColor: color }]} />
      {/* Basket body */}
      <View
        style={[
          styles.cartBasket,
          {
            borderColor: color,
            borderWidth: focused ? 0 : 2,
            backgroundColor: focused ? color : "transparent",
          },
        ]}
      />
      {/* Wheels */}
      <View style={styles.wheelRow}>
        <View style={[styles.wheel, { backgroundColor: color }]} />
        <View style={[styles.wheel, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

function OrdersIcon({ color, focused }: { color: string; focused: boolean }) {
  return (
    <View style={styles.iconBox}>
      {/* Shopping bag handles */}
      <View
        style={[
          styles.bagHandle,
          {
            borderColor: color,
          },
        ]}
      />
      {/* Bag body */}
      <View
        style={[
          styles.bagBody,
          {
            borderColor: color,
            borderWidth: focused ? 0 : 2,
            backgroundColor: focused ? color : "transparent",
          },
        ]}
      >
        {/* Subtle accent fold line on bag */}
        <View
          style={[
            styles.bagCrease,
            {
              backgroundColor: focused ? "#FFFFFF" : color,
            },
          ]}
        />
      </View>
    </View>
  );
}

function ProfileIcon({ color, focused }: { color: string; focused: boolean }) {
  return (
    <View style={styles.iconBox}>
      {/* User Head */}
      <View
        style={[
          styles.userHead,
          {
            borderColor: color,
            borderWidth: focused ? 0 : 2,
            backgroundColor: color,
          },
        ]}
      />
      {/* User Shoulders Base */}
      <View
        style={[
          styles.userShoulders,
          {
            borderColor: color,
            borderWidth: focused ? 0 : 2,
            backgroundColor: focused ? color : "transparent",
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  iconBox: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -8,
    backgroundColor: "#DC2626",
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    textAlign: "center",
  },
  // Home
  roofTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderBottomWidth: 7,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderStyle: "solid",
  },
  houseBody: {
    width: 14,
    height: 11,
    marginTop: -1,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  houseDoor: {
    width: 4,
    height: 5,
    borderTopLeftRadius: 1.5,
    borderTopRightRadius: 1.5,
  },
  // Explore
  searchCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 4,
    marginBottom: 4,
  },
  searchHandle: {
    position: "absolute",
    bottom: 3,
    right: 3,
    width: 6,
    height: 2.5,
    borderRadius: 1.5,
    transform: [{ rotate: "45deg" }],
  },
  // Cart
  cartHandle: {
    position: "absolute",
    top: 3,
    left: 2,
    width: 5,
    height: 2,
    borderRadius: 1,
    transform: [{ rotate: "-25deg" }],
  },
  cartBasket: {
    width: 17,
    height: 11,
    borderRadius: 3,
    marginTop: 2,
    marginLeft: 3,
  },
  wheelRow: {
    flexDirection: "row",
    gap: 7,
    marginTop: 2,
    marginLeft: 4,
  },
  wheel: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
  },
  // Orders
  bagHandle: {
    width: 8,
    height: 5,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    marginBottom: -1,
  },
  bagBody: {
    width: 15,
    height: 13,
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  bagCrease: {
    width: 5,
    height: 1.5,
    borderRadius: 1,
  },
  // Profile
  userHead: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  userShoulders: {
    width: 16,
    height: 7,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
});
