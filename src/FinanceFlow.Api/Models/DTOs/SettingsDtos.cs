namespace FinanceFlow.Api.Models.DTOs;

public record SettingsDto(int StartYear, int StartMonth, string Currency);
public record UpdateSettingsRequest(int StartYear, int StartMonth, string Currency);
