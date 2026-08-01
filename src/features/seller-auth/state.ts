export type SignInFormState = {
  status: "idle" | "success" | "error";
  message: string;
  email?: string;
};

export const initialSignInFormState: SignInFormState = {
  status: "idle",
  message: "",
};
