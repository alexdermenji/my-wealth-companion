namespace FinanceFlow.Api.Models.Domain;

public class Account
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "Bank";
    public string UserId { get; set; } = string.Empty;
    public decimal OpeningBalance { get; set; } = 0;

    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}
