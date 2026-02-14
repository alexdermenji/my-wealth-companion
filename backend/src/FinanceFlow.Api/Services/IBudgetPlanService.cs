using FinanceFlow.Api.Models.DTOs;

namespace FinanceFlow.Api.Services;

public interface IBudgetPlanService
{
    Task<List<BudgetPlanDto>> GetByYearAsync(int year, string? categoryId = null);
    Task<BudgetPlanDto> SetAmountAsync(SetBudgetAmountRequest request);
}
