import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { ProductShell } from "@/components/product-shell";
import "./globals.css";
import "./release.css";
import "./navigation.css";
import "./learner-shell.css";
import "./flytally-brand.css";
import "./mobile-app.css";
import "./v300-u5-training.css";

export const metadata: Metadata = {
  title: {
    default: "FlyTally Training",
    template: "%s · FlyTally Training",
  },
  description: "Source-backed aircraft training with checklists, procedures, performance, limitations and systems.",
  applicationName: "FlyTally Training",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/pwa-icon",
    apple: "/pwa-icon",
  },
  appleWebApp: {
    capable: true,
    title: "FlyTally Training",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f4f7fb",
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
