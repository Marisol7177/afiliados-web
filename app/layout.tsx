import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Create Your Meme Coin",
  description: "Launch crypto tokens instantly",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>

        {/* GOOGLE TAG */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-18157086862"
          strategy="afterInteractive"
        />

        {/* INIT */}
        <Script id="google-ads" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];

            function gtag(){
              dataLayer.push(arguments);
            }

            window.gtag = gtag;

            gtag('js', new Date());

            gtag('config', 'AW-18157086862');
          `}
        </Script>

        {children}
      </body>
    </html>
  );
}
