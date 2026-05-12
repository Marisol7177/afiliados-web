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

        {/* GOOGLE ADS */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-18157086862"
          strategy="afterInteractive"
        />

        <Script id="gtag-ads" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];

            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;

            gtag('js', new Date());
            gtag('config', 'AW-18157086862');
          `}
        </Script>

        {/* GOOGLE ANALYTICS 4 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
          strategy="afterInteractive"
        />

        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];

            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;

            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX');
          `}
        </Script>

        {children}
      </body>
    </html>
  );
}
