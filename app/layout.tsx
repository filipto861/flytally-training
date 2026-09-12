import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { ProductShell } from "@/components/product-shell";
import "./globals.css";
import "./release.css";
import "./navigation.css";
import "./learner-shell.css";

export const metadata: Metadata = {
  title: {
    default: "FlyTally Training",
    template: "%s · FlyTally Training",
  },
  description: "Source-backed aircraft training with checklists, procedures, performance, limitations and systems.",
  applicationName: "FlyTally Training",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#101a29",
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
