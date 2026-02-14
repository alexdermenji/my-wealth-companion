namespace FinanceFlow.Api.Models.Domain;

public class Account
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "Bank";

    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}
