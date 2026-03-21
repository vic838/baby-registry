import type { Metadata, Viewport } from "next";
import { Tenor_Sans } from "next/font/google";
import "./globals.css";

const tenorSans = Tenor_Sans({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-tenor-sans",
});

export const metadata: Metadata = {
  title: "Baby Registry",
  description: "Baby registry website",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={tenorSans.variable}>
      <body className="relative min-h-screen bg-[#f8f6f2] antialiased">
        <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.35] md:opacity-[0.12]">
          <img
            src="/background/vogel.webp"
            alt=""
            className="absolute left-[6%] top-[10%] w-[120px] rotate-6 blur-[0.3px] md:w-[140px]"
          />
          <img
            src="/background/varen.webp"
            alt=""
            className="absolute right-[6%] top-[22%] w-[120px] -rotate-6 blur-[0.3px] md:w-[200px]"
          />
          <img
            src="/background/bloem.webp"
            alt=""
            className="absolute bottom-[18%] left-[12%] w-[90px] rotate-3 blur-[0.3px] md:left-[25%] md:w-[140px]"
          />
          <img
            src="/background/bessen.webp"
            alt=""
            className="absolute bottom-[10%] right-[8%] w-[100px] -rotate-12 blur-[0.3px] md:w-[160px]"
          />
        </div>

        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}