import { resend, billingFrom } from "@/lib/resend";
import { isLocale, type Locale } from "@/lib/locales";

export type BillingEmailKind =
  | "payment_succeeded"
  | "subscription_scheduled"
  | "subscription_cancelled"
  | "refund_succeeded";

export type BillingEmailInput = {
  to: string;
  locale?: string | null;
  kind: BillingEmailKind;
  userName?: string | null;
  planTitle?: string | null;
  planPrice?: number | null;
  currency?: string | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  paymentId?: string | null;
  purchaseDate?: string | Date | null;
  createdAt?: string | Date | null;
};

const copy = {
  en: {
    payment_succeeded: {
      subject: "Payment received — your subscription is active",
      title: "Payment confirmed",
      subtitle: "Your subscription has been activated successfully.",
      badge: "Active now",
      intro:
        "Thanks for subscribing. Your account is now covered and you can continue using your plan without interruption.",
      cta: "Go to home page",
      footer:
        "If you did not make this payment, please contact support immediately.",
      payementIdLabel: "Payment ID",
      purchaseDateLabel: "Payment date",
    },
    subscription_scheduled: {
      subject: "Subscription scheduled — your plan will start later",
      title: "Subscription scheduled",
      subtitle: "Your new plan is queued and will start at the right time.",
      badge: "Scheduled",
      intro:
        "We have reserved your next subscription period. Your current plan remains active until the scheduled start date.",
      cta: "Go to home page",
      footer:
        "You do not need to take any action unless you want to change your plan.",
      payementIdLabel: "Payment ID",
      purchaseDateLabel: "Payment date",
    },
    subscription_cancelled: {
      subject: "Subscription cancelled — your plan remains active until expiry",
      title: "Cancellation confirmed",
      subtitle: "Your subscription has been cancelled successfully.",
      badge: "Cancelled",
      intro:
        "Your plan will stay active until the end of the current billing period, then it will stop renewing.",
      cta: "Go to home page",
      footer:
        "If you changed your mind, you can subscribe again from your dashboard.",
      payementIdLabel: "Payment ID",
      purchaseDateLabel: "Cancellation date",
    },
    refund_succeeded: {
      subject: "Refund completed — your subscription has been updated",
      title: "Refund confirmed",
      subtitle: "Your refund has been processed successfully.",
      badge: "Refunded",
      intro:
        "The subscription linked to this payment has been updated in our system. If applicable, access will remain available until the relevant end date.",
      cta: "Go to home page",
      footer:
        "Refund timing can vary slightly depending on your payment method and bank.",
      payementIdLabel: "Payment ID",
      purchaseDateLabel: "Refund date",
    },
  },
  ar: {
    payment_succeeded: {
      subject: "تم استلام الدفع — الاشتراك أصبح مفعلاً",
      title: "تم تأكيد الدفع",
      subtitle: "تم تفعيل اشتراكك بنجاح.",
      badge: "نشط الآن",
      intro:
        "شكراً لاشتراكك. أصبح حسابك مغطى ويمكنك متابعة استخدام الخطة دون انقطاع.",
      cta: "الذهاب إلى الصفحة الرئيسية",
      footer: "إذا لم تقم بهذا الدفع، يرجى التواصل مع الدعم فوراً.",
      payementIdLabel: "معرّف الدفع",
      purchaseDateLabel: "تاريخ الدفع",
    },
    subscription_scheduled: {
      subject: "تمت جدولة الاشتراك — ستبدأ خطتك لاحقاً",
      title: "تمت جدولة الاشتراك",
      subtitle: "تمت إضافة خطتك الجديدة وستبدأ في الوقت المناسب.",
      badge: "مجدول",
      intro:
        "تم حجز فترة الاشتراك القادمة. ستبقى خطتك الحالية نشطة حتى تاريخ البدء المجدول.",
      cta: "الذهاب إلى الصفحة الرئيسية",
      footer: "لا تحتاج إلى القيام بأي إجراء إلا إذا أردت تغيير خطتك.",
      payementIdLabel: "معرّف الدفع",
      purchaseDateLabel: "تاريخ الدفع",
    },
    subscription_cancelled: {
      subject: "تم إلغاء الاشتراك — ستظل الخطة فعالة حتى الانتهاء",
      title: "تم تأكيد الإلغاء",
      subtitle: "تم إلغاء اشتراكك بنجاح.",
      badge: "ملغى",
      intro:
        "ستبقى خطتك فعالة حتى نهاية فترة الفوترة الحالية، ثم سيتوقف التجديد.",
      cta: "الذهاب إلى الصفحة الرئيسية",
      footer: "إذا غيرت رأيك، يمكنك الاشتراك مرة أخرى من لوحة التحكم.",
      payementIdLabel: "معرّف الدفع",
      purchaseDateLabel: "تاريخ الإلغاء",
    },
    refund_succeeded: {
      subject: "تمت إعادة المبلغ — تم تحديث اشتراكك",
      title: "تم تأكيد الاسترجاع",
      subtitle: "تمت معالجة طلب الاسترجاع بنجاح.",
      badge: "مسترد",
      intro:
        "تم تحديث الاشتراك المرتبط بهذا الدفع في نظامنا. وإذا كان ذلك ينطبق، فسيبقى الوصول متاحاً حتى تاريخ الانتهاء المناسب.",
      cta: "الذهاب إلى الصفحة الرئيسية",
      footer: "قد يختلف وقت ظهور الاسترجاع قليلاً حسب طريقة الدفع والبنك.",
      payementIdLabel: "معرّف الدفع",
      purchaseDateLabel: "تاريخ المبلغ المسترد",
    },
  },
  fr: {
    payment_succeeded: {
      subject: "Paiement reçu — votre abonnement est actif",
      title: "Paiement confirmé",
      subtitle: "Votre abonnement a été activé avec succès.",
      badge: "Actif",
      intro:
        "Merci pour votre abonnement. Votre compte est maintenant couvert et vous pouvez continuer à utiliser votre formule sans interruption.",
      cta: "Aller à la page d'accueil",
      footer:
        "Si vous n'êtes pas à l'origine de ce paiement, contactez le support immédiatement.",
      payementIdLabel: "ID de paiement",
      purchaseDateLabel: "Date de paiement",
    },
    subscription_scheduled: {
      subject: "Abonnement planifié — votre formule démarrera plus tard",
      title: "Abonnement planifié",
      subtitle:
        "Votre nouvelle formule est en attente et démarrera au bon moment.",
      badge: "Planifié",
      intro:
        "Nous avons réservé votre prochaine période d'abonnement. Votre formule actuelle reste active jusqu'à la date de début prévue.",
      cta: "Aller à la page d'accueil",
      footer:
        "Aucune action n'est nécessaire sauf si vous souhaitez modifier votre formule.",
      payementIdLabel: "ID de paiement",
      purchaseDateLabel: "Date de paiement",
    },
    subscription_cancelled: {
      subject:
        "Abonnement annulé — votre formule reste active jusqu'à l'échéance",
      title: "Annulation confirmée",
      subtitle: "Votre abonnement a bien été annulé.",
      badge: "Annulé",
      intro:
        "Votre formule restera active jusqu'à la fin de la période de facturation en cours, puis elle ne sera plus renouvelée.",
      cta: "Aller à la page d'accueil",
      footer:
        "Si vous changez d'avis, vous pourrez vous réabonner depuis votre tableau de bord.",
      payementIdLabel: "ID de paiement",
      purchaseDateLabel: "Date d'annulation",
    },
    refund_succeeded: {
      subject: "Remboursement effectué — votre abonnement a été mis à jour",
      title: "Remboursement confirmé",
      subtitle: "Votre remboursement a été traité avec succès.",
      badge: "Remboursé",
      intro:
        "L'abonnement lié à ce paiement a été mis à jour dans notre système. Si applicable, l'accès restera disponible jusqu'à la date de fin concernée.",
      cta: "Aller à la page d'accueil",
      footer:
        "Le délai d'apparition du remboursement peut varier selon votre moyen de paiement et votre banque.",
      payementIdLabel: "ID de paiement",
      purchaseDateLabel: "Date de remboursement",
    },
  },
} as const;

