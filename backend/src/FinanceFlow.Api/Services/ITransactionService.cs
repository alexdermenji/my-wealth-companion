using FinanceFlow.Api.Models.DTOs;

namespace FinanceFlow.Api.Services;

public interface ITransactionService
{
    Task<List<TransactionDto>> GetAllAsync(string? budgetType = null, string? accountId = null);
    Task<TransactionDto?> GetByIdAsync(string id);
    Task<TransactionDto> CreateAsync(CreateTransactionRequest request);
    Task<TransactionDto?> UpdateAsync(string id, UpdateTransactionRequest request);
    Task<bool> DeleteAsync(string id);
}
