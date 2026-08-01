"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
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

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="from" value={from} />
      <label className="flex flex-col gap-2 text-sm font-medium">
        Email
        <input
          className="min-h-11 rounded-xl border border-border bg-surface-raised px-4 text-base text-foreground outline-none transition-colors placeholder:text-foreground/40 focus:border-ring"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="seller@example.com"
          defaultValue={state.email}
          required
        />
      </label>

      {state.message ? (
        <p
          className="text-sm leading-6 text-foreground/75"
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}

      <Button className="w-full" type="submit" disabled={isPending}>
        {isPending ? "Отправляем ссылку…" : "Получить ссылку для входа"}
      </Button>
    </form>
  );
}
