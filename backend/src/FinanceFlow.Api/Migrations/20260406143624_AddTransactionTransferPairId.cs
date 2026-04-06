using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinanceFlow.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTransactionTransferPairId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TransferPairId",
                table: "Transactions",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TransferPairId",
                table: "Transactions");
        }
    }
}
