import { transporter } from ".";

export async function sendInviteEmail({
  to,
  name,
  inviteUrl,
  organizationName,
}: {
  to: string;
  name: string;
  inviteUrl: string;
  organizationName: string;
}) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `You're invited to join ${organizationName}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6">
        <p>Hi ${name},</p>
        <p>
          You’ve been invited to join
          <strong>${organizationName}</strong>.
        </p>
        <p>
          Click the button below to set your password:
        </p>
        <p>
          <a
            href="${inviteUrl}"
            style="
              display: inline-block;
              padding: 10px 16px;
              background-color: #2563eb;
              color: #ffffff;
              text-decoration: none;
              border-radius: 6px;
            "
          >
            Set your password
          </a>
        </p>
        <p>This link will expire in 7 days.</p>
        <p>If you didn’t expect this invitation, you can ignore this email.</p>
      </div>
    `,
  });
}
