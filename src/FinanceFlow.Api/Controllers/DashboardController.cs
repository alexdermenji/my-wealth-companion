using FinanceFlow.Api.Models.DTOs;
using FinanceFlow.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace FinanceFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _service;

    public DashboardController(IDashboardService service)
    {
        _service = service;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<DashboardSummaryDto>> GetSummary(
        [FromQuery] int year,
        [FromQuery] int month)
    {
        return await _service.GetSummaryAsync(year, month);
    }

    [HttpGet("monthly-comparison")]
    public async Task<ActionResult<MonthlyComparisonDto>> GetMonthlyComparison(
        [FromQuery] int year)
    {
        return await _service.GetMonthlyComparisonAsync(year);
    }
}
