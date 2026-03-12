import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CityProvider } from "@/lib/city-context";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kabadi Man Admin Panel",
  description: "Operational control center for Kabadi Man platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CityProvider>
          {children}
        </CityProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
