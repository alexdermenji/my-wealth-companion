namespace FinanceFlow.Api.Models.DTOs;

public record CategoryDto(string Id, string Name, string Type, string Group);
public record CreateCategoryRequest(string Name, string Type, string Group);
public record UpdateCategoryRequest(string Name, string Type, string Group);
public record CategoryUsageDto(int TransactionCount, int BudgetPlanCount);
