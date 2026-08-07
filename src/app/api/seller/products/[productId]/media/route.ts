import {
  type ProductMediaUploadServiceResult,
  uploadSingleProductMedia,
} from "@/features/product/media-upload-service";
import {
  PRODUCT_MEDIA_MAX_REQUEST_BYTES,
  type ProductMediaUploadResponse,
} from "@/features/product/media-schema";
import { isProductId } from "@/features/product/queries";

const RESPONSE_HEADERS = {
  "Cache-Control": "private, no-store",
};

function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function getResponseStatus(result: ProductMediaUploadServiceResult) {
  if (result.status === "success") return 201;

  if (result.code === "invalid_file") return 400;
  if (result.code === "unauthenticated") return 401;
  if (result.code === "not_found") return 404;
  if (result.code === "limit_reached") return 409;
  return 503;
}

function toUploadResponse(
  result: ProductMediaUploadServiceResult,
): ProductMediaUploadResponse {
  return result.status === "success"
    ? {
        status: "success",
        message: result.message,
        media: result.media,
      }
    : {
        status: "error",
        message: result.message,
        media: null,
      };
}

function errorResponse(message: string, status: number) {
  const body: ProductMediaUploadResponse = {
    status: "error",
    message,
    media: null,
  };
  return Response.json(body, { status, headers: RESPONSE_HEADERS });
}

export async function POST(
  request: Request,
  context: RouteContext<"/api/seller/products/[productId]/media">,
) {
  if (!isSameOriginRequest(request)) {
    return errorResponse("Запрос на загрузку отклонён.", 403);
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data;")) {
    return errorResponse("Ожидается одно изображение.", 415);
  }

  const contentLengthHeader = request.headers.get("content-length");
  const contentLength = contentLengthHeader
    ? Number(contentLengthHeader)
    : Number.NaN;
  if (!Number.isFinite(contentLength) || contentLength <= 0) {
    return errorResponse("Не удалось определить размер запроса.", 411);
  }
  if (contentLength > PRODUCT_MEDIA_MAX_REQUEST_BYTES) {
    return errorResponse("Размер одного изображения не должен превышать 6 МБ.", 413);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("Не удалось прочитать изображение.", 400);
  }

  const fileEntries = Array.from(formData.entries()).filter(
    (entry): entry is [string, File] => entry[1] instanceof File,
  );
  const files = formData.getAll("file");
  const uploadId = formData.get("uploadId");
  if (
    fileEntries.length !== 1 ||
    files.length !== 1 ||
    !(files[0] instanceof File) ||
    typeof uploadId !== "string" ||
    !isProductId(uploadId)
  ) {
    return errorResponse("Отправьте ровно одно изображение с корректным идентификатором загрузки.", 400);
  }

  const { productId } = await context.params;
  const result = await uploadSingleProductMedia(productId, files[0], uploadId);
  return Response.json(toUploadResponse(result), {
    status: getResponseStatus(result),
    headers: RESPONSE_HEADERS,
  });
}
