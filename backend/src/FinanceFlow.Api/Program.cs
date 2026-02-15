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

// Authentication (Keycloak JWT)
var keycloakAuthority = Environment.GetEnvironmentVariable("KEYCLOAK_AUTHORITY")
    ?? "http://localhost:8180/realms/financeflow";
var keycloakAudience = Environment.GetEnvironmentVariable("KEYCLOAK_AUDIENCE")
    ?? "financeflow-spa";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = keycloakAuthority;
        options.Audience = keycloakAudience;
        options.RequireHttpsMetadata = false; // dev only — Keycloak runs on HTTP locally

        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidAudiences = new[] { keycloakAudience, "account" },
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
