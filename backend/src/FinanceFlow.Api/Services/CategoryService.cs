using FinanceFlow.Api.Data;
using FinanceFlow.Api.Models.Domain;
using FinanceFlow.Api.Models.DTOs;
using Microsoft.EntityFrameworkCore;

namespace FinanceFlow.Api.Services;

public class CategoryService : ICategoryService
{
    private readonly FinanceDbContext _db;

    public CategoryService(FinanceDbContext db)
    {
        _db = db;
    }

    public async Task<List<CategoryDto>> GetAllAsync(string? type = null)
    {
        var query = _db.Categories.AsQueryable();
        if (!string.IsNullOrEmpty(type))
        {
            query = query.Where(c => c.Type == type);
        }
        return await query
            .OrderBy(c => c.Order)
            .Select(c => new CategoryDto(c.Id, c.Name, c.Type, c.Group, c.Order))
            .ToListAsync();
    }

    public async Task<CategoryDto?> GetByIdAsync(string id)
    {
        var category = await _db.Categories.FindAsync(id);
        if (category is null) return null;
        return new CategoryDto(category.Id, category.Name, category.Type, category.Group, category.Order);
    }

    public async Task<CategoryDto> CreateAsync(CreateCategoryRequest request)
    {
        var maxOrder = await _db.Categories
            .Where(c => c.Type == request.Type)
            .Select(c => (int?)c.Order)
            .MaxAsync() ?? -1;

        var category = new BudgetCategory
        {
            Name = request.Name,
            Type = request.Type,
            Group = request.Group,
            Order = maxOrder + 1,
        };
        _db.Categories.Add(category);
        await _db.SaveChangesAsync();
        return new CategoryDto(category.Id, category.Name, category.Type, category.Group, category.Order);
    }

    public async Task<CategoryDto?> UpdateAsync(string id, UpdateCategoryRequest request)
    {
        var category = await _db.Categories.FindAsync(id);
        if (category is null) return null;

        category.Name = request.Name;
        category.Type = request.Type;
        category.Group = request.Group;

        await _db.SaveChangesAsync();
        return new CategoryDto(category.Id, category.Name, category.Type, category.Group, category.Order);
    }

    public async Task<bool> ReorderAsync(string id, int newOrder)
    {
        var category = await _db.Categories.FindAsync(id);
        if (category is null) return false;

        var siblings = await _db.Categories
            .Where(c => c.Type == category.Type && c.Id != id)
            .OrderBy(c => c.Order)
            .ToListAsync();

        // Clamp newOrder to valid range
        newOrder = Math.Clamp(newOrder, 0, siblings.Count);

        // Insert category at newOrder position among siblings
        siblings.Insert(newOrder, category);

        for (var i = 0; i < siblings.Count; i++)
            siblings[i].Order = i;

        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<CategoryUsageDto?> GetUsageAsync(string id)
    {
        var exists = await _db.Categories.AnyAsync(c => c.Id == id);
        if (!exists) return null;

        var transactionCount = await _db.Transactions.CountAsync(t => t.BudgetPositionId == id);
        var budgetPlanCount = await _db.BudgetPlans.CountAsync(bp => bp.CategoryId == id);
        return new CategoryUsageDto(transactionCount, budgetPlanCount);
    }

    public async Task<bool> DeleteAsync(string id, bool force = false)
    {
        var category = await _db.Categories.FindAsync(id);
        if (category is null) return false;

        if (!force)
        {
            var hasUsage = await _db.Transactions.AnyAsync(t => t.BudgetPositionId == id)
                        || await _db.BudgetPlans.AnyAsync(bp => bp.CategoryId == id);
            if (hasUsage) return false;
        }

        _db.Categories.Remove(category);
        await _db.SaveChangesAsync();
        return true;
    }
}
