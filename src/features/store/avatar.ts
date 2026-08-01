export const STORE_AVATAR_BUCKET = "store-avatars";
export const STORE_AVATAR_MAX_BYTES = 2 * 1024 * 1024;

const ALLOWED_AVATAR_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export function validateStoreAvatarFile(file: File | null) {
  if (!file || file.size === 0) {
    return { isValid: true as const, extension: null };
  }

  if (!(file.type in ALLOWED_AVATAR_TYPES)) {
    return {
      isValid: false as const,
      error: "Загрузите фото в формате JPG, PNG или WebP.",
    };
  }

  if (file.size > STORE_AVATAR_MAX_BYTES) {
    return {
      isValid: false as const,
      error: "Фото должно быть не больше 2 МБ.",
    };
  }

  return {
    isValid: true as const,
    extension: ALLOWED_AVATAR_TYPES[file.type as keyof typeof ALLOWED_AVATAR_TYPES],
  };
}

export async function validateStoreAvatarSignature(
  file: File,
  extension: string,
) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());

  const isJpeg =
    extension === "jpg" &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff;
  const isPng =
    extension === "png" &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;
  const isWebp =
    extension === "webp" &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50;

  if (!isJpeg && !isPng && !isWebp) {
    return {
      isValid: false as const,
      error: "Файл не похож на настоящее изображение JPG, PNG или WebP.",
    };
  }

  return { isValid: true as const };
}

export function getStoreAvatarPath(sellerId: string, extension: string) {
  return `${sellerId}/avatar-${crypto.randomUUID()}.${extension}`;
}
