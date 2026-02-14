namespace FinanceFlow.Api.Models.DTOs;

public record AccountDto(string Id, string Name, string Type);
public record CreateAccountRequest(string Name, string Type);
public record UpdateAccountRequest(string Name, string Type);
