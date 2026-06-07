import nodemailer from "nodemailer";

type MailMessage = {
  subject: string;
  text: string;
  to: string;
};

function smtpPort() {
  const parsed = Number(process.env.SMTP_PORT ?? "587");
  return Number.isInteger(parsed) ? parsed : 587;
}

export function isMailConfigured() {
  return Boolean(
    (process.env.RESEND_API_KEY && process.env.MAIL_FROM) ||
    (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD && process.env.SMTP_FROM)
  );
}

async function sendWithResend(message: MailMessage) {
  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from: process.env.MAIL_FROM,
      subject: message.subject,
      text: message.text,
      to: [message.to],
    }),
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend email failed: ${response.status} ${body}`);
  }
}

async function sendWithSmtp(message: MailMessage) {
  const transporter = nodemailer.createTransport({
    auth: {
      pass: process.env.SMTP_PASSWORD,
      user: process.env.SMTP_USER,
    },
    host: process.env.SMTP_HOST,
    port: smtpPort(),
    secure: process.env.SMTP_SECURE === "true",
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    subject: message.subject,
    text: message.text,
    to: message.to,
  });
}

export async function sendMail(message: MailMessage) {
  if (process.env.RESEND_API_KEY && process.env.MAIL_FROM) {
    await sendWithResend(message);
    return;
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD && process.env.SMTP_FROM) {
    await sendWithSmtp(message);
    return;
  }

  throw new Error("Email provider is not configured.");
}