function resolveLocale(locale?: string | null): Locale {
  return locale && isLocale(locale) ? locale : "en";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(date: string | Date | null | undefined, locale: Locale) {
  if (!date) return null;
  try {
    return new Date(date).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

function formatMoney(
  amount?: number | null,
  currency?: string | null,
  locale?: Locale,
) {
  if (typeof amount !== "number" || Number.isNaN(amount)) return null;
  try {
    return new Intl.NumberFormat(locale ?? "en", {
      style: "currency",
      currency: currency ?? "MAD",
      maximumFractionDigits: 0,
    }).format(amount / 100);
  } catch {
    return `${amount / 100} ${currency ?? "MAD"}`;
  }
}

function actionAccent(kind: BillingEmailKind) {
  switch (kind) {
    case "payment_succeeded":
      return { border: "#16a34a", badgeBg: "#dcfce7", badgeText: "#166534" };
    case "subscription_scheduled":
      return { border: "#d97706", badgeBg: "#fef3c7", badgeText: "#92400e" };
    case "subscription_cancelled":
      return { border: "#6b7280", badgeBg: "#e5e7eb", badgeText: "#374151" };
    case "refund_succeeded":
      return { border: "#2563eb", badgeBg: "#dbeafe", badgeText: "#1d4ed8" };
  }
}

// Build a localized landing page link for email CTAs.
function buildActionLink(locale: Locale, _kind: BillingEmailKind) {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? process.env.NEXTAUTH_URL ?? "";
  if (!baseUrl) return null;

  // keep param referenced to satisfy strict linter rules
  void _kind;

  return `${baseUrl}/${locale}`;
}

export function buildBillingEmail(input: BillingEmailInput) {
  const locale = resolveLocale(input.locale);
  const pack = copy[locale][input.kind];
  const dir = locale === "ar" ? "rtl" : "ltr";
  const planTitle =
    input.planTitle?.trim() ||
    (locale === "ar" ? "الخطة" : locale === "fr" ? "Formule" : "Plan");
  const accent = actionAccent(input.kind);
  const link = buildActionLink(locale, input.kind);
  const startDate = formatDate(input.startDate, locale);
  const endDate = formatDate(input.endDate, locale);
  const money = formatMoney(input.planPrice, input.currency, locale);

  const purchaseDate = formatDate(input.purchaseDate, locale);
  const createdAt = formatDate(input.createdAt, locale);
  // Show full payment ID as requested (preserve monospace styling below)
  const paymentIdValue = input.paymentId ? `${input.paymentId}` : null;

  const createdAtLabel =
    locale === "ar"
      ? "تاريخ الإنشاء"
      : locale === "fr"
        ? "Date de création"
        : "Created at";

  const details: Array<{ label: string; value: string | null }> = [
    {
      label: locale === "ar" ? "الخطة" : locale === "fr" ? "Formule" : "Plan",
      value: planTitle,
    },
    {
      label: locale === "ar" ? "الحالة" : locale === "fr" ? "Statut" : "Status",
      value: pack.badge,
    },
    {
      label: createdAtLabel,
      value: createdAt,
    },
    {
      label: pack.payementIdLabel,
      value: paymentIdValue,
    },
    {
      label: pack.purchaseDateLabel,
      value: purchaseDate,
    },
    {
      label:
        locale === "ar"
          ? "تاريخ البدء"
          : locale === "fr"
            ? "Début"
            : "Start date",
      value: startDate,
    },
    {
      label:
        locale === "ar"
          ? "تاريخ الانتهاء"
          : locale === "fr"
            ? "Fin"
            : "End date",
      value: endDate,
    },
    {
      label: locale === "ar" ? "السعر" : locale === "fr" ? "Prix" : "Price",
      value: money,
    },
  ].filter((row) => row.value);

  const detailsHtml = details
    .map((row) => {
      const isPaymentIdRow = row.label === pack.payementIdLabel;
      const isPurchaseDateRow = row.label === pack.purchaseDateLabel;
      const isCreatedAtRow = row.label === createdAtLabel;
      const isHighlighted =
        isPaymentIdRow || isPurchaseDateRow || isCreatedAtRow;

      return `
        <tr>
          <td class="details-row-label" style="padding:${isHighlighted ? "12px 0" : "10px 0"};color:#6b7280;font-size:${isHighlighted ? "12px" : "13px"};font-weight:${isHighlighted ? "600" : "500"};word-break:break-word;">${escapeHtml(row.label)}</td>
          <td class="details-row-value" style="padding:${isHighlighted ? "12px 0 12px 12px" : "10px 0 10px 12px"};color:${isHighlighted ? "#0f172a" : "#111827"};font-size:${isHighlighted ? "13px" : "13px"};font-weight:700;text-align:${locale === "ar" ? "left" : "right"};${isPaymentIdRow ? "font-family:monospace;letter-spacing:0.5px;word-break:break-all" : "word-break:break-word"};max-width:300px;overflow-wrap:break-word;">${escapeHtml(row.value ?? "")}</td>
        </tr>`;
    })
    .join("");

  const greeting = input.userName?.trim()
    ? locale === "ar"
      ? `مرحباً ${input.userName.trim()}`
      : locale === "fr"
        ? `Bonjour ${input.userName.trim()}`
        : `Hello ${input.userName.trim()}`
    : locale === "ar"
      ? "مرحباً"
      : locale === "fr"
        ? "Bonjour"
        : "Hello";

  const subject = pack.subject;
  const text = `${greeting}\n\n${pack.title}\n${pack.subtitle}\n\n${pack.intro}\n\n${details
    .map((row) => `${row.label}: ${row.value}`)
    .join("\n")}${link ? `\n\n${pack.cta}: ${link}` : ""}\n\n${pack.footer}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @media (max-width: 640px) {
          .email-container { padding: 16px 12px !important; }
          .email-card { border-radius: 16px !important; }
          .email-header { padding: 20px 16px 16px !important; }
          .email-title { font-size: 20px !important; margin: 14px 0 6px !important; }
          .email-subtitle { font-size: 14px !important; }
          .email-greeting { font-size: 14px !important; margin: 0 0 12px !important; }
          .email-content { padding: 0 16px 8px !important; }
          .email-details-box { padding: 14px !important; border-radius: 12px !important; }
          .email-details-intro { font-size: 13px !important; margin: 0 0 8px !important; }
          .email-details-table td { padding: 7px 0 !important; font-size: 12px !important; }
          .email-details-table .label { font-size: 11px !important; }
          .email-footer { padding: 6px 16px 16px !important; }
          .email-cta { padding: 12px 16px !important; font-size: 13px !important; }
          .details-row-label { word-break: break-word; }
          .details-row-value { word-break: break-all; }
        }
      </style>
    </head>
    <body style="margin:0;padding:0;">
    <div dir="${dir}" style="margin:0;padding:0;background:#f8fafc;font-family:Inter,Arial,sans-serif;color:#0f172a;">
      <div class="email-container" style="max-width:680px;margin:0 auto;padding:32px 16px;">
        <div class="email-card" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;box-shadow:0 20px 50px rgba(15,23,42,0.08);">
          <div class="email-header" style="padding:28px 28px 20px;border-top:6px solid ${accent.border};background:linear-gradient(180deg,#ffffff 0%,#f8fafc 100%);">
            <div style="display:inline-block;padding:6px 12px;border-radius:999px;background:${accent.badgeBg};color:${accent.badgeText};font-size:12px;font-weight:700;letter-spacing:.02em;text-transform:uppercase;">
              ${escapeHtml(pack.badge)}
            </div>
            <h1 class="email-title" style="margin:18px 0 8px;font-size:28px;line-height:1.2;letter-spacing:-0.03em;">${escapeHtml(pack.title)}</h1>
            <p class="email-greeting" style="margin:0 0 14px;font-size:16px;line-height:1.7;color:#334155;">${escapeHtml(greeting)}${input.userName ? `, ${escapeHtml(input.userName.trim())}` : ""}</p>
            <p class="email-subtitle" style="margin:0;font-size:16px;line-height:1.75;color:#475569;">${escapeHtml(pack.subtitle)}</p>
          </div>

          <div class="email-content" style="padding:0 28px 12px;">
            <div class="email-details-box" style="padding:20px;border:1px solid #e2e8f0;border-radius:18px;background:#f8fafc;">
              <p class="email-details-intro" style="margin:0 0 10px;font-size:15px;line-height:1.7;color:#0f172a;">${escapeHtml(pack.intro)}</p>
              <table role="presentation" class="email-details-table" style="width:100%;border-collapse:collapse;">${detailsHtml}</table>
            </div>
          </div>

          <div class="email-footer" style="padding:8px 28px 28px;">
            ${link ? `<a href="${link}" class="email-cta" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:14px;font-weight:700;font-size:14px;">${escapeHtml(pack.cta)}</a>` : ""}
            <p style="margin:18px 0 0;font-size:13px;line-height:1.7;color:#64748b;">${escapeHtml(pack.footer)}</p>
          </div>
        </div>
      </div>
    </div>
    </body>
    </html>`;

  return { subject, text, html };
}

export async function sendBillingEmail(input: BillingEmailInput) {
  if (!resend) {
    throw new Error("Resend API key is not configured.");
  }

  const { subject, text, html } = buildBillingEmail(input);

  await resend.emails.send({
    from: billingFrom,
    to: input.to,
    subject,
    text,
    html,
  });
}
