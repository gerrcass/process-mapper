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

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
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
  },
  twitter: {
    card: "summary_large_image",
    title: "Process Atlas",
    description: "Frame a process as a SIPOC sheet and map its flow in one local-first workspace.",
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
