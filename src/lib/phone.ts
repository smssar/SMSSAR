import {
  AsYouType,
  getCountryCallingCode,
  parsePhoneNumberFromString,
} from "libphonenumber-js";

export type PhoneCountry = {
  code: string;
  label: string;
  dialCode: string;
  flag: string;
};

const FLAG_MAP: Record<string, string> = {
  AE: "🇦🇪",
  US: "🇺🇸",
  GB: "🇬🇧",
  FR: "🇫🇷",
  SA: "🇸🇦",
  EG: "🇪🇬",
  QA: "🇶🇦",
  KW: "🇰🇼",
  OM: "🇴🇲",
  BH: "🇧🇭",
  JO: "🇯🇴",
  LB: "🇱🇧",
  IQ: "🇮🇶",
  MA: "🇲🇦",
  TN: "🇹🇳",
};

const DEFAULT_COUNTRY_CODES = [
  "AE",
  "SA",
  "EG",
  "QA",
  "KW",
  "OM",
  "BH",
  "JO",
  "LB",
  "IQ",
  "MA",
  "TN",
  "US",
  "GB",
  "FR",
];

export const phoneCountries: PhoneCountry[] = DEFAULT_COUNTRY_CODES.map(
  (code) => ({
    code,
    label: code,
    dialCode: `+${getCountryCallingCode(code as never)}`,
    flag: FLAG_MAP[code] ?? "🌍",
  }),
);

export const defaultPhoneCountry =
  phoneCountries.find((country) => country.code === "MA") ?? phoneCountries[0];

export function getPhoneCountryByCode(code: string) {
  return (
    phoneCountries.find((country) => country.code === code) ??
    defaultPhoneCountry
  );
}

export function formatPhonePreview(value: string, countryCode: string) {
  const asYouType = new AsYouType(countryCode as never);
  return asYouType.input(value);
}

// Group digits in pairs for display: "501234567" -> "50 12 34 56 7"
export function groupDigitsPairs(value: string) {
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/(.{2})/g, "$1 ").trim();
}

export function detectPhoneCountry(value: string): string | null {
  const phone = parsePhoneNumberFromString(value);
  const country = phone?.country ?? null;
  return country;
}

export function validateAndNormalizePhone(
  value: string,
  defaultCountry = defaultPhoneCountry.code,
) {
  const trimmed = value.trim();
  if (!trimmed) {
    return {
      valid: false as const,
      message: "Please enter a valid phone number.",
    };
  }

  // Try parsing without a default country first (auto-detect international numbers)
  let phone = parsePhoneNumberFromString(trimmed as string);

  // If auto-detect failed, try parsing with the provided default country
  if (!phone) {
    phone = parsePhoneNumberFromString(trimmed, defaultCountry as never);
  }

  // If still invalid, attempt to convert common local national formats
  // e.g., numbers that start with a leading 0 like Moroccan `0690201401`
  if ((!phone || !phone.isValid()) && /^0+\d+/.test(trimmed)) {
    try {
      const cc = getCountryCallingCode(defaultCountry as never);
      const withoutLeadingZeros = trimmed.replace(/^0+/, "");
      const dial = `+${cc}${withoutLeadingZeros}`;
      phone = parsePhoneNumberFromString(dial as string);
    } catch {
      // ignore and fall through
    }
  }

  if (!phone || !phone.isValid()) {
    return {
      valid: false as const,
      message: "Please enter a valid phone number.",
    };
  }

  return {
    valid: true as const,
    e164: phone.number,
    country: phone.country ?? defaultCountry,
  };
}

export function removeSpaces(str: string): string {
  return str.replace(/\s+/g, "");
}
