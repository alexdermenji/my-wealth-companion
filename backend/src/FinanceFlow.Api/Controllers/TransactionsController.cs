using FinanceFlow.Api.Models.DTOs;
using FinanceFlow.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceFlow.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TransactionsController : ControllerBase
{
    private readonly ITransactionService _service;

    public TransactionsController(ITransactionService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<TransactionDto>>> GetAll(
        [FromQuery] string? budgetType = null,
        [FromQuery] string? accountId = null)
    {
        return await _service.GetAllAsync(budgetType, accountId);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TransactionDto>> GetById(string id)
    {
        var transaction = await _service.GetByIdAsync(id);
        if (transaction is null) return NotFound();
        return transaction;
    }

    [HttpPost]
    public async Task<ActionResult<TransactionDto>> Create(CreateTransactionRequest request)
    {
        var transaction = await _service.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = transaction.Id }, transaction);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<TransactionDto>> Update(string id, UpdateTransactionRequest request)
    {
        var transaction = await _service.UpdateAsync(id, request);
        if (transaction is null) return NotFound();
        return transaction;
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var deleted = await _service.DeleteAsync(id);
        if (!deleted) return NotFound();
        return NoContent();
    }
}
