namespace FinanceFlow.Api.Models.DTOs;

public record TransactionDto(
    string Id,
    string Date,
    decimal Amount,
    string Details,
    string AccountId,
    string BudgetType,
    string BudgetPositionId
);

public record CreateTransactionRequest(
    string Date,
    decimal Amount,
    string Details,
    string AccountId,
    string BudgetType,
    string BudgetPositionId
);

public record UpdateTransactionRequest(
    string Date,
    decimal Amount,
    string Details,
    string AccountId,
    string BudgetType,
    string BudgetPositionId
);
