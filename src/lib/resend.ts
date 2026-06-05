import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

export const resend = apiKey ? new Resend(apiKey) : null;

export const verificationFrom =
  process.env.RESEND_FROM ?? process.env.EMAIL_FROM ?? "no-reply@rorado.me";

export const billingFrom =
  process.env.BILLING_FROM ?? "Smssar <billing@rorado.me>";
