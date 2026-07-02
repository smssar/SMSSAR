import { getWhatsappUser } from "./whatsapp-utils";

export type PurchaseType =
  | "VERIFIED_SELLER"
  | "ADSNUMBERS"
  | "EXTRA_IMAGES"
  | "ADS_DURATION_PER_DAY"
  | "EXTRA_VIDEOS"
  | "EXTRA_LISTINGS"
  | "EXTRA_FEATURED_LISTINGS";

export type WhatsappUserWithTokenLock = Awaited<
  ReturnType<typeof getWhatsappUser>
> & {
  tokenLimitReached?: boolean | null;
  tokenUsage?: number | null;
  tokensLimit?: number | null;
  audioLimitReached?: boolean | null;
  audioUsage?: number | null;
  audioLimit?: number | null;
  language?: string | null;
  id?: string;
  name?: string | null;
};
