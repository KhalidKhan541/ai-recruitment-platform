import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TalentAI - AI-Powered Recruitment Platform",
    template: "%s | TalentAI",
  },
  description:
    "Revolutionize your hiring process with AI-powered candidate matching, automated screening, and intelligent recruitment workflows.",
  keywords: [
    "recruitment",
    "hiring",
    "AI",
    "candidate matching",
    "ATS",
    "applicant tracking",
  ],
  authors: [{ name: "TalentAI Team" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "TalentAI",
    title: "TalentAI - AI-Powered Recruitment Platform",
    description:
      "Revolutionize your hiring process with AI-powered candidate matching and intelligent recruitment workflows.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TalentAI Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TalentAI - AI-Powered Recruitment Platform",
    description:
      "Revolutionize your hiring process with AI-powered candidate matching.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
