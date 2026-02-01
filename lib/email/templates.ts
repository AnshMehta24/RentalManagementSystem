/**
 * Professional email templates with consistent branding and layout.
 * Uses responsive HTML compatible with major email clients.
 */

const APP_NAME = process.env.APP_NAME || "Rental Management";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || process.env.SMTP_FROM || "";

function emailWrapper(innerContent: string, preheader?: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${APP_NAME}</title>
  ${preheader ? `<meta name="description" content="${preheader}">` : ""}
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; }
    .email-wrapper { width: 100%; background-color: #f4f4f5; padding: 40px 20px; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden; }
    .email-header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 32px 40px; text-align: center; }
    .email-header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .email-body { padding: 40px; line-height: 1.7; color: #374151; font-size: 16px; }
    .email-body p { margin: 0 0 16px; }
    .email-body p:last-of-type { margin-bottom: 0; }
    .btn { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 8px 0 24px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3); }
    .btn:hover { opacity: 0.95; }
    .btn-success { background: linear-gradient(135deg, #059669 0%, #047857 100%) !important; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.3); }
    .divider { height: 1px; background-color: #e5e7eb; margin: 24px 0; }
    .muted { color: #6b7280; font-size: 14px; }
    .footer { padding: 24px 40px; background-color: #f9fafb; text-align: center; }
    .footer p { margin: 0; font-size: 12px; color: #9ca3af; }
    .footer a { color: #6b7280; text-decoration: none; }
    .link-fallback { word-break: break-all; font-size: 13px; color: #6b7280; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <h1>${APP_NAME}</h1>
      </div>
      <div class="email-body">
        ${innerContent}
      </div>
      <div class="footer">
        <p>This email was sent by ${APP_NAME}.</p>
        ${SUPPORT_EMAIL ? `<p><a href="mailto:${SUPPORT_EMAIL}">Contact support</a></p>` : ""}
      </div>
    </div>
  </div>
</body>
</html>
`;
}

export function getPaymentLinkTemplate(params: {
  customerName: string;
  vendorName: string;
  quotationRef: string;
  paymentUrl: string;
}) {
  const { customerName, vendorName, quotationRef, paymentUrl } = params;
  const innerContent = `
    <p>Hi ${customerName},</p>
    <p>
      <strong>${vendorName}</strong> has sent you a secure payment link for Quotation ${quotationRef}.
    </p>
    <p>
      Click the button below to complete your payment safely through our payment partner:
    </p>
    <p style="text-align: center;">
      <a href="${paymentUrl}" class="btn btn-success">Pay Now</a>
    </p>
    <div class="divider"></div>
    <p class="muted">
      Or copy and paste this link into your browser:<br>
      <a href="${paymentUrl}" class="link-fallback">${paymentUrl}</a>
    </p>
    <p class="muted" style="margin-top: 24px;">
      If you did not request this payment link or have any questions, please contact the vendor directly. Do not share this link with anyone.
    </p>
  `;
  return emailWrapper(innerContent, `Complete your payment for Quotation ${quotationRef}`);
}

export function getPasswordResetTemplate(params: {
  name: string | null;
  resetUrl: string;
  expiryMinutes?: number;
}) {
  const { name, resetUrl, expiryMinutes = 60 } = params;
  const greeting = name ? `Hi ${name},` : "Hi,";
  const innerContent = `
    <p>${greeting}</p>
    <p>
      We received a request to reset the password for your account. Click the button below to choose a new password:
    </p>
    <p style="text-align: center;">
      <a href="${resetUrl}" class="btn">Reset Password</a>
    </p>
    <div class="divider"></div>
    <p class="muted">
      Or copy and paste this link into your browser:<br>
      <a href="${resetUrl}" class="link-fallback">${resetUrl}</a>
    </p>
    <p class="muted" style="margin-top: 24px;">
      This link will expire in <strong>${expiryMinutes} minutes</strong>. If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
    </p>
    <p class="muted">
      For security, never share this link with anyone. We will never ask for your password by email.
    </p>
  `;
  return emailWrapper(innerContent, "Reset your password");
}
