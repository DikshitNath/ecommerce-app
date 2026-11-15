import React, { useState } from "react";
import {
  Image,
  ImageStyle,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { resolveImageUrl } from "../services/image-upload.service";

interface ProductImageProps {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  fallbackText?: string;
  resizeMode?: "cover" | "contain" | "stretch" | "center";
}

export default function ProductImage({
  uri,
  style,
  containerStyle,
  fallbackText = "No Image",
  resizeMode = "cover",
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);
  const resolvedUri = resolveImageUrl(uri);

  if (!resolvedUri || hasError) {
    return (
      <View style={[styles.placeholderContainer, style as any, containerStyle]}>
        <Text style={styles.placeholderIcon}>🖼️</Text>
        <Text style={styles.placeholderText}>{fallbackText}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: resolvedUri }}
      style={[styles.image, style]}
      resizeMode={resizeMode}
      onError={() => setHasError(true)}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: "#F3F4F6",
  },
  placeholderContainer: {
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    minHeight: 100,
  },
  placeholderIcon: {
    fontSize: 28,
    marginBottom: 4,
    opacity: 0.6,
  },
  placeholderText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
});
