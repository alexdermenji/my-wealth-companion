namespace FinanceFlow.Api.Models.DTOs;

public record AccountDto(string Id, string Name, string Type, decimal OpeningBalance);
public record CreateAccountRequest(string Name, string Type, decimal OpeningBalance);
public record UpdateAccountRequest(string Name, string Type, decimal OpeningBalance);
