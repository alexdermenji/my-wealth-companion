using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace FinanceFlow.Api.Data;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<FinanceDbContext>
{
    public FinanceDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<FinanceDbContext>();
        optionsBuilder.UseNpgsql("Host=localhost;Database=financeflow;Username=postgres;Password=postgres");

        return new FinanceDbContext(optionsBuilder.Options, currentUser: null);
    }
}
