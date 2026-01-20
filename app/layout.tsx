import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { LanguageProvider } from "@/contexts/language-context";
import { Toaster } from "@/components/ui/toaster";
import { DialogProvider } from "@/contexts/dialogContext";

const inter = Inter({ subsets: ["latin"] });

/*export const metadata: Metadata = {
  title: "IoT Dashboard - Lotus Pacific Technologies",
  description:
    "Monitor and control your IoT devices with our advanced dashboard platform",
};*/

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <DialogProvider>
            <LanguageProvider>
              <AuthProvider>
                {children}
                <Toaster />
              </AuthProvider>
            </LanguageProvider>
          </DialogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
