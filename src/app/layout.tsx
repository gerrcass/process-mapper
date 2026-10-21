import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.GITHUB_PAGES === "true"
    ? "https://gerrcass.github.io/process-mapper"
    : process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Process Atlas",
    template: "%s · Process Atlas",
  },
  description:
    "A local-first workspace for framing a process as a SIPOC sheet and mapping its flow. No account, no backend.",
  applicationName: "Process Atlas",
  openGraph: {
    title: "Process Atlas",
    description: "Frame a process as a SIPOC sheet and map its flow in one local-first workspace.",
    type: "website",
    images: [
      {
        url: "og.png",
        width: 1200,
        height: 630,
        alt: "Process Atlas: frame the process, map the flow.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Process Atlas",
    description: "Frame a process as a SIPOC sheet and map its flow in one local-first workspace.",
    images: ["og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#F4F1E9",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
