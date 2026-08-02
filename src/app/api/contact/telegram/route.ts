import { handleTelegramHandoffRequest } from "@/features/contact/telegram-route";

export async function POST(request: Request) {
  return handleTelegramHandoffRequest(request, { isPreview: false });
}
