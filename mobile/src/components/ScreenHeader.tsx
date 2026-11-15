import React, { ReactNode } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: ReactNode;
  backgroundColor?: string;
  borderBottom?: boolean;
}

export function ScreenHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightElement,
  backgroundColor = "#FFFFFF",
  borderBottom = true,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          paddingTop: Math.max(insets.top, 14) + 8,
          borderBottomWidth: borderBottom ? 1 : 0,
        },
      ]}
    >
      <View style={styles.contentRow}>
        {showBack && (
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
          >
            <Text style={styles.backArrow}>←</Text>
          </Pressable>
        )}

        <View style={styles.titleColumn}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {!!subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        {rightElement ? (
          <View style={styles.rightWrapper}>{rightElement}</View>
        ) : (
          showBack && <View style={styles.spacer} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomColor: "#E2E8F0",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  backButtonPressed: {
    backgroundColor: "#E2E8F0",
  },
  backArrow: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 22,
  },
  titleColumn: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  rightWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  spacer: {
    width: 36,
  },
});
