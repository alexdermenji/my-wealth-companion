using FinanceFlow.Api.Models.DTOs;

namespace FinanceFlow.Api.Services;

public interface IAccountService
{
    Task<List<AccountDto>> GetAllAsync();
    Task<AccountDto?> GetByIdAsync(string id);
    Task<AccountDto> CreateAsync(CreateAccountRequest request);
    Task<AccountDto?> UpdateAsync(string id, UpdateAccountRequest request);
    Task<bool> DeleteAsync(string id);
}
