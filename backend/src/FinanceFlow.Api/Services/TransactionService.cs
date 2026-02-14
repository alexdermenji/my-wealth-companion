using FinanceFlow.Api.Data;
using FinanceFlow.Api.Models.Domain;
using FinanceFlow.Api.Models.DTOs;
using Microsoft.EntityFrameworkCore;

namespace FinanceFlow.Api.Services;

public class TransactionService : ITransactionService
{
    private readonly FinanceDbContext _db;

    public TransactionService(FinanceDbContext db)
    {
        _db = db;
    }

    // Convert empty string to null for the FK column
    private static string? NormalizeId(string? id) =>
        string.IsNullOrEmpty(id) ? null : id;

    public async Task<List<TransactionDto>> GetAllAsync(string? budgetType = null, string? accountId = null)
    {
        var query = _db.Transactions.AsQueryable();

        if (!string.IsNullOrEmpty(budgetType))
        {
            query = query.Where(t => t.BudgetType == budgetType);
        }
        if (!string.IsNullOrEmpty(accountId))
        {
            query = query.Where(t => t.AccountId == accountId);
        }

        return await query
            .OrderByDescending(t => t.Date)
            .Select(t => new TransactionDto(
                t.Id,
                t.Date.ToString("yyyy-MM-dd"),
                t.Amount,
                t.Details,
                t.AccountId,
                t.BudgetType,
                t.BudgetPositionId ?? ""
            ))
            .ToListAsync();
    }

    public async Task<TransactionDto?> GetByIdAsync(string id)
    {
        var t = await _db.Transactions.FindAsync(id);
        if (t is null) return null;
        return new TransactionDto(
            t.Id, t.Date.ToString("yyyy-MM-dd"), t.Amount,
            t.Details, t.AccountId, t.BudgetType, t.BudgetPositionId ?? ""
        );
    }

    public async Task<TransactionDto> CreateAsync(CreateTransactionRequest request)
    {
        var transaction = new Transaction
        {
            Date = DateTime.Parse(request.Date).ToUniversalTime(),
            Amount = request.Amount,
            Details = request.Details,
            AccountId = request.AccountId,
            BudgetType = request.BudgetType,
            BudgetPositionId = NormalizeId(request.BudgetPositionId)
        };
        _db.Transactions.Add(transaction);
        await _db.SaveChangesAsync();
        return new TransactionDto(
            transaction.Id, transaction.Date.ToString("yyyy-MM-dd"), transaction.Amount,
            transaction.Details, transaction.AccountId, transaction.BudgetType, transaction.BudgetPositionId ?? ""
        );
    }

    public async Task<TransactionDto?> UpdateAsync(string id, UpdateTransactionRequest request)
    {
        var transaction = await _db.Transactions.FindAsync(id);
        if (transaction is null) return null;

        transaction.Date = DateTime.Parse(request.Date).ToUniversalTime();
        transaction.Amount = request.Amount;
        transaction.Details = request.Details;
        transaction.AccountId = request.AccountId;
        transaction.BudgetType = request.BudgetType;
        transaction.BudgetPositionId = NormalizeId(request.BudgetPositionId);
        await _db.SaveChangesAsync();

        return new TransactionDto(
            transaction.Id, transaction.Date.ToString("yyyy-MM-dd"), transaction.Amount,
            transaction.Details, transaction.AccountId, transaction.BudgetType, transaction.BudgetPositionId ?? ""
        );
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var transaction = await _db.Transactions.FindAsync(id);
        if (transaction is null) return false;

        _db.Transactions.Remove(transaction);
        await _db.SaveChangesAsync();
        return true;
    }
}
