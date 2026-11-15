export interface SelectedImage {
  uri: string;
  base64?: string;
  name?: string;
  mimeType?: string;
  size?: number;
}

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "heic",
  "heif",
];

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/jfif",
  "image/png",
  "image/x-png",
  "image/webp",
  "image/x-webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
];

/**
 * Normalizes common MIME aliases to standard MIME types
 */
export function normalizeClientMimeType(mime?: string | null): string | null {
  if (!mime || typeof mime !== "string") return null;
  const lower = mime.trim().toLowerCase();
  switch (lower) {
    case "image/jpg":
    case "image/jpeg":
    case "image/pjpeg":
    case "image/jfif":
      return "image/jpeg";
    case "image/png":
    case "image/x-png":
      return "image/png";
    case "image/webp":
    case "image/x-webp":
      return "image/webp";
    case "image/gif":
      return "image/gif";
    case "image/heic":
    case "image/heif":
    case "image/heic-sequence":
    case "image/heif-sequence":
      return "image/heic";
    default:
      return lower;
  }
}

/**
 * Accurately determines the true MIME type, extension and filename for an asset,
 * reconciling Android/Expo transcoding differences (e.g. HEIC/PNG transcoded to JPEG).
 */
export function resolveAssetMimeTypeAndFilename(asset: {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
  base64?: string | null;
}): { mimeType: string; extension: string; fileName: string } {
  let trueMime = normalizeClientMimeType(asset.mimeType);
  let trueExt = "jpg";

  // Check base64 magic bytes if available (authoritative client-side signal)
  if (asset.base64 && typeof asset.base64 === "string") {
    const header = asset.base64.substring(0, 20);
    if (header.startsWith("/9j/")) {
      trueMime = "image/jpeg";
      trueExt = "jpg";
    } else if (header.startsWith("iVBOR")) {
      trueMime = "image/png";
      trueExt = "png";
    } else if (header.startsWith("R0lGO")) {
      trueMime = "image/gif";
      trueExt = "gif";
    } else if (header.startsWith("UklGR")) {
      trueMime = "image/webp";
      trueExt = "webp";
    } else if (header.includes("ftyp") || header.startsWith("AAAA")) {
      trueMime = "image/heic";
      trueExt = "heic";
    }
  } else if (asset.uri) {
    // Check URI extension
    const uriPath = asset.uri.split("?")[0].toLowerCase();
    if (uriPath.endsWith(".jpeg") || uriPath.endsWith(".jpg")) {
      trueMime = "image/jpeg";
      trueExt = "jpg";
    } else if (uriPath.endsWith(".png")) {
      trueMime = "image/png";
      trueExt = "png";
    } else if (uriPath.endsWith(".webp")) {
      trueMime = "image/webp";
      trueExt = "webp";
    } else if (uriPath.endsWith(".gif")) {
      trueMime = "image/gif";
      trueExt = "gif";
    } else if (uriPath.endsWith(".heic") || uriPath.endsWith(".heif")) {
      trueMime = "image/heic";
      trueExt = "heic";
    }
  }

  // Fallback to normalized declared MIME type
  if (!trueMime) {
    trueMime = "image/jpeg";
    trueExt = "jpg";
  } else {
    switch (trueMime) {
      case "image/png":
        trueExt = "png";
        break;
      case "image/webp":
        trueExt = "webp";
        break;
      case "image/gif":
        trueExt = "gif";
        break;
      case "image/heic":
        trueExt = "heic";
        break;
      case "image/jpeg":
      default:
        trueExt = "jpg";
        break;
    }
  }

  // Construct a safe, matching filename
  const baseName = asset.fileName
    ? asset.fileName.replace(/\.[a-zA-Z0-9]+$/, "")
    : `photo-${Date.now()}`;
  const safeFilename = `${baseName}.${trueExt}`;

  return {
    mimeType: trueMime,
    extension: trueExt,
    fileName: safeFilename,
  };
}

/**
 * Resolves relative image paths (e.g. /uploads/products/xyz.jpg) to full accessible URLs
 */
