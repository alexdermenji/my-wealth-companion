namespace FinanceFlow.Api.Models.Domain;

public class Settings
{
    public int Id { get; set; }
    public int StartYear { get; set; } = 2026;
    public int StartMonth { get; set; } = 1;
    public string Currency { get; set; } = "$";
    public string UserId { get; set; } = string.Empty;
}
