using FinanceFlow.Api.Models.Domain;
using Microsoft.EntityFrameworkCore;

namespace FinanceFlow.Api.Data;

public class FinanceDbContext : DbContext
{
    public FinanceDbContext(DbContextOptions<FinanceDbContext> options) : base(options) { }

    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<BudgetCategory> Categories => Set<BudgetCategory>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<BudgetPlan> BudgetPlans => Set<BudgetPlan>();
    public DbSet<Settings> Settings => Set<Settings>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // BudgetPlan: unique constraint on (CategoryId, Year, Month)
        modelBuilder.Entity<BudgetPlan>()
            .HasIndex(bp => new { bp.CategoryId, bp.Year, bp.Month })
            .IsUnique();

        // Transaction -> Account
        modelBuilder.Entity<Transaction>()
            .HasOne(t => t.Account)
            .WithMany(a => a.Transactions)
            .HasForeignKey(t => t.AccountId)
            .OnDelete(DeleteBehavior.Restrict);

        // Transaction -> BudgetCategory (optional — budgetPositionId can be empty)
        modelBuilder.Entity<Transaction>()
            .HasOne(t => t.BudgetPosition)
            .WithMany(c => c.Transactions)
            .HasForeignKey(t => t.BudgetPositionId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        // BudgetPlan -> BudgetCategory
        modelBuilder.Entity<BudgetPlan>()
            .HasOne(bp => bp.Category)
            .WithMany(c => c.BudgetPlans)
            .HasForeignKey(bp => bp.CategoryId);

        // Use decimal precision for money fields
        modelBuilder.Entity<Transaction>()
            .Property(t => t.Amount)
            .HasColumnType("REAL");

        modelBuilder.Entity<BudgetPlan>()
            .Property(bp => bp.Amount)
            .HasColumnType("REAL");

        // --- Seed data (matches store.ts defaultState) ---

        modelBuilder.Entity<Settings>().HasData(
            new Settings { Id = 1, StartYear = 2026, StartMonth = 1, Currency = "$" }
        );

        modelBuilder.Entity<Account>().HasData(
            new Account { Id = "1", Name = "Bank Account", Type = "Bank" },
            new Account { Id = "2", Name = "Cash on Hand", Type = "Cash" },
            new Account { Id = "3", Name = "Credit Card 1", Type = "Credit Card" }
        );

        modelBuilder.Entity<BudgetCategory>().HasData(
            new BudgetCategory { Id = "c1", Name = "Employment (Net)", Type = "Income", Group = "Work Income" },
            new BudgetCategory { Id = "c2", Name = "Side Hustle (Net)", Type = "Income", Group = "Work Income" },
            new BudgetCategory { Id = "c3", Name = "Dividends (Net)", Type = "Income", Group = "Capital Income" },
            new BudgetCategory { Id = "c4", Name = "Rent", Type = "Expenses", Group = "Housing" },
            new BudgetCategory { Id = "c5", Name = "Utilities", Type = "Expenses", Group = "Housing" },
            new BudgetCategory { Id = "c6", Name = "Internet", Type = "Expenses", Group = "Housing" },
            new BudgetCategory { Id = "c7", Name = "Groceries", Type = "Expenses", Group = "Groceries" },
            new BudgetCategory { Id = "c8", Name = "Going Out", Type = "Expenses", Group = "Fun" },
            new BudgetCategory { Id = "c9", Name = "Shopping", Type = "Expenses", Group = "Fun" },
            new BudgetCategory { Id = "c10", Name = "Gym", Type = "Expenses", Group = "Self-Care" },
            new BudgetCategory { Id = "c11", Name = "Body Care & Medicine", Type = "Expenses", Group = "Self-Care" },
            new BudgetCategory { Id = "c12", Name = "Car Gas", Type = "Expenses", Group = "Transportation" },
            new BudgetCategory { Id = "c13", Name = "Metro Ticket", Type = "Expenses", Group = "Transportation" },
            new BudgetCategory { Id = "c14", Name = "Netflix", Type = "Expenses", Group = "Entertainment" },
            new BudgetCategory { Id = "c15", Name = "Roth IRA", Type = "Savings", Group = "Retirement" },
            new BudgetCategory { Id = "c16", Name = "Emergency Fund", Type = "Savings", Group = "Emergency" },
            new BudgetCategory { Id = "c17", Name = "Stock Portfolio", Type = "Savings", Group = "Investments" },
            new BudgetCategory { Id = "c18", Name = "Car Loan", Type = "Debt", Group = "Car Debt" },
            new BudgetCategory { Id = "c19", Name = "Credit Card Debt", Type = "Debt", Group = "Credit Card Debt" },
            new BudgetCategory { Id = "c20", Name = "Undergraduate Loan", Type = "Debt", Group = "Student Loan Debt" }
        );
    }
}
