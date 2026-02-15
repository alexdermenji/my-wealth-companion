using FinanceFlow.Api.Models.DTOs;
using FinanceFlow.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceFlow.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _service;

    public CategoriesController(ICategoryService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetAll([FromQuery] string? type = null)
    {
        return await _service.GetAllAsync(type);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CategoryDto>> GetById(string id)
    {
        var category = await _service.GetByIdAsync(id);
        if (category is null) return NotFound();
        return category;
    }

    [HttpPost]
    public async Task<ActionResult<CategoryDto>> Create(CreateCategoryRequest request)
    {
        var category = await _service.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = category.Id }, category);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<CategoryDto>> Update(string id, UpdateCategoryRequest request)
    {
        var category = await _service.UpdateAsync(id, request);
        if (category is null) return NotFound();
        return category;
    }

    [HttpGet("{id}/usage")]
    public async Task<ActionResult<CategoryUsageDto>> GetUsage(string id)
    {
        var usage = await _service.GetUsageAsync(id);
        if (usage is null) return NotFound();
        return usage;
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, [FromQuery] bool force = false)
    {
        if (!force)
        {
            var usage = await _service.GetUsageAsync(id);
            if (usage is null) return NotFound();
            if (usage.TransactionCount > 0 || usage.BudgetPlanCount > 0)
                return Conflict(usage);
        }

        var deleted = await _service.DeleteAsync(id, force);
        if (!deleted) return NotFound();
        return NoContent();
    }
}
