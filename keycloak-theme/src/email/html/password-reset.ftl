<#import "template.ftl" as layout>
<@layout.emailLayout>
    <h1 style="margin: 0 0 8px; font-family: 'DM Sans', 'Inter', sans-serif; font-size: 20px; font-weight: 600; color: #192035;">
        Reset your password
    </h1>
    <p style="margin: 0 0 24px; font-size: 14px; color: #6B7280;">
        We received a request to reset the password for your account.
    </p>

    <p style="margin: 0 0 16px; font-size: 14px; color: #192035; line-height: 1.6;">
        Click the button below to set a new password. This link will expire in ${linkExpiration} minutes.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
        <tr>
            <td align="center">
                <a href="${link}" target="_blank" style="display: inline-block; background-color: #3F7EDB; color: #FFFFFF; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500; text-decoration: none; padding: 10px 24px; border-radius: 6px;">
                    Reset password
                </a>
            </td>
        </tr>
    </table>

    <p style="margin: 0 0 8px; font-size: 12px; color: #6B7280; line-height: 1.5;">
        If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
    </p>

    <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0 16px;" />

    <p style="margin: 0; font-size: 11px; color: #9CA3AF; line-height: 1.5; word-break: break-all;">
        If the button doesn't work, copy and paste this link into your browser:<br/>
        <a href="${link}" style="color: #3F7EDB; text-decoration: underline;">${link}</a>
    </p>
</@layout.emailLayout>
