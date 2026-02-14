using FinanceFlow.Api.Models.DTOs;
using FinanceFlow.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceFlow.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/budget-plans")]
public class BudgetPlansController : ControllerBase
{
    private readonly IBudgetPlanService _service;

    public BudgetPlansController(IBudgetPlanService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<BudgetPlanDto>>> GetByYear(
        [FromQuery] int year,
        [FromQuery] string? categoryId = null)
    {
        return await _service.GetByYearAsync(year, categoryId);
    }

    [HttpPut]
    public async Task<ActionResult<BudgetPlanDto>> SetAmount(SetBudgetAmountRequest request)
    {
        var result = await _service.SetAmountAsync(request);
        return result;
    }
}
