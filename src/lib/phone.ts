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

export function getPhoneCountryByDialCode(dialCode: string) {
  const normalizedDialCode = dialCode.startsWith("+")
    ? dialCode
    : `+${dialCode}`;

  return (
    phoneCountries.find((country) => country.dialCode === normalizedDialCode) ??
    defaultPhoneCountry
  );
}

export function formatPhonePreview(value: string, countryCode: string) {
  const asYouType = new AsYouType(countryCode as never);
  return asYouType.input(value);
}

// Group digits for display: "690201401" -> "690 20 14 01"
export function groupDigitsPairs(value: string) {
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return "";

  if (digits.length <= 2) {
    return digits;
  }

  const firstGroupLength = digits.length % 2 === 1 ? 3 : 2;
  const groups: string[] = [digits.slice(0, firstGroupLength)];

  for (let index = firstGroupLength; index < digits.length; index += 2) {
    groups.push(digits.slice(index, index + 2));
  }

  return groups.join(" ");
}

export function formatPhoneDisplay(value: string) {
  const raw = value.trim();
  if (!raw) return "";

  try {
    const parsed = parsePhoneNumberFromString(raw as string);
    const national = parsed ? parsed.formatNational() : raw.replace(/^\+/, "");
    return groupDigitsPairs(String(national).replace(/^0+/, ""));
  } catch {
    return groupDigitsPairs(raw.replace(/^\+/, "").replace(/^0+/, ""));
  }
}

export function detectPhoneCountry(value: string): string | null {
  const phone = parsePhoneNumberFromString(value);
  const country = phone?.country ?? null;
  return country;
}

const INVALID_PHONE_MESSAGE = "Please enter a valid phone number.";

export function normalizePhoneNumber(
  phone: string,
  defaultCountry = defaultPhoneCountry.code,
) {
  const trimmed = phone.trim();
  if (!trimmed) {
    throw new Error(INVALID_PHONE_MESSAGE);
  }

  const parsed =
    parsePhoneNumberFromString(trimmed) ??
    parsePhoneNumberFromString(trimmed, defaultCountry as never);

  if (!parsed || !parsed.isValid()) {
    throw new Error(INVALID_PHONE_MESSAGE);
  }

  return parsed.number;
}

export function validateAndNormalizePhone(
  value: string,
  defaultCountry = defaultPhoneCountry.code,
) {
  try {
    const e164 = normalizePhoneNumber(value, defaultCountry);
    const parsed = parsePhoneNumberFromString(e164);

    if (!parsed) {
      throw new Error(INVALID_PHONE_MESSAGE);
    }

    return {
      valid: true as const,
      e164,
      country: parsed.country ?? defaultCountry,
    };
  } catch {
    return {
      valid: false as const,
      message: INVALID_PHONE_MESSAGE,
    };
  }
}
