import type { Metadata } from "next";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={tenorSans.variable}>
      <body className="antialiased relative">
        
        {/* 🌿 Background layer */}
        <div className="fixed inset-0 -z-10 pointer-events-none opacity-[0.06] hidden md:block">
          <img
            src="/background/vogel.webp"
            className="absolute top-[8%] left-[8%] w-[140px] rotate-6 blur-[0.3px]"
          />
          <img
            src="/background/varen.webp"
            className="absolute top-[25%] right-[10%] w-[200px] -rotate-6 blur-[0.3px]"
          />
          <img
            src="/background/bloem.webp"
            className="absolute bottom-[20%] left-[25%] w-[140px] rotate-3 blur-[0.3px]"
          />
          <img
            src="/background/bessen.webp"
            className="absolute bottom-[10%] right-[15%] w-[160px] -rotate-12 blur-[0.3px]"
          />
        </div>

        {/* 📄 Content */}
        {children}

      </body>
    </html>
  );
}