export function resolveImageUrl(url?: string | null): string {
  if (!url || typeof url !== "string" || !url.trim()) {
    return "";
  }

  const trimmed = url.trim();

  // If already absolute URL or data URI, return as-is
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("file://")
  ) {
    return trimmed;
  }

  // Prepend base URL from EXPO_PUBLIC_API_URL or fallback
  const rawApiUrl =
    process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api";
  const baseUrl = rawApiUrl.replace(/\/api\/?$/, "");

  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Validates whether an image format and size is permitted
 */
export function validateImageFile(file: {
  mimeType?: string;
  name?: string;
  size?: number;
}): { valid: boolean; error?: string } {
  if (file.size && file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the 5MB limit (${(
        file.size /
        (1024 * 1024)
      ).toFixed(1)}MB).`,
    };
  }

  if (file.mimeType) {
    const normalized = normalizeClientMimeType(file.mimeType);
    if (!normalized || !ALLOWED_MIME_TYPES.includes(normalized)) {
      return {
        valid: false,
        error: `Unsupported image format (${file.mimeType}). Please use JPEG, PNG, WEBP, GIF, or HEIC.`,
      };
    }
  } else if (file.name) {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        error: `Unsupported file extension (.${ext}). Please use JPG, PNG, WEBP, GIF, or HEIC.`,
      };
    }
  }

  return { valid: true };
}

/**
 * Launches the device gallery to pick one or more images
 */
export async function pickImagesFromGallery(): Promise<{
  canceled: boolean;
  images: SelectedImage[];
  error?: string;
}> {
  try {
    const ImagePicker = await import("expo-image-picker");
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return {
        canceled: true,
        images: [],
        error: "Permission to access device photo gallery was denied.",
      };
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 0.8,
      base64: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { canceled: true, images: [] };
    }

    const validImages: SelectedImage[] = [];

    for (const asset of result.assets) {
      const validation = validateImageFile({
        mimeType: asset.mimeType,
        name: asset.fileName ?? undefined,
        size: asset.fileSize ?? undefined,
      });

      if (!validation.valid) {
        return {
          canceled: true,
          images: [],
          error: validation.error,
        };
      }

      // Reconcile actual format and name from asset signature and URI
      const resolved = resolveAssetMimeTypeAndFilename({
        uri: asset.uri,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
        base64: asset.base64,
      });

      validImages.push({
        uri: asset.uri,
        base64: asset.base64 ?? undefined,
        name: resolved.fileName,
        mimeType: resolved.mimeType,
        size: asset.fileSize ?? undefined,
      });
    }

    return {
      canceled: false,
      images: validImages,
    };
  } catch (error: any) {
    return {
      canceled: true,
      images: [],
      error: error?.message || "Failed to open device image gallery.",
    };
  }
}

/**
 * Uploads selected images to the backend upload endpoint using FormData multipart upload
 */
export async function uploadProductImages(
  images: SelectedImage[]
): Promise<string[]> {
  if (!images || images.length === 0) {
    return [];
  }

  const { api } = await import("./api");

  // Determine if FormData can be used (standard in React Native / browser)
  if (typeof FormData !== "undefined") {
    try {
      const formData = new FormData();

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const resolvedMime = img.mimeType || "image/jpeg";
        const resolvedName = img.name || `photo-${Date.now()}-${i}.jpg`;

        // React Native multipart file object
        const fileObj = {
          uri: img.uri,
          name: resolvedName,
          type: resolvedMime,
        };

        formData.append("images", fileObj as any);
      }

      const response = await api.post<{
        success: boolean;
        urls: string[];
        data: { path: string; url: string }[];
      }>("/upload/images", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success && response.data.urls) {
        return response.data.urls;
      }
    } catch (formDataError: any) {
      // If FormData fails (e.g. in test environment without native URI resolution), fallback to JSON base64
      if (!images.some((img) => img.base64)) {
        throw formDataError;
      }
    }
  }

  // Base64 JSON fallback
  const payload = {
    images: images.map((img) => ({
      base64: img.base64,
      name: img.name,
      mimeType: img.mimeType,
    })),
  };

  const response = await api.post<{
    success: boolean;
    urls: string[];
    data: { path: string; url: string }[];
  }>("/upload/images", payload);

  if (!response.data.success || !response.data.urls) {
    throw new Error(
      "Server returned an unsuccessful response during image upload."
    );
  }

  return response.data.urls;
}
