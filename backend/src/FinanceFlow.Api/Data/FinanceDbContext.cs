using FinanceFlow.Api.Models.Domain;
using FinanceFlow.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace FinanceFlow.Api.Data;

public class FinanceDbContext : DbContext
{
    private readonly ICurrentUserService? _currentUser;

    public FinanceDbContext(DbContextOptions<FinanceDbContext> options, ICurrentUserService? currentUser = null)
        : base(options)
    {
        _currentUser = currentUser;
    }

    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<BudgetCategory> Categories => Set<BudgetCategory>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<BudgetPlan> BudgetPlans => Set<BudgetPlan>();
    public DbSet<Settings> Settings => Set<Settings>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Global query filters for multi-user data isolation
        // Bypass filter when no user context (migrations, startup)
        modelBuilder.Entity<Account>().HasQueryFilter(e => _currentUser == null || _currentUser.UserId == null || e.UserId == _currentUser.UserId);
        modelBuilder.Entity<Transaction>().HasQueryFilter(e => _currentUser == null || _currentUser.UserId == null || e.UserId == _currentUser.UserId);
        modelBuilder.Entity<BudgetCategory>().HasQueryFilter(e => _currentUser == null || _currentUser.UserId == null || e.UserId == _currentUser.UserId);
        modelBuilder.Entity<BudgetPlan>().HasQueryFilter(e => _currentUser == null || _currentUser.UserId == null || e.UserId == _currentUser.UserId);
        modelBuilder.Entity<Settings>().HasQueryFilter(e => _currentUser == null || _currentUser.UserId == null || e.UserId == _currentUser.UserId);

        // BudgetPlan: unique constraint on (CategoryId, Year, Month, UserId)
        modelBuilder.Entity<BudgetPlan>()
            .HasIndex(bp => new { bp.CategoryId, bp.Year, bp.Month, bp.UserId })
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

        // Index on UserId for faster queries
        modelBuilder.Entity<Account>().HasIndex(e => e.UserId);
        modelBuilder.Entity<Transaction>().HasIndex(e => e.UserId);
        modelBuilder.Entity<BudgetCategory>().HasIndex(e => e.UserId);
        modelBuilder.Entity<BudgetPlan>().HasIndex(e => e.UserId);
        modelBuilder.Entity<Settings>().HasIndex(e => e.UserId).IsUnique();
    }

    public override int SaveChanges()
    {
        StampUserId();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        StampUserId();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void StampUserId()
    {
        if (_currentUser?.UserId == null) return;

        foreach (var entry in ChangeTracker.Entries().Where(e => e.State == EntityState.Added))
        {
            switch (entry.Entity)
            {
                case Account a: a.UserId = _currentUser.UserId; break;
                case Transaction t: t.UserId = _currentUser.UserId; break;
                case BudgetCategory c: c.UserId = _currentUser.UserId; break;
                case BudgetPlan bp: bp.UserId = _currentUser.UserId; break;
                case Settings s: s.UserId = _currentUser.UserId; break;
            }
        }
    }
}
