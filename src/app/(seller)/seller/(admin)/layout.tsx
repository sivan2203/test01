import { SellerShell } from "@/components/seller/seller-shell";
import { signOutSeller } from "@/features/seller-auth/actions";

export default function SellerAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SellerShell signOutAction={signOutSeller}>{children}</SellerShell>;
}
