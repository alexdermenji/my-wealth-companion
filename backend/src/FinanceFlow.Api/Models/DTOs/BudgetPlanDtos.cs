namespace FinanceFlow.Api.Models.DTOs;

public record BudgetPlanDto(
    string CategoryId,
    int Year,
    Dictionary<int, decimal> Months
);

public record SetBudgetAmountRequest(
    string CategoryId,
    int Year,
    int Month,
    decimal Amount
);
