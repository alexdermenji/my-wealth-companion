using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FinanceFlow.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Accounts",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Type = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Accounts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Categories",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Type = table.Column<string>(type: "TEXT", nullable: false),
                    Group = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Settings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    StartYear = table.Column<int>(type: "INTEGER", nullable: false),
                    StartMonth = table.Column<int>(type: "INTEGER", nullable: false),
                    Currency = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Settings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BudgetPlans",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CategoryId = table.Column<string>(type: "TEXT", nullable: false),
                    Year = table.Column<int>(type: "INTEGER", nullable: false),
                    Month = table.Column<int>(type: "INTEGER", nullable: false),
                    Amount = table.Column<decimal>(type: "REAL", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BudgetPlans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BudgetPlans_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Transactions",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    Date = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Amount = table.Column<decimal>(type: "REAL", nullable: false),
                    Details = table.Column<string>(type: "TEXT", nullable: false),
                    AccountId = table.Column<string>(type: "TEXT", nullable: false),
                    BudgetType = table.Column<string>(type: "TEXT", nullable: false),
                    BudgetPositionId = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Transactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Transactions_Accounts_AccountId",
                        column: x => x.AccountId,
                        principalTable: "Accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Transactions_Categories_BudgetPositionId",
                        column: x => x.BudgetPositionId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.InsertData(
                table: "Accounts",
                columns: new[] { "Id", "Name", "Type" },
                values: new object[,]
                {
                    { "1", "Bank Account", "Bank" },
                    { "2", "Cash on Hand", "Cash" },
                    { "3", "Credit Card 1", "Credit Card" }
                });

            migrationBuilder.InsertData(
                table: "Categories",
                columns: new[] { "Id", "Group", "Name", "Type" },
                values: new object[,]
                {
                    { "c1", "Work Income", "Employment (Net)", "Income" },
                    { "c10", "Self-Care", "Gym", "Expenses" },
                    { "c11", "Self-Care", "Body Care & Medicine", "Expenses" },
                    { "c12", "Transportation", "Car Gas", "Expenses" },
                    { "c13", "Transportation", "Metro Ticket", "Expenses" },
                    { "c14", "Entertainment", "Netflix", "Expenses" },
                    { "c15", "Retirement", "Roth IRA", "Savings" },
                    { "c16", "Emergency", "Emergency Fund", "Savings" },
                    { "c17", "Investments", "Stock Portfolio", "Savings" },
                    { "c18", "Car Debt", "Car Loan", "Debt" },
                    { "c19", "Credit Card Debt", "Credit Card Debt", "Debt" },
                    { "c2", "Work Income", "Side Hustle (Net)", "Income" },
                    { "c20", "Student Loan Debt", "Undergraduate Loan", "Debt" },
                    { "c3", "Capital Income", "Dividends (Net)", "Income" },
                    { "c4", "Housing", "Rent", "Expenses" },
                    { "c5", "Housing", "Utilities", "Expenses" },
                    { "c6", "Housing", "Internet", "Expenses" },
                    { "c7", "Groceries", "Groceries", "Expenses" },
                    { "c8", "Fun", "Going Out", "Expenses" },
                    { "c9", "Fun", "Shopping", "Expenses" }
                });

            migrationBuilder.InsertData(
                table: "Settings",
                columns: new[] { "Id", "Currency", "StartMonth", "StartYear" },
                values: new object[] { 1, "$", 1, 2026 });

            migrationBuilder.CreateIndex(
                name: "IX_BudgetPlans_CategoryId_Year_Month",
                table: "BudgetPlans",
                columns: new[] { "CategoryId", "Year", "Month" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_AccountId",
                table: "Transactions",
                column: "AccountId");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_BudgetPositionId",
                table: "Transactions",
                column: "BudgetPositionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BudgetPlans");

            migrationBuilder.DropTable(
                name: "Settings");

            migrationBuilder.DropTable(
                name: "Transactions");

            migrationBuilder.DropTable(
                name: "Accounts");

            migrationBuilder.DropTable(
                name: "Categories");
        }
    }
}
