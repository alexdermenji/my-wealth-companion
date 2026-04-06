using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinanceFlow.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAccountOpeningBalance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<float>(
                name: "OpeningBalance",
                table: "Accounts",
                type: "REAL",
                nullable: false,
                defaultValue: 0f);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OpeningBalance",
                table: "Accounts");
        }
    }
}
