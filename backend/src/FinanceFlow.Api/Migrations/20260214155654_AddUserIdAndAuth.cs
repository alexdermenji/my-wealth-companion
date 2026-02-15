using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FinanceFlow.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUserIdAndAuth : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_BudgetPlans_CategoryId_Year_Month",
                table: "BudgetPlans");

            // Note: Seed data rows are intentionally kept (not deleted) because
            // existing transactions may reference them via foreign keys.
            // They'll have an empty UserId and won't appear for authenticated users.

            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "Transactions",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "Settings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "Categories",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "BudgetPlans",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "Accounts",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_UserId",
                table: "Transactions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Settings_UserId",
                table: "Settings",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Categories_UserId",
                table: "Categories",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_BudgetPlans_CategoryId_Year_Month_UserId",
                table: "BudgetPlans",
                columns: new[] { "CategoryId", "Year", "Month", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BudgetPlans_UserId",
                table: "BudgetPlans",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_UserId",
                table: "Accounts",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Transactions_UserId",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Settings_UserId",
                table: "Settings");

            migrationBuilder.DropIndex(
                name: "IX_Categories_UserId",
                table: "Categories");

            migrationBuilder.DropIndex(
                name: "IX_BudgetPlans_CategoryId_Year_Month_UserId",
                table: "BudgetPlans");

            migrationBuilder.DropIndex(
                name: "IX_BudgetPlans_UserId",
                table: "BudgetPlans");

            migrationBuilder.DropIndex(
                name: "IX_Accounts_UserId",
                table: "Accounts");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Settings");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Categories");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "BudgetPlans");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Accounts");

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
                columns: new[] { "Id", "Group", "GroupEmoji", "Name", "Type" },
                values: new object[,]
                {
                    { "c1", "Work Income", "", "Employment (Net)", "Income" },
                    { "c10", "Self-Care", "", "Gym", "Expenses" },
                    { "c11", "Self-Care", "", "Body Care & Medicine", "Expenses" },
                    { "c12", "Transportation", "", "Car Gas", "Expenses" },
                    { "c13", "Transportation", "", "Metro Ticket", "Expenses" },
                    { "c14", "Entertainment", "", "Netflix", "Expenses" },
                    { "c15", "Retirement", "", "Roth IRA", "Savings" },
                    { "c16", "Emergency", "", "Emergency Fund", "Savings" },
                    { "c17", "Investments", "", "Stock Portfolio", "Savings" },
                    { "c18", "Car Debt", "", "Car Loan", "Debt" },
                    { "c19", "Credit Card Debt", "", "Credit Card Debt", "Debt" },
                    { "c2", "Work Income", "", "Side Hustle (Net)", "Income" },
                    { "c20", "Student Loan Debt", "", "Undergraduate Loan", "Debt" },
                    { "c3", "Capital Income", "", "Dividends (Net)", "Income" },
                    { "c4", "Housing", "", "Rent", "Expenses" },
                    { "c5", "Housing", "", "Utilities", "Expenses" },
                    { "c6", "Housing", "", "Internet", "Expenses" },
                    { "c7", "Groceries", "", "Groceries", "Expenses" },
                    { "c8", "Fun", "", "Going Out", "Expenses" },
                    { "c9", "Fun", "", "Shopping", "Expenses" }
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
        }
    }
}
