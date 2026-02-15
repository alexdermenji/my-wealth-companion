<#import "template.ftl" as layout>
<@layout.emailLayout>
    <h1 style="margin: 0 0 8px; font-family: 'DM Sans', 'Inter', sans-serif; font-size: 20px; font-weight: 600; color: #192035;">
        Action required
    </h1>
    <p style="margin: 0 0 24px; font-size: 14px; color: #6B7280;">
        Your account requires the following actions to be completed.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 16px;">
        <#if requiredActions??>
            <#list requiredActions as reqActionItem>
                <tr>
                    <td style="padding: 8px 12px; font-size: 14px; color: #192035; background-color: #F8FAFC; border-radius: 6px; margin-bottom: 4px;">
                        &bull; ${msg("requiredAction.${reqActionItem}")}
                    </td>
                </tr>
                <#if reqActionItem_has_next>
                    <tr><td style="height: 4px;"></td></tr>
                </#if>
            </#list>
        </#if>
    </table>

    <p style="margin: 0 0 16px; font-size: 14px; color: #192035; line-height: 1.6;">
        Click the button below to complete these actions. This link will expire in ${linkExpiration} minutes.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
        <tr>
            <td align="center">
                <a href="${link}" target="_blank" style="display: inline-block; background-color: #3F7EDB; color: #FFFFFF; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500; text-decoration: none; padding: 10px 24px; border-radius: 6px;">
                    Complete actions
                </a>
            </td>
        </tr>
    </table>

    <p style="margin: 0 0 8px; font-size: 12px; color: #6B7280; line-height: 1.5;">
        If you didn't request this, you can safely ignore this email.
    </p>

    <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0 16px;" />

    <p style="margin: 0; font-size: 11px; color: #9CA3AF; line-height: 1.5; word-break: break-all;">
        If the button doesn't work, copy and paste this link into your browser:<br/>
        <a href="${link}" style="color: #3F7EDB; text-decoration: underline;">${link}</a>
    </p>
</@layout.emailLayout>
