using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinanceFlow.Api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveGroupEmoji : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GroupEmoji",
                table: "Categories");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GroupEmoji",
                table: "Categories",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
