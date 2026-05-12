import type { Metadata } from "next";
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
      <head>

        {/* ===== GOOGLE TAG (UN SOLO LOADER) ===== */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-18157086862"
        ></script>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;

              gtag('js', new Date());

              // GOOGLE ADS (conversión)
              gtag('config', 'AW-18157086862');

              // GOOGLE ANALYTICS 4 (IMPORTANTE: tu ID real aquí)
              gtag('config', 'G-XXXXXXXXXX');
            `,
          }}
        ></script>

      </head>

      <body>{children}</body>
    </html>
  );
}
