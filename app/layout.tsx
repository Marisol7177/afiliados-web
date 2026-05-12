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

        {/* GOOGLE ADS (gtag.js) */}
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
              gtag('config', 'AW-18157086862', {
                send_page_view: true
              });
            `,
          }}
        ></script>

      </head>

      <body>{children}</body>
    </html>
  );
}
