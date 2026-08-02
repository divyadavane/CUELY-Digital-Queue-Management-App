import type { Metadata } from "next";
import { Dancing_Script, Lora } from 'next/font/google';
import { baticaSans } from "@/lib/fonts";
import Script from "next/script";
import "./globals.css";
import Providers from "@/components/layout/Providers";
import { ThemeProvider } from "@/components/theme-provider";

const accentCursive = Dancing_Script({ subsets: ['latin'], variable: '--font-accent', weight: ['700'] });
const lora = Lora({ subsets: ['latin'], variable: '--font-lora', weight: ['400', '500', '600', '700'] });

export const metadata: Metadata = {
  title: "Cuely — Digital Queue Management",
  description: "Scan a QR code, join the queue, watch your position update live. No app download, no standing in line.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${baticaSans.variable} ${accentCursive.variable} ${lora.variable} font-sans antialiased bg-background text-foreground transition-colors duration-300`}>
        <Script
          id="theme-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('cuely-theme') || 'beige';
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
        <ThemeProvider>
          <Providers>
            {children}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
