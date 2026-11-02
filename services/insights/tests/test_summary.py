import unittest
from datetime import date
from decimal import Decimal

from app.main import Kind, SummaryRequest, Transaction, summarize


class SummaryTests(unittest.TestCase):
    def test_sums_only_expenses_into_categories(self):
        request = SummaryRequest(transactions=[
            Transaction(amount=Decimal("100.00"), kind=Kind.income, category="Salário", occurred_on=date(2026, 1, 1)),
            Transaction(amount=Decimal("12.50"), kind=Kind.expense, category="Saúde", occurred_on=date(2026, 1, 2)),
        ])
        result = summarize(request)
        self.assertEqual(result["incomeTotal"], "100.00")
        self.assertEqual(result["expenseTotal"], "12.50")
        self.assertEqual(result["net"], "87.50")
        self.assertEqual(result["expensesByCategory"], {"Saúde": "12.50"})
        self.assertFalse(result["isForecast"])

    def test_empty_request_returns_zero_totals(self):
        result = summarize(SummaryRequest(transactions=[]))
        self.assertEqual(result["incomeTotal"], "0")
        self.assertEqual(result["expenseTotal"], "0")
        self.assertEqual(result["net"], "0")


if __name__ == "__main__":
    unittest.main()
