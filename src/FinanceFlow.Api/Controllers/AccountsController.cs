using FinanceFlow.Api.Models.DTOs;
using FinanceFlow.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace FinanceFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AccountsController : ControllerBase
{
    private readonly IAccountService _service;

    public AccountsController(IAccountService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<AccountDto>>> GetAll()
    {
        return await _service.GetAllAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AccountDto>> GetById(string id)
    {
        var account = await _service.GetByIdAsync(id);
        if (account is null) return NotFound();
        return account;
    }

    [HttpPost]
    public async Task<ActionResult<AccountDto>> Create(CreateAccountRequest request)
    {
        var account = await _service.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = account.Id }, account);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<AccountDto>> Update(string id, UpdateAccountRequest request)
    {
        var account = await _service.UpdateAsync(id, request);
        if (account is null) return NotFound();
        return account;
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var deleted = await _service.DeleteAsync(id);
        if (!deleted) return NotFound();
        return NoContent();
    }
}
