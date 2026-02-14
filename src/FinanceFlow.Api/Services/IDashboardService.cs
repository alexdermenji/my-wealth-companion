using FinanceFlow.Api.Models.DTOs;

namespace FinanceFlow.Api.Services;

public interface IDashboardService
{
    Task<DashboardSummaryDto> GetSummaryAsync(int year, int month);
    Task<MonthlyComparisonDto> GetMonthlyComparisonAsync(int year);
}
