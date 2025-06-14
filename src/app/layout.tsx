import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { ErrorBoundary } from "@/components/error/error-boundary";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ink 37 Tattoos - Admin Dashboard",
  description: "Professional tattoo artist administration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ErrorBoundary>
          <Providers>
            {children}
          </Providers>
          <Toaster richColors />
        </ErrorBoundary>
      </body>
    </html>
  );
}
