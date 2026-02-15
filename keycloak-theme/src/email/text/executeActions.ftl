Action required

Your FinanceFlow account requires the following actions:

<#if requiredActions??>
<#list requiredActions as reqActionItem>- ${msg("requiredAction.${reqActionItem}")}
</#list>
</#if>

Click the link below to complete these actions (expires in ${linkExpiration} minutes):

${link}

If you didn't request this, you can safely ignore this email.

- FinanceFlow
