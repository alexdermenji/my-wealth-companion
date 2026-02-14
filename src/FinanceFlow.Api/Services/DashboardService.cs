using FinanceFlow.Api.Data;
using FinanceFlow.Api.Models.DTOs;
using Microsoft.EntityFrameworkCore;

namespace FinanceFlow.Api.Services;

public class DashboardService : IDashboardService
{
    private static readonly string[] MonthNames = { "", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" };
    private static readonly string[] BudgetTypes = { "Income", "Expenses", "Savings", "Debt" };

    private readonly FinanceDbContext _db;

    public DashboardService(FinanceDbContext db)
    {
        _db = db;
    }

    public async Task<DashboardSummaryDto> GetSummaryAsync(int year, int month)
    {
        // Get all categories
        var categories = await _db.Categories.ToListAsync();

        // Get transactions for this month
        var transactions = await _db.Transactions
            .Where(t => t.Date.Year == year && t.Date.Month == month)
            .ToListAsync();

        // Get budget plan amounts for this month
        var budgetAmounts = await _db.BudgetPlans
            .Where(bp => bp.Year == year && bp.Month == month)
            .ToDictionaryAsync(bp => bp.CategoryId, bp => bp.Amount);

        var breakdown = new List<BudgetTypeBreakdownDto>();

        foreach (var budgetType in BudgetTypes)
        {
            var typeCategories = categories.Where(c => c.Type == budgetType).ToList();
            var items = new List<CategoryBreakdownItemDto>();

            decimal totalTracked = 0;
            decimal totalBudget = 0;

            foreach (var category in typeCategories)
            {
                var tracked = transactions
                    .Where(t => t.BudgetPositionId == category.Id)
                    .Sum(t => Math.Abs(t.Amount));

                budgetAmounts.TryGetValue(category.Id, out var budget);

                var percentage = budget > 0 ? (int)(tracked / budget * 100) : 0;

                items.Add(new CategoryBreakdownItemDto(
                    category.Id, category.Name, category.Group,
                    tracked, budget, percentage
                ));

                totalTracked += tracked;
                totalBudget += budget;
            }

            breakdown.Add(new BudgetTypeBreakdownDto(budgetType, totalTracked, totalBudget, items));
        }

        return new DashboardSummaryDto(year, month, breakdown);
    }

    public async Task<MonthlyComparisonDto> GetMonthlyComparisonAsync(int year)
    {
        var transactions = await _db.Transactions
            .Where(t => t.Date.Year == year)
            .ToListAsync();

        var months = new List<MonthDataDto>();

        for (int m = 1; m <= 12; m++)
        {
            var monthTransactions = transactions.Where(t => t.Date.Month == m).ToList();

            var income = monthTransactions
                .Where(t => t.BudgetType == "Income")
                .Sum(t => Math.Abs(t.Amount));

            var expenses = monthTransactions
                .Where(t => t.BudgetType == "Expenses")
                .Sum(t => Math.Abs(t.Amount));

            months.Add(new MonthDataDto(m, MonthNames[m], income, expenses));
        }

        return new MonthlyComparisonDto(year, months);
    }
}
