import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ProductShell } from "@/components/product-shell";
import "./globals.css";
import "./release.css";
import "./navigation.css";

export const metadata: Metadata = {
  title: {
    default: "FlyTally Training",
    template: "%s · FlyTally Training",
  },
  description: "Source-backed aircraft training with checklists, procedures, performance, limitations and systems.",
  applicationName: "FlyTally Training",
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
