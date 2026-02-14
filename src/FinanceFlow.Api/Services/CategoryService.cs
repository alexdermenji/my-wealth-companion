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
            .Select(c => new CategoryDto(c.Id, c.Name, c.Type, c.Group, c.GroupEmoji))
            .ToListAsync();
    }

    public async Task<CategoryDto?> GetByIdAsync(string id)
    {
        var category = await _db.Categories.FindAsync(id);
        if (category is null) return null;
        return new CategoryDto(category.Id, category.Name, category.Type, category.Group, category.GroupEmoji);
    }

    public async Task<CategoryDto> CreateAsync(CreateCategoryRequest request)
    {
        // Inherit emoji from existing group, or propagate if provided
        var emoji = request.GroupEmoji;
        if (!string.IsNullOrEmpty(request.Group))
        {
            var existing = await _db.Categories
                .FirstOrDefaultAsync(c => c.Group == request.Group && c.GroupEmoji != "");
            if (string.IsNullOrEmpty(emoji) && existing is not null)
                emoji = existing.GroupEmoji;
            else if (!string.IsNullOrEmpty(emoji))
            {
                var siblings = await _db.Categories
                    .Where(c => c.Group == request.Group)
                    .ToListAsync();
                foreach (var s in siblings)
                    s.GroupEmoji = emoji;
            }
        }

        var category = new BudgetCategory
        {
            Name = request.Name,
            Type = request.Type,
            Group = request.Group,
            GroupEmoji = emoji ?? ""
        };
        _db.Categories.Add(category);
        await _db.SaveChangesAsync();
        return new CategoryDto(category.Id, category.Name, category.Type, category.Group, category.GroupEmoji);
    }

    public async Task<CategoryDto?> UpdateAsync(string id, UpdateCategoryRequest request)
    {
        var category = await _db.Categories.FindAsync(id);
        if (category is null) return null;

        category.Name = request.Name;
        category.Type = request.Type;
        category.Group = request.Group;
        category.GroupEmoji = request.GroupEmoji;

        // Propagate emoji to all categories sharing the same group
        if (!string.IsNullOrEmpty(request.Group))
        {
            var siblings = await _db.Categories
                .Where(c => c.Group == request.Group && c.Id != id)
                .ToListAsync();
            foreach (var s in siblings)
                s.GroupEmoji = request.GroupEmoji;
        }

        await _db.SaveChangesAsync();
        return new CategoryDto(category.Id, category.Name, category.Type, category.Group, category.GroupEmoji);
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
