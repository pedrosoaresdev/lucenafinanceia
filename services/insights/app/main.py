from __future__ import annotations

from datetime import date
from decimal import Decimal
from enum import Enum
from typing import Annotated

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="Lucena Finance Insights", version="0.1.0")


class Kind(str, Enum):
    income = "income"
    expense = "expense"


class Transaction(BaseModel):
    amount: Annotated[Decimal, Field(gt=0)]
    kind: Kind
    category: str = Field(min_length=1, max_length=80)
    occurred_on: date


class SummaryRequest(BaseModel):
    transactions: list[Transaction] = Field(max_length=5000)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/v1/summary")
def summarize(request: SummaryRequest) -> dict[str, object]:
    """Compute transparent aggregates from caller-authorized records; no prediction is implied."""
    income = sum((t.amount for t in request.transactions if t.kind is Kind.income), Decimal("0"))
    expenses = sum((t.amount for t in request.transactions if t.kind is Kind.expense), Decimal("0"))
    categories: dict[str, Decimal] = {}
    for transaction in request.transactions:
        if transaction.kind is Kind.expense:
            categories[transaction.category] = categories.get(transaction.category, Decimal("0")) + transaction.amount
    return {
        "source": "user-authorized-transactions",
        "isForecast": False,
        "incomeTotal": str(income),
        "expenseTotal": str(expenses),
        "net": str(income - expenses),
        "expensesByCategory": {key: str(value) for key, value in sorted(categories.items())},
        "transactionCount": len(request.transactions),
    }
