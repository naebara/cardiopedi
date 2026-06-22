export const dynamic = "force-dynamic";

const recoveryScript = `
(function () {
  var storageKey = "cardiopedi:missing-static-reload-at";
  var reloadWindowMs = 30000;

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
})();
`;

export function GET() {
  return new Response(recoveryScript, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      "Content-Type": "application/javascript; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex",
    },
  });
}
