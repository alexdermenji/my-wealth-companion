namespace FinanceFlow.Api.Models.DTOs;

public record DashboardSummaryDto(
    int Year,
    int Month,
    List<BudgetTypeBreakdownDto> Breakdown
);

public record BudgetTypeBreakdownDto(
    string Type,
    decimal TotalTracked,
    decimal TotalBudget,
    List<CategoryBreakdownItemDto> Items
);

public record CategoryBreakdownItemDto(
    string CategoryId,
    string CategoryName,
    string Group,
    decimal Tracked,
    decimal Budget,
    int Percentage
);

public record MonthlyComparisonDto(
    int Year,
    List<MonthDataDto> Months
);

public record MonthDataDto(
    int Month,
    string MonthName,
    decimal Income,
    decimal Expenses
);
