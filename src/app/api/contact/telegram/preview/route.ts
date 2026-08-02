import { getCurrentSellerStoreProfile } from "@/features/store/queries";
import { isAuthorizedPreviewStore } from "@/features/contact/preview";
import { handleTelegramHandoffRequest } from "@/features/contact/telegram-route";

export async function POST(request: Request) {
  const sellerStore = await getCurrentSellerStoreProfile();

  if (sellerStore.status === "unauthenticated") {
    return Response.json({ message: "Предпросмотр недоступен." }, { status: 401 });
  }

  if (sellerStore.status === "error") {
    return Response.json(
      { message: "Не удалось проверить доступ к предпросмотру." },
      { status: 503 },
    );
  }

  if (sellerStore.status === "not_found") {
    return Response.json({ message: "Магазин не найден." }, { status: 404 });
  }

  const body = request.clone();
  let rawBody: unknown;
  try {
    rawBody = await body.json();
  } catch {
    return Response.json({ message: "Некорректный запрос." }, { status: 400 });
  }

  const storeSlug =
    rawBody && typeof rawBody === "object" && !Array.isArray(rawBody)
      ? (rawBody as Record<string, unknown>).storeSlug
      : undefined;

  if (
    typeof storeSlug !== "string" ||
    !isAuthorizedPreviewStore(sellerStore, storeSlug)
  ) {
    return Response.json({ message: "Предпросмотр недоступен." }, { status: 403 });
  }

  return handleTelegramHandoffRequest(request, {
    isPreview: true,
    previewStoreSlug: sellerStore.store.slug,
  });
}
