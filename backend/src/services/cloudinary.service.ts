import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from "cloudinary";

export interface CloudinaryUploadResult {
  url: string;
  secure_url: string;
  public_id: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
}

export function getCloudinaryConfig(): {
  cloud_name?: string;
  api_key?: string;
  api_secret?: string;
} {
  return {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  };
}

export function isCloudinaryConfigured(): boolean {
  const { cloud_name, api_key, api_secret } = getCloudinaryConfig();
  return Boolean(
    cloud_name &&
      cloud_name.trim() &&
      api_key &&
      api_key.trim() &&
      api_secret &&
      api_secret.trim()
  );
}

export function getCloudinaryClient() {
  const { cloud_name, api_key, api_secret } = getCloudinaryConfig();
  cloudinary.config({
    cloud_name: cloud_name?.trim(),
    api_key: api_key?.trim(),
    api_secret: api_secret?.trim(),
    secure: true,
  });
  return cloudinary;
}

/**
 * Uploads an image buffer directly to Cloudinary using upload_stream
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string;
    publicId?: string;
    filename?: string;
  } = {}
): Promise<CloudinaryUploadResult> {
  const client = getCloudinaryClient();
  const folder = options.folder || "shopease/products";

  return new Promise((resolve, reject) => {
    const uploadStream = client.uploader.upload_stream(
      {
        folder,
        public_id: options.publicId,
        resource_type: "image",
      },
      (
        error: UploadApiErrorResponse | undefined,
        result: UploadApiResponse | undefined
      ) => {
        if (error) {
          return reject(error);
        }
        if (!result) {
          return reject(new Error("Cloudinary returned an empty response."));
        }
        resolve({
          url: result.secure_url,
          secure_url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Deletes an image from Cloudinary using its public_id
 */
export async function deleteFromCloudinary(
  publicId: string
): Promise<{ result: string }> {
  const client = getCloudinaryClient();
  const res = await client.uploader.destroy(publicId, {
    resource_type: "image",
  });
  return res;
}

/**
 * Safely extracts Cloudinary public_id from a URL or raw public_id string
 * Ensures only assets within shopease/products/ are targeted
 */
export function extractPublicIdFromUrl(imageUrl: string): string | null {
  if (!imageUrl || typeof imageUrl !== "string") return null;

  const trimmed = imageUrl.trim();

  // If already public ID format
  if (trimmed.startsWith("shopease/products/")) {
    return trimmed.replace(/\.[a-zA-Z0-9]+$/, "");
  }

  // Match standard Cloudinary URLs:
  // https://res.cloudinary.com/<cloud>/image/upload/(v<version>/)?(shopease/products/<id>)(.<ext>)?
  const match = trimmed.match(
    /\/image\/upload\/(?:v\d+\/)?(shopease\/products\/[^./?#]+)(?:\.[a-zA-Z0-9]+)?/
  );
  if (match) {
    return match[1];
  }

  return null;
}

export const cloudinaryService = {
  getCloudinaryConfig,
  isCloudinaryConfigured,
  getCloudinaryClient,
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicIdFromUrl,
};

export default cloudinaryService;
