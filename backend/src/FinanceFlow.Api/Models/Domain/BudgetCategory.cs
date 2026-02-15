namespace FinanceFlow.Api.Models.Domain;

public class BudgetCategory
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "Expenses";
    public string Group { get; set; } = string.Empty;
    public string GroupEmoji { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;

    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
    public ICollection<BudgetPlan> BudgetPlans { get; set; } = new List<BudgetPlan>();
}
