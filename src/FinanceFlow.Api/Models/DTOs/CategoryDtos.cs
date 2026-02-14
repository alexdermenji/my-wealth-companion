namespace FinanceFlow.Api.Models.DTOs;

public record CategoryDto(string Id, string Name, string Type, string Group, string GroupEmoji);
public record CreateCategoryRequest(string Name, string Type, string Group, string GroupEmoji);
public record UpdateCategoryRequest(string Name, string Type, string Group, string GroupEmoji);
public record CategoryUsageDto(int TransactionCount, int BudgetPlanCount);
