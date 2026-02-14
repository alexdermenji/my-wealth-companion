using FinanceFlow.Api.Data;
using FinanceFlow.Api.Models.DTOs;
using Microsoft.EntityFrameworkCore;

namespace FinanceFlow.Api.Services;

public class SettingsService : ISettingsService
{
    private readonly FinanceDbContext _db;

    public SettingsService(FinanceDbContext db)
    {
        _db = db;
    }

    public async Task<SettingsDto> GetAsync()
    {
        var settings = await _db.Settings.FirstAsync();
        return new SettingsDto(settings.StartYear, settings.StartMonth, settings.Currency);
    }

    public async Task<SettingsDto> UpdateAsync(UpdateSettingsRequest request)
    {
        var settings = await _db.Settings.FirstAsync();
        settings.StartYear = request.StartYear;
        settings.StartMonth = request.StartMonth;
        settings.Currency = request.Currency;
        await _db.SaveChangesAsync();
        return new SettingsDto(settings.StartYear, settings.StartMonth, settings.Currency);
    }
}
