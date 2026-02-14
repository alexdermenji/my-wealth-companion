using FinanceFlow.Api.Models.DTOs;
using FinanceFlow.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace FinanceFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SettingsController : ControllerBase
{
    private readonly ISettingsService _service;

    public SettingsController(ISettingsService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<SettingsDto>> Get()
    {
        return await _service.GetAsync();
    }

    [HttpPut]
    public async Task<ActionResult<SettingsDto>> Update(UpdateSettingsRequest request)
    {
        return await _service.UpdateAsync(request);
    }
}
