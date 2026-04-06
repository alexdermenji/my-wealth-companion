using FinanceFlow.Api.Data;
using FinanceFlow.Api.Models.Domain;
using FinanceFlow.Api.Models.DTOs;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

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

    // Transaction dates are calendar dates from the UI, not instants in time.
    private static DateTime ParseTransactionDate(string value) =>
        DateTime.SpecifyKind(
            DateTime.ParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture),
            DateTimeKind.Utc
        );

    private static TransactionDto ToDto(Transaction t) =>
        new(
            t.Id, t.Date.ToString("yyyy-MM-dd"), t.Amount,
            t.Details, t.AccountId, t.BudgetType,
            t.BudgetPositionId ?? "", t.TransferPairId
        );

    public async Task<List<TransactionDto>> GetAllAsync(string? budgetType = null, string? accountId = null)
    {
        var query = _db.Transactions.AsQueryable();

        if (!string.IsNullOrEmpty(budgetType))
            query = query.Where(t => t.BudgetType == budgetType);
        if (!string.IsNullOrEmpty(accountId))
            query = query.Where(t => t.AccountId == accountId);

        return await query
            .OrderByDescending(t => t.Date)
            .Select(t => new TransactionDto(
                t.Id, t.Date.ToString("yyyy-MM-dd"), t.Amount,
                t.Details, t.AccountId, t.BudgetType,
                t.BudgetPositionId ?? "", t.TransferPairId
            ))
            .ToListAsync();
    }

    public async Task<TransactionDto?> GetByIdAsync(string id)
    {
        var t = await _db.Transactions.FindAsync(id);
        if (t is null) return null;
        return ToDto(t);
    }

    public async Task<TransactionDto> CreateAsync(CreateTransactionRequest request)
    {
        var transaction = new Transaction
        {
            Date = ParseTransactionDate(request.Date),
            Amount = request.Amount,
            Details = request.Details,
            AccountId = request.AccountId,
            BudgetType = request.BudgetType,
            BudgetPositionId = NormalizeId(request.BudgetPositionId)
        };
        _db.Transactions.Add(transaction);
        await _db.SaveChangesAsync();
        return ToDto(transaction);
    }

    public async Task<TransactionDto?> UpdateAsync(string id, UpdateTransactionRequest request)
    {
        var transaction = await _db.Transactions.FindAsync(id);
        if (transaction is null) return null;

        transaction.Date = ParseTransactionDate(request.Date);
        transaction.Amount = request.Amount;
        transaction.Details = request.Details;
        transaction.AccountId = request.AccountId;
        transaction.BudgetType = request.BudgetType;
        transaction.BudgetPositionId = NormalizeId(request.BudgetPositionId);
        await _db.SaveChangesAsync();

        return ToDto(transaction);
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var transaction = await _db.Transactions.FindAsync(id);
        if (transaction is null) return false;

        if (transaction.TransferPairId is not null)
        {
            var pair = await _db.Transactions
                .FirstOrDefaultAsync(t => t.TransferPairId == transaction.TransferPairId && t.Id != id);
            if (pair is not null) _db.Transactions.Remove(pair);
        }

        _db.Transactions.Remove(transaction);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<(TransactionDto outflow, TransactionDto inflow)> CreateTransferAsync(CreateTransferRequest request)
    {
        var pairId = Guid.NewGuid().ToString();
        var date = ParseTransactionDate(request.Date);
        var amt = Math.Abs(request.Amount);

        var outflow = new Transaction
        {
            Date = date, Amount = -amt, Details = request.Details,
            AccountId = request.AccountFromId, BudgetType = "Transfer",
            TransferPairId = pairId
        };
        var inflow = new Transaction
        {
            Date = date, Amount = amt, Details = request.Details,
            AccountId = request.AccountToId, BudgetType = "Transfer",
            TransferPairId = pairId
        };

        _db.Transactions.AddRange(outflow, inflow);
        await _db.SaveChangesAsync();
        return (ToDto(outflow), ToDto(inflow));
    }
}
