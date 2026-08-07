"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, fieldControlClassName } from "@/components/ui/field";
import { StatusMessage } from "@/components/ui/status-message";
import { requestSellerMagicLink } from "./actions";
import { initialSignInFormState } from "./state";

type SellerSignInFormProps = {
  from: string;
};

export function SellerSignInForm({ from }: SellerSignInFormProps) {
  const [state, formAction, isPending] = useActionState(
    requestSellerMagicLink,
    initialSignInFormState,
  );
  const emailHasError = state.status === "error";

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="from" value={from} />
      <Field
        helper="Пришлём одноразовую ссылку. Обычно она приходит в течение минуты."
        htmlFor="seller-email"
        label="Email"
      >
        <input
          aria-describedby={
            emailHasError
              ? "seller-email-help seller-email-status"
              : "seller-email-help"
          }
          aria-invalid={emailHasError}
          className={fieldControlClassName}
          id="seller-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="seller@example.com"
          defaultValue={state.email}
          required
        />
      </Field>

      <StatusMessage error={emailHasError} id="seller-email-status">
        {state.message}
      </StatusMessage>

      <Button className="w-full" type="submit" disabled={isPending}>
        {isPending ? "Отправляем ссылку…" : "Получить ссылку для входа"}
      </Button>
    </form>
  );
}
