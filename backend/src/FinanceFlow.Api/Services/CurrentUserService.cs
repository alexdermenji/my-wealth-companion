using System.Security.Claims;

namespace FinanceFlow.Api.Services;

public interface ICurrentUserService
{
    string? UserId { get; }
}

public class CurrentUserService : ICurrentUserService
{
    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        UserId = httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                 ?? httpContextAccessor.HttpContext?.User?.FindFirst("sub")?.Value;
    }

    public string? UserId { get; }
}
