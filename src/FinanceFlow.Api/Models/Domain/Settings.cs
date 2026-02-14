namespace FinanceFlow.Api.Models.Domain;

public class Settings
{
    public int Id { get; set; } = 1;
    public int StartYear { get; set; } = 2026;
    public int StartMonth { get; set; } = 1;
    public string Currency { get; set; } = "$";
}
