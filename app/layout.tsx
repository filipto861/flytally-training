import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ProductShell } from "@/components/product-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlyTally Training",
  description: "Simulator-first aircraft training from cold and dark to shutdown.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ProductShell>{children}</ProductShell>
      </body>
    </html>
  );
}
