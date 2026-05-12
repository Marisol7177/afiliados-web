import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Create Your Meme Coin",
  description: "Launch crypto tokens instantly",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>

        {/* ONE SINGLE GTAG LOADER */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-18157086862"
          strategy="afterInteractive"
        />

        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;

            gtag('js', new Date());

            // Google Ads
            gtag('config', 'AW-18157086862');

            // GA4 (solo config, NO segundo script)
            gtag('config', 'G-XXXXXXXXXX');
          `}
        </Script>

        {children}
      </body>
    </html>
  );
}
