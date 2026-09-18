import type { Metadata, Viewport } from "next";
import { Fraunces, Nunito } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { PlanProvider } from "@/components/plan-context";
import { AuthProvider } from "@/lib/supabase/auth-context";
import { PreferencesProvider } from "@/lib/preferences";
import { GamificationProvider } from "@/lib/gamification/provider";
import { CelebrationLayer } from "@/components/gamification/celebration-layer";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
});

const sans = Nunito({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: {
    default: "HP Lift — Studieplan för Högskoleprovet",
    template: "%s · HP Lift",
  },
  description:
    "Mata in dina HP-resultat och få en personlig studieplan med prioritering, tidsfördelning och veckoplan.",
  other: {
    // Be Dark Reader att hoppa över sidan — tillägget lägger annars till
    // data-darkreader-*-attribut som ger hydreringsvarningar (se scriptet).
    "darkreader-lock": "",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f5ef" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1417" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="sv"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} h-full antialiased`}
    >
      <head>
        {/* Sätt tema-klassen innan första målningen — undviker ljust flimmer
            i mörkt läge. Körs i <head> direkt, inte via beforeInteractive. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var stored = localStorage.getItem("hp-lift-theme");
                  var dark = stored === "dark"
                    || ((stored !== "light") && window.matchMedia("(prefers-color-scheme: dark)").matches);
                  if (dark) document.documentElement.classList.add("dark");
                } catch (e) {}
              })();
            `,
          }}
        />
        {/*
          Dark Reader och liknande webbläsartillägg lägger till data-*-attribut
          på elementen innan React hydrerar. Server-HTML:en har inte dessa, så
          React varnar om mismatch. Ta bort attributen — tillägget återskapar
          dem vid behov efteråt, utan nya kontroller. Körs inline i <head>
          direkt, precis som tema-scriptet ovan, i stället för via
          <Script strategy="beforeInteractive"> som kastade React-felet
          "Encountered a script tag" på 404-rutter. Kör även om vid
          DOMContentLoaded så att attribut på body-element hinns med.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                function strip() {
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
                }
                strip();
                if (document.readyState === "loading") {
                  document.addEventListener("DOMContentLoaded", strip);
                }
              })();
            `,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <PreferencesProvider>
          <AuthProvider>
            <GamificationProvider>
              <PlanProvider>
                <AppShell>{children}</AppShell>
                <CelebrationLayer />
              </PlanProvider>
            </GamificationProvider>
          </AuthProvider>
        </PreferencesProvider>
      </body>
    </html>
  );
}
