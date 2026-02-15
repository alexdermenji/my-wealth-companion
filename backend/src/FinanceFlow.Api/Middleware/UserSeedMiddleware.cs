using FinanceFlow.Api.Services;

namespace FinanceFlow.Api.Middleware;

public class UserSeedMiddleware
{
    private readonly RequestDelegate _next;

    public UserSeedMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, IUserDataSeeder seeder)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            await seeder.SeedIfNewUserAsync();
        }

        await _next(context);
    }
}
