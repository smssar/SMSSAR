import { createHash, randomInt, randomBytes } from "node:crypto";
import { resend, verificationFrom } from "@/lib/resend";

export function generateVerificationCode(): string {
  return String(randomInt(100000, 1000000));
}

export function hashVerificationCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export function buildVerificationEmail(locale: string, code: string) {
  const isAr = locale === "ar";
  const isFr = locale === "fr";

  const subject = isAr
    ? "رمز التحقق من البريد الإلكتروني"
    : isFr
      ? "Vérifiez votre adresse e-mail"
      : "Verify your email address";

  const text = isAr
    ? `رمز التحقق الخاص بك هو: ${code}\n\nإذا لم تطلب هذا الحساب، يمكنك تجاهل هذه الرسالة.`
    : isFr
      ? `Votre code de vérification est : ${code}\n\nSi vous n'avez pas demandé ce compte, vous pouvez ignorer ce message.`
      : `Your verification code is: ${code}\n\nIf you did not request this account, you can ignore this message.`;

  const html = isAr
    ? `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>رمز التحقق</h2><p>رمز التحقق الخاص بك هو:</p><p style="font-size:24px;font-weight:700;letter-spacing:4px">${code}</p><p>إذا لم تطلب هذا الحساب، يمكنك تجاهل هذه الرسالة.</p></div>`
    : isFr
      ? `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>Code de vérification</h2><p>Votre code de vérification est :</p><p style="font-size:24px;font-weight:700;letter-spacing:4px">${code}</p><p>Si vous n'avez pas demandé ce compte, vous pouvez ignorer ce message.</p></div>`
      : `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>Email verification code</h2><p>Your verification code is:</p><p style="font-size:24px;font-weight:700;letter-spacing:4px">${code}</p><p>If you did not request this account, you can ignore this message.</p></div>`;

  return { subject, text, html };
}

export async function sendVerificationCodeEmail(
  locale: string,
  email: string,
  code: string,
) {
  if (!resend) {
    throw new Error("Resend API key is not configured.");
  }

  const { subject, text, html } = buildVerificationEmail(locale, code);

  await resend.emails.send({
    from: verificationFrom,
    to: email,
    subject,
    text,
    html,
  });
}

export function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function buildResetPasswordEmail(
  locale: string,
  token: string,
  baseUrl: string,
  email: string,
) {
  const isAr = locale === "ar";
  const isFr = locale === "fr";

  const subject = isAr
    ? "إعادة تعيين كلمة المرور"
    : isFr
      ? "Réinitialisation du mot de passe"
      : "Reset your password";

  const resetUrl = `${baseUrl}/${locale}/reset-password?email=${encodeURIComponent(
    email,
  )}&token=${encodeURIComponent(token)}`;

  const text = isAr
    ? `اضغط على الرابط التالي لإعادة تعيين كلمة المرور: ${resetUrl}`
    : isFr
      ? `Cliquez sur ce lien pour réinitialiser votre mot de passe : ${resetUrl}`
      : `Click this link to reset your password: ${resetUrl}`;

  const html = isAr
    ? `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>إعادة تعيين كلمة المرور</h2><p>اضغط على الرابط التالي لإعادة تعيين كلمة المرور:</p><p><a href="${resetUrl}">${resetUrl}</a></p></div>`
    : isFr
      ? `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>Réinitialisation du mot de passe</h2><p>Cliquez sur ce lien pour réinitialiser votre mot de passe :</p><p><a href="${resetUrl}">${resetUrl}</a></p></div>`
      : `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>Reset your password</h2><p>Click this link to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p></div>`;

  return { subject, text, html };
}

export async function sendResetPasswordEmail(
  locale: string,
  email: string,
  token: string,
  baseUrl: string,
) {
  if (!resend) {
    throw new Error("Resend API key is not configured.");
  }

  const { subject, text, html } = buildResetPasswordEmail(
    locale,
    token,
    baseUrl,
    email,
  );

  await resend.emails.send({
    from: verificationFrom,
    to: email,
    subject,
    text,
    html,
  });
}
