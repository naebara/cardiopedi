const LOCAL_PART_PATTERN = /^[A-Z0-9!#$%&'*+/=?^_`{|}~.-]+$/i;
const DOMAIN_LABEL_PATTERN = /^[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?$/i;
const ASCII_TLD_PATTERN = /^[A-Z]{2,63}$/i;
const PUNYCODE_TLD_PATTERN = /^xn--[A-Z0-9-]{2,59}$/i;

const PROVIDER_TYPOS: Record<string, string> = {
  gamil: "gmail",
  gmai: "gmail",
  gmial: "gmail",
  gmal: "gmail",
  hotmai: "hotmail",
  hotmal: "hotmail",
  hotnail: "hotmail",
  iahoo: "yahoo",
  outlok: "outlook",
  outloo: "outlook",
  yahho: "yahoo",
  yaho: "yahoo",
  yaoo: "yahoo",
};

const TLD_TYPOS: Record<string, string> = {
  cim: "com",
  cmo: "com",
  con: "com",
  or: "ro",
  rpo: "ro",
  vom: "com",
};

export type OptionalEmailValidation =
  | { isValid: true; normalizedEmail: string }
  | { isValid: false; message: string; normalizedEmail: string };

export function getEmailTypoSuggestion(value: string) {
  const separator = value.lastIndexOf("@");
  if (separator <= 0) {
    return null;
  }

  const localPart = value.slice(0, separator);
  const labels = value.slice(separator + 1).toLowerCase().split(".");
  if (labels.length < 2) {
    return null;
  }

  const provider = labels[0];
  const tldIndex = labels.length - 1;
  const correctedProvider = PROVIDER_TYPOS[provider] ?? provider;
  const correctedTld = TLD_TYPOS[labels[tldIndex]] ?? labels[tldIndex];

  if (provider === correctedProvider && labels[tldIndex] === correctedTld) {
    return null;
  }

  labels[0] = correctedProvider;
  labels[tldIndex] = correctedTld;
  return `${localPart}@${labels.join(".")}`;
}

export function validateOptionalEmail(value: string): OptionalEmailValidation {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return { isValid: true, normalizedEmail: "" };
  }

  const separator = trimmedValue.lastIndexOf("@");
  const hasOneSeparator = separator > 0 && separator === trimmedValue.indexOf("@");
  if (!hasOneSeparator || trimmedValue.length > 254) {
    return invalidEmail(trimmedValue);
  }

  const localPart = trimmedValue.slice(0, separator);
  const domain = trimmedValue.slice(separator + 1).toLowerCase();
  const normalizedEmail = `${localPart}@${domain}`;
  const domainLabels = domain.split(".");
  const tld = domainLabels.at(-1) ?? "";

  const hasValidLocalPart = localPart.length <= 64
    && LOCAL_PART_PATTERN.test(localPart)
    && !localPart.startsWith(".")
    && !localPart.endsWith(".")
    && !localPart.includes("..");
  const hasValidDomain = domain.length <= 253
    && domainLabels.length >= 2
    && domainLabels.every((label) => DOMAIN_LABEL_PATTERN.test(label))
    && (ASCII_TLD_PATTERN.test(tld) || PUNYCODE_TLD_PATTERN.test(tld));

  if (!hasValidLocalPart || !hasValidDomain) {
    return invalidEmail(normalizedEmail);
  }

  const suggestion = getEmailTypoSuggestion(normalizedEmail);
  if (suggestion) {
    return {
      isValid: false,
      message: `Adresa de email pare scrisa gresit. Ai vrut sa scrii ${suggestion}?`,
      normalizedEmail,
    };
  }

  return { isValid: true, normalizedEmail };
}

function invalidEmail(normalizedEmail: string): OptionalEmailValidation {
  return {
    isValid: false,
    message: "Introdu o adresa de email valida, de exemplu nume@gmail.com.",
    normalizedEmail,
  };
}
