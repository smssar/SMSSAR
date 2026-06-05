import { NextResponse } from "next/server";
import { resend, billingFrom } from "@/lib/resend";
import { getMessages } from "@/lib/messages";
import type { Locale } from "@/lib/locales";

type ContactRequest = {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  locale?: string;
};

const supportEmail = process.env.SUPPORT_EMAIL || "Smssar support@smssar.ma";

type ContactMessages = ReturnType<typeof getMessages>["contact"];

function buildAdminEmail(data: ContactRequest, contact: ContactMessages) {
  const backend = contact.backend;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #a855f7 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 20px; border: 1px solid #e5e7eb; }
        .field { margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e5e7eb; }
        .field:last-child { border-bottom: none; }
        .label { font-weight: bold; color: #1f2937; margin-bottom: 5px; }
        .value { color: #4b5563; }
        .footer { background: #111827; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>${backend.adminGreeting}</h2>
        </div>
        <div class="content">
          <div class="field">
            <div class="label">${backend.labels.name}:</div>
            <div class="value">${escapeHtml(data.name)}</div>
          </div>
          <div class="field">
            <div class="label">${backend.labels.email}:</div>
            <div class="value"><a href="mailto:${data.email}">${escapeHtml(data.email)}</a></div>
          </div>
          ${
            data.phone
              ? `<div class="field">
            <div class="label">${backend.labels.phone}:</div>
            <div class="value">${escapeHtml(data.phone)}</div>
          </div>`
              : ""
          }
          <div class="field">
            <div class="label">${backend.labels.subject}:</div>
            <div class="value">${escapeHtml(data.subject)}</div>
          </div>
          <div class="field">
            <div class="label">${backend.labels.message}:</div>
            <div class="value" style="white-space: pre-wrap;">${escapeHtml(data.message)}</div>
          </div>
        </div>
        <div class="footer">
          <p>Smssar Contact Form | ${backend.labels.receivedAt} ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
${backend.adminGreeting}

${backend.labels.name}: ${data.name}
${backend.labels.email}: ${data.email}
${data.phone ? `${backend.labels.phone}: ${data.phone}\n` : ""}${backend.labels.subject}: ${data.subject}

${backend.labels.message}:
${data.message}
  `;

  return {
    subject: `${backend.adminSubjectPrefix} ${data.subject}`,
    htmlContent,
    textContent,
  };
}

function buildUserEmail(data: ContactRequest, contact: ContactMessages) {
  const backend = contact.backend;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; }
        .card { background: white; padding: 30px; border-radius: 8px; border: 1px solid #e5e7eb; }
        .greeting { font-size: 18px; margin-bottom: 15px; }
        .message { color: #4b5563; margin-bottom: 20px; line-height: 1.8; }
        .signature { color: #6b7280; margin-top: 30px; font-size: 14px; white-space: pre-wrap; }
        .badge { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #a855f7 100%); color: white; padding: 10px 15px; border-radius: 6px; font-weight: bold; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="badge">${backend.thankYou}</div>
          <div class="greeting">${backend.userGreeting} ${escapeHtml(data.name)},</div>
          <div class="message">${backend.userMessage}</div>
          <div class="signature">${backend.userSignoff}</div>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
${backend.userGreeting} ${data.name},

${backend.userMessage}

${backend.userSignoff}
  `;

  return {
    subject: backend.userSubject,
    htmlContent,
    textContent,
  };
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

export async function POST(request: Request) {
  let contact = getMessages("en").contact;
  try {
    const body: ContactRequest = await request.json();
    const locale = (body.locale as Locale) || "en";
    contact = getMessages(locale).contact;

    // Validate input
    if (
      !body.name ||
      !body.subject ||
      !body.message ||
      (!body.email && !body.phone)
    ) {
      return NextResponse.json(
        { error: contact.backend.validationMissingFields },
        { status: 400 },
      );
    }

    // Validate email format if provided
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (body.email && !emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: contact.backend.validationInvalidEmail },
        { status: 400 },
      );
    }

    if (!resend) {
      throw new Error(contact.backend.resendMissing);
    }

    // Build emails
    const adminEmail = buildAdminEmail(body, contact);
    const userEmail = buildUserEmail(body, contact);

    // Send email
    try {
      if (!resend) {
        console.error("Resend client not configured (RESEND_API_KEY missing)");
        throw new Error(contact.backend.resendMissing);
      }

      await resend.emails.send({
        from: billingFrom ?? "Contact <contact@rorado.ma>",
        to: supportEmail,
        replyTo: body.email || undefined,
        subject: adminEmail.subject,
        html: adminEmail.htmlContent,
        text: adminEmail.textContent,
      });

      if (body.email) {
        await resend.emails.send({
          from: billingFrom ?? "Contact <contact@rorado.ma>",
          to: body.email,
          subject: userEmail.subject,
          html: userEmail.htmlContent,
          text: userEmail.textContent,
        });
      }
    } catch (sendError) {
      console.error("Failed to send contact emails:", sendError);
      throw sendError;
    }

    return NextResponse.json(
      { success: true, message: contact.backend.responseSuccess },
      { status: 200 },
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      {
        error: contact.backend.responseFailure,
        detail:
          error instanceof Error
            ? error.message
            : contact.backend.responseFailure,
      },
      { status: 500 },
    );
  }
}
