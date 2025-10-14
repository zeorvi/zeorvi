import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { localeConfig } from "@/config/locale";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Restaurante IA Plataforma",
  description: "Plataforma inteligente para gestión de restaurantes con IA",
  metadataBase: new URL('http://localhost:3000'),
  openGraph: {
    title: "Restaurante IA Plataforma",
    description: "Plataforma inteligente para gestión de restaurantes con IA",
    locale: localeConfig.defaultLocale,
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={localeConfig.defaultLocale}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        <meta httpEquiv="Content-Language" content="es-ES" />
        <meta name="language" content="Spanish" />
        <meta name="locale" content="es_ES" />
        <meta name="charset" content="utf-8" />
        <meta name="encoding" content="utf-8" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
