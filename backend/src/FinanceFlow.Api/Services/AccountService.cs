using FinanceFlow.Api.Data;
using FinanceFlow.Api.Models.Domain;
using FinanceFlow.Api.Models.DTOs;
using Microsoft.EntityFrameworkCore;

namespace FinanceFlow.Api.Services;

public class AccountService : IAccountService
{
    private readonly FinanceDbContext _db;

    public AccountService(FinanceDbContext db)
    {
        _db = db;
    }

    public async Task<List<AccountDto>> GetAllAsync()
    {
        return await _db.Accounts
            .Select(a => new AccountDto(a.Id, a.Name, a.Type))
            .ToListAsync();
    }

    public async Task<AccountDto?> GetByIdAsync(string id)
    {
        var account = await _db.Accounts.FindAsync(id);
        if (account is null) return null;
        return new AccountDto(account.Id, account.Name, account.Type);
    }

    public async Task<AccountDto> CreateAsync(CreateAccountRequest request)
    {
        var account = new Account
        {
            Name = request.Name,
            Type = request.Type
        };
        _db.Accounts.Add(account);
        await _db.SaveChangesAsync();
        return new AccountDto(account.Id, account.Name, account.Type);
    }

    public async Task<AccountDto?> UpdateAsync(string id, UpdateAccountRequest request)
    {
        var account = await _db.Accounts.FindAsync(id);
        if (account is null) return null;

        account.Name = request.Name;
        account.Type = request.Type;
        await _db.SaveChangesAsync();
        return new AccountDto(account.Id, account.Name, account.Type);
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var account = await _db.Accounts.FindAsync(id);
        if (account is null) return false;

        _db.Accounts.Remove(account);
        await _db.SaveChangesAsync();
        return true;
    }
}
