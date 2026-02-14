namespace FinanceFlow.Api.Models.Domain;

public class Transaction
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public DateTime Date { get; set; }
    public decimal Amount { get; set; }
    public string Details { get; set; } = string.Empty;
    public string AccountId { get; set; } = string.Empty;
    public string BudgetType { get; set; } = string.Empty;
    public string? BudgetPositionId { get; set; }
    public string UserId { get; set; } = string.Empty;

    public Account? Account { get; set; }
    public BudgetCategory? BudgetPosition { get; set; }
}
