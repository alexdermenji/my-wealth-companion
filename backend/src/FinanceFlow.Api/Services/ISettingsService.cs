using FinanceFlow.Api.Models.DTOs;

namespace FinanceFlow.Api.Services;

public interface ISettingsService
{
    Task<SettingsDto> GetAsync();
    Task<SettingsDto> UpdateAsync(UpdateSettingsRequest request);
}
