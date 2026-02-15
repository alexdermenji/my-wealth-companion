namespace FinanceFlow.Api.Models.Domain;

public class BudgetPlan
{
    public int Id { get; set; }
    public string CategoryId { get; set; } = string.Empty;
    public int Year { get; set; }
    public int Month { get; set; }
    public decimal Amount { get; set; }
    public string UserId { get; set; } = string.Empty;

    public BudgetCategory? Category { get; set; }
}
