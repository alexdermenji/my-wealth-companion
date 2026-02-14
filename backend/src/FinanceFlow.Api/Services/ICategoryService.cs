using FinanceFlow.Api.Models.DTOs;

namespace FinanceFlow.Api.Services;

public interface ICategoryService
{
    Task<List<CategoryDto>> GetAllAsync(string? type = null);
    Task<CategoryDto?> GetByIdAsync(string id);
    Task<CategoryDto> CreateAsync(CreateCategoryRequest request);
    Task<CategoryDto?> UpdateAsync(string id, UpdateCategoryRequest request);
    Task<CategoryUsageDto?> GetUsageAsync(string id);
    Task<bool> DeleteAsync(string id, bool force = false);
}
