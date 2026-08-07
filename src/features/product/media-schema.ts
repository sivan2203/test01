export const PRODUCT_MEDIA_BUCKET = "product-media";
export const PRODUCT_MEDIA_MAX_COUNT = 10;
export const PRODUCT_MEDIA_MAX_BYTES = 6 * 1024 * 1024;
export const PRODUCT_MEDIA_MAX_REQUEST_BYTES =
  PRODUCT_MEDIA_MAX_BYTES + 64 * 1024;
export const PRODUCT_MEDIA_SIGNED_URL_TTL_SECONDS = 60 * 60;

export const PRODUCT_MEDIA_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type ProductMediaMimeType = (typeof PRODUCT_MEDIA_MIME_TYPES)[number];

export type ProductMedia = {
  id: string;
  url: string;
  mimeType: ProductMediaMimeType;
  sortOrder: number;
  isCover: boolean;
};

export type ProductMediaActionState = {
  status: "idle" | "success" | "error";
  message: string;
  media: ProductMedia[];
};

export type ProductMediaUploadResponse =
  | {
      status: "success";
      message: string;
      media: ProductMedia;
    }
  | {
      status: "error";
      message: string;
      media: null;
    };

export function isProductMediaMimeType(
  value: string,
): value is ProductMediaMimeType {
  return PRODUCT_MEDIA_MIME_TYPES.includes(value as ProductMediaMimeType);
}

export function getProductMediaExtension(mimeType: ProductMediaMimeType) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  return "webp";
}

export function isValidProductMediaOrder(
  currentMediaIds: string[],
  orderedMediaIds: string[],
) {
  if (currentMediaIds.length !== orderedMediaIds.length) return false;

  const currentIds = new Set(currentMediaIds);
  const orderedIds = new Set(orderedMediaIds);

  return (
    currentIds.size === currentMediaIds.length &&
    orderedIds.size === orderedMediaIds.length &&
    orderedMediaIds.every((id) => currentIds.has(id))
  );
}

export function normalizeProductMediaOrder(
  currentMediaIds: string[],
  orderedMediaIds: string[],
) {
  if (!isValidProductMediaOrder(currentMediaIds, orderedMediaIds)) return null;

  return orderedMediaIds.map((id, sortOrder) => ({ id, sortOrder }));
}

export function canRemoveProductMedia(productStatus: string, mediaCount: number) {
  return productStatus !== "published" || mediaCount > 1;
}

export function validateProductMediaFile(
  file: File,
): { isValid: true; mimeType: ProductMediaMimeType } | { isValid: false; message: string } {
  if (file.size <= 0) {
    return { isValid: false, message: "Выберите непустой файл изображения." };
  }

  if (!isProductMediaMimeType(file.type)) {
    return {
      isValid: false,
      message: "Поддерживаются только изображения JPG, PNG или WebP.",
    };
  }

  if (file.size > PRODUCT_MEDIA_MAX_BYTES) {
    return {
      isValid: false,
      message: "Размер одного изображения не должен превышать 6 МБ.",
    };
  }

  return { isValid: true, mimeType: file.type };
}

export async function validateProductMediaSignature(
  file: File,
  mimeType: ProductMediaMimeType,
) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isJpeg =
    mimeType === "image/jpeg" &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff;
  const isPng =
    mimeType === "image/png" &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;
  const isWebp =
    mimeType === "image/webp" &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50;

  return isJpeg || isPng || isWebp
    ? { isValid: true as const }
    : {
        isValid: false as const,
        message: "Файл не похож на настоящее изображение JPG, PNG или WebP.",
      };
}

export function getInitialProductMediaActionState(
  media: ProductMedia[] = [],
): ProductMediaActionState {
  return { status: "idle", message: "", media };
}
