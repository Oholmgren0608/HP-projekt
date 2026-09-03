import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { PlanProvider } from "@/components/plan-context";
import { AuthProvider } from "@/lib/supabase/auth-context";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const sans = Source_Sans_3({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HP Lift — Studieplan för Högskoleprovet",
  description:
    "Mata in dina HP-resultat och få en personlig studieplan med prioritering, tidsfördelning och veckoplan.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="sv"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        {/* Be Dark Reader att hoppa över sidan — tillägget lägger annars till
            data-darkreader-*-attribut som ger hydreringsvarningar (se scriptet). */}
        <meta name="darkreader-lock" />
        <AuthProvider>
          <PlanProvider>
            <AppShell>{children}</AppShell>
          </PlanProvider>
        </AuthProvider>
        {/*
          Dark Reader och liknande webbläsartillägg lägger till data-*-attribut
          på elementen innan React hydrerar. Server-HTML:en har inte dessa, så
          React varnar om mismatch. Kör före hydrering och ta bort attributen —
          tillägget återskapar dem vid behov efteråt, utan nya kontroller.
        */}
        <Script id="strip-extension-attrs" strategy="beforeInteractive">
          {`
          (function () {
            try {
              var all = document.querySelectorAll("*");
              for (var i = 0; i < all.length; i++) {
                var attrs = all[i].attributes;
                for (var j = attrs.length - 1; j >= 0; j--) {
                  var name = attrs[j].name;
                  if (name.indexOf("data-darkreader") === 0) {
                    all[i].removeAttribute(name);
                  }
                }
              }
            } catch (e) {}
          })();
          `}
        </Script>
      </body>
    </html>
  );
}
