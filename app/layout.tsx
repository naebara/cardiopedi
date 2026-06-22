import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import '@mantine/core/styles.css';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
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
  title: "Cardiopedi | Cardiologie pediatrica",
  description: "Clinica medicala pentru copii specializata in cardiologie pediatrica.",
};

const nextStaticRecoveryScript = `
(function () {
  var storageKey = "cardiopedi:next-static-reload-at";
  var reloadWindowMs = 30000;

  function isNextStaticAsset(target) {
    var source = target && (target.src || target.href);
    return typeof source === "string" && source.indexOf("/_next/static/") !== -1;
  }

  function reloadWithFreshDocument() {
    try {
      var now = Date.now();
      var lastReloadAt = Number(window.sessionStorage.getItem(storageKey) || "0");

      if (now - lastReloadAt < reloadWindowMs) {
        return;
      }

      window.sessionStorage.setItem(storageKey, String(now));
    } catch (error) {}

    var url = new URL(window.location.href);
    url.searchParams.set("__fresh", String(Date.now()));
    window.location.replace(url.toString());
  }

  window.addEventListener("error", function (event) {
    if (isNextStaticAsset(event.target)) {
      reloadWithFreshDocument();
    }
  }, true);

  window.addEventListener("unhandledrejection", function (event) {
    var reason = event.reason;
    var message = reason && (reason.message || String(reason));

    if (message && message.indexOf("Loading chunk") !== -1) {
      reloadWithFreshDocument();
    }
  });
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <head>
        <script
          id="next-static-recovery"
          dangerouslySetInnerHTML={{ __html: nextStaticRecoveryScript }}
        />
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MantineProvider defaultColorScheme="light">{children}</MantineProvider>
      </body>
    </html>
  );
}
