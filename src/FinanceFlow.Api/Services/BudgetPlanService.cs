using FinanceFlow.Api.Data;
using FinanceFlow.Api.Models.Domain;
using FinanceFlow.Api.Models.DTOs;
using Microsoft.EntityFrameworkCore;

namespace FinanceFlow.Api.Services;

public class BudgetPlanService : IBudgetPlanService
{
    private readonly FinanceDbContext _db;

    public BudgetPlanService(FinanceDbContext db)
    {
        _db = db;
    }

    public async Task<List<BudgetPlanDto>> GetByYearAsync(int year, string? categoryId = null)
    {
        var query = _db.BudgetPlans.Where(bp => bp.Year == year);

        if (!string.IsNullOrEmpty(categoryId))
        {
            query = query.Where(bp => bp.CategoryId == categoryId);
        }

        var rows = await query.ToListAsync();

        // Group normalized rows back into the frontend shape: { categoryId, year, months: { 1: 500, 2: 600, ... } }
        var grouped = rows
            .GroupBy(r => r.CategoryId)
            .Select(g => new BudgetPlanDto(
                g.Key,
                year,
                g.ToDictionary(r => r.Month, r => r.Amount)
            ))
            .ToList();

        return grouped;
    }

    public async Task<BudgetPlanDto> SetAmountAsync(SetBudgetAmountRequest request)
    {
        // Upsert: find existing row or create new one
        var existing = await _db.BudgetPlans
            .FirstOrDefaultAsync(bp =>
                bp.CategoryId == request.CategoryId &&
                bp.Year == request.Year &&
                bp.Month == request.Month);

        if (existing is not null)
        {
            existing.Amount = request.Amount;
        }
        else
        {
            _db.BudgetPlans.Add(new BudgetPlan
            {
                CategoryId = request.CategoryId,
                Year = request.Year,
                Month = request.Month,
                Amount = request.Amount
            });
        }

        await _db.SaveChangesAsync();

        // Return the full plan for this category+year
        var plans = await GetByYearAsync(request.Year, request.CategoryId);
        return plans.FirstOrDefault() ?? new BudgetPlanDto(request.CategoryId, request.Year, new Dictionary<int, decimal> { { request.Month, request.Amount } });
    }
}
