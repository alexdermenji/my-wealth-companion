using FinanceFlow.Api.Data;
using FinanceFlow.Api.Middleware;
using FinanceFlow.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")!;
var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "";
connectionString = connectionString.Replace("%DB_PASSWORD%", dbPassword);

builder.Services.AddDbContext<FinanceDbContext>(options =>
    options.UseNpgsql(connectionString));

// Authentication (Supabase JWT)
var supabaseAuthority = Environment.GetEnvironmentVariable("SUPABASE_JWT_AUTHORITY")
    ?? "https://wxkjibwgqeuiijevodka.supabase.co/auth/v1";
var supabaseAudience = Environment.GetEnvironmentVariable("SUPABASE_JWT_AUDIENCE")
    ?? "authenticated";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = supabaseAuthority;
        options.Audience = supabaseAudience;

        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidAudiences = new[] { supabaseAudience },
        };
    });
builder.Services.AddAuthorization();

// Current user
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

// Services
builder.Services.AddScoped<IAccountService, AccountService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<ITransactionService, TransactionService>();
builder.Services.AddScoped<IBudgetPlanService, BudgetPlanService>();
builder.Services.AddScoped<ISettingsService, SettingsService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IUserDataSeeder, UserDataSeeder>();

// Controllers + JSON
builder.Services.AddControllers();

// OpenAPI
builder.Services.AddOpenApi();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("DevCors", policy =>
    {
        policy.WithOrigins("http://localhost:8080")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Apply pending migrations on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<FinanceDbContext>();
    db.Database.Migrate();
}

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseCors("DevCors");
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<UserSeedMiddleware>();
app.MapControllers();
app.Run();
