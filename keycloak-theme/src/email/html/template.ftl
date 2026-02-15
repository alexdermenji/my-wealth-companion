<#macro emailLayout>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FinanceFlow</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 40px 20px;">
        <tr>
            <td align="center">
                <!-- Logo -->
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                    <tr>
                        <td align="center" style="font-family: 'DM Sans', 'Inter', sans-serif; font-size: 22px; font-weight: 700; color: #192035;">
                            <span style="display: inline-block; width: 32px; height: 32px; background-color: rgba(63, 126, 219, 0.1); border-radius: 8px; text-align: center; line-height: 32px; font-size: 16px; margin-right: 8px; vertical-align: middle;">&#128176;</span>
                            <span style="vertical-align: middle;">FinanceFlow</span>
                        </td>
                    </tr>
                </table>

                <!-- Card -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
                    <tr>
                        <td style="padding: 32px;">
                            <#nested>
                        </td>
                    </tr>
                </table>

                <!-- Footer -->
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin-top: 24px;">
                    <tr>
                        <td align="center" style="font-size: 12px; color: #6B7280; line-height: 1.5;">
                            <p style="margin: 0;">This is an automated message from FinanceFlow.</p>
                            <p style="margin: 4px 0 0;">Please do not reply to this email.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
</#macro>
