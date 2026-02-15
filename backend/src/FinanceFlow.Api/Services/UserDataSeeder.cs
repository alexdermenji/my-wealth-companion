using FinanceFlow.Api.Data;
using FinanceFlow.Api.Models.Domain;
using Microsoft.EntityFrameworkCore;

namespace FinanceFlow.Api.Services;

public interface IUserDataSeeder
{
    Task SeedIfNewUserAsync();
}

public class UserDataSeeder : IUserDataSeeder
{
    private readonly FinanceDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public UserDataSeeder(FinanceDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task SeedIfNewUserAsync()
    {
        var hasSettings = await _db.Settings.AnyAsync();
        if (hasSettings) return;

        // Settings
        _db.Settings.Add(new Settings
        {
            StartYear = DateTime.UtcNow.Year,
            StartMonth = DateTime.UtcNow.Month,
            Currency = "$"
        });

        // Default accounts
        _db.Accounts.AddRange(
            new Account { Name = "Bank Account", Type = "Bank" },
            new Account { Name = "Cash on Hand", Type = "Cash" },
            new Account { Name = "Credit Card 1", Type = "Credit Card" }
        );

        // Default budget categories
        _db.Categories.AddRange(
            new BudgetCategory { Name = "Employment (Net)", Type = "Income", Group = "Work Income" },
            new BudgetCategory { Name = "Side Hustle (Net)", Type = "Income", Group = "Work Income" },
            new BudgetCategory { Name = "Dividends (Net)", Type = "Income", Group = "Capital Income" },
            new BudgetCategory { Name = "Rent", Type = "Expenses", Group = "Housing" },
            new BudgetCategory { Name = "Utilities", Type = "Expenses", Group = "Housing" },
            new BudgetCategory { Name = "Internet", Type = "Expenses", Group = "Housing" },
            new BudgetCategory { Name = "Groceries", Type = "Expenses", Group = "Groceries" },
            new BudgetCategory { Name = "Going Out", Type = "Expenses", Group = "Fun" },
            new BudgetCategory { Name = "Shopping", Type = "Expenses", Group = "Fun" },
            new BudgetCategory { Name = "Gym", Type = "Expenses", Group = "Self-Care" },
            new BudgetCategory { Name = "Body Care & Medicine", Type = "Expenses", Group = "Self-Care" },
            new BudgetCategory { Name = "Car Gas", Type = "Expenses", Group = "Transportation" },
            new BudgetCategory { Name = "Metro Ticket", Type = "Expenses", Group = "Transportation" },
            new BudgetCategory { Name = "Netflix", Type = "Expenses", Group = "Entertainment" },
            new BudgetCategory { Name = "Roth IRA", Type = "Savings", Group = "Retirement" },
            new BudgetCategory { Name = "Emergency Fund", Type = "Savings", Group = "Emergency" },
            new BudgetCategory { Name = "Stock Portfolio", Type = "Savings", Group = "Investments" },
            new BudgetCategory { Name = "Car Loan", Type = "Debt", Group = "Car Debt" },
            new BudgetCategory { Name = "Credit Card Debt", Type = "Debt", Group = "Credit Card Debt" },
            new BudgetCategory { Name = "Undergraduate Loan", Type = "Debt", Group = "Student Loan Debt" }
        );

        // UserId is auto-stamped by DbContext.SaveChangesAsync
        await _db.SaveChangesAsync();
    }
}
