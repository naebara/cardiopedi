import { resolve4, resolve6, resolveMx } from "node:dns/promises";

type DomainValidationResult = "deliverable" | "invalid" | "unknown";

const DOMAIN_CACHE = new Map<string, { expiresAt: number; result: DomainValidationResult }>();
const DEFINITIVE_DNS_ERRORS = new Set(["ENODATA", "ENOTFOUND"]);
const LOOKUP_TIMEOUT_MS = 180;

function errorCode(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return null;
  }

  return String(error.code);
}

async function lookupDomain(domain: string): Promise<DomainValidationResult> {
  const [mxLookup, ipv4Lookup, ipv6Lookup] = await Promise.allSettled([
    resolveMx(domain),
    resolve4(domain),
    resolve6(domain),
  ]);

  if (mxLookup.status === "fulfilled"
    && mxLookup.value.some((record) => record.exchange !== "" && record.exchange !== ".")) {
    return "deliverable";
  }

  // RFC 7505: a single MX record with an empty exchange explicitly rejects email.
  if (mxLookup.status === "fulfilled" && mxLookup.value.length > 0) {
    return "invalid";
  }

  if ((ipv4Lookup.status === "fulfilled" && ipv4Lookup.value.length > 0)
    || (ipv6Lookup.status === "fulfilled" && ipv6Lookup.value.length > 0)) {
    return "deliverable";
  }

  const lookups = [mxLookup, ipv4Lookup, ipv6Lookup];
  const rejectedLookups = lookups.filter((lookup) => lookup.status === "rejected");
  if (rejectedLookups.length === lookups.length
    && rejectedLookups.every((lookup) => DEFINITIVE_DNS_ERRORS.has(errorCode(lookup.reason) ?? ""))) {
    return "invalid";
  }

  return "unknown";
}

async function lookupWithTimeout(domain: string): Promise<DomainValidationResult> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      lookupDomain(domain),
      new Promise<DomainValidationResult>((resolve) => {
        timeout = setTimeout(() => resolve("unknown"), LOOKUP_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

export async function canEmailDomainReceiveMail(email: string) {
  const domain = email.slice(email.lastIndexOf("@") + 1).toLowerCase();
  const cached = DOMAIN_CACHE.get(domain);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result !== "invalid";
  }

  const result = await lookupWithTimeout(domain);

  if (result !== "unknown") {
    if (DOMAIN_CACHE.size >= 500) {
      DOMAIN_CACHE.clear();
    }

    DOMAIN_CACHE.set(domain, {
      expiresAt: Date.now() + (result === "deliverable" ? 6 * 60 * 60_000 : 30 * 60_000),
      result,
    });
  }

  // A temporary DNS failure must not block a legitimate appointment.
  return result !== "invalid";
}
