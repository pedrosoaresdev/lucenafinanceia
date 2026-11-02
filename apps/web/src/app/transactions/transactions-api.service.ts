import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type TransactionKind = 'INCOME' | 'EXPENSE';

export interface FinancialTransaction {
  id: string;
  description: string;
  amountMinor: number;
  currency: string;
  kind: TransactionKind;
  categoryId: string;
  occurredAt: string;
  notes: string | null;
  source: string;
  createdAt: string;
}

export interface CreateTransactionRequest {
  description: string;
  amountMinor: number;
  currency: 'BRL';
  kind: TransactionKind;
  categoryId: string;
  occurredAt: string;
  notes: string | null;
}

@Injectable({ providedIn: 'root' })
export class TransactionsApiService {
  private readonly http = inject(HttpClient);

  list(): Observable<FinancialTransaction[]> {
    return this.http.get<FinancialTransaction[]>('/api/v1/transactions');
  }

  create(request: CreateTransactionRequest): Observable<FinancialTransaction> {
    return this.http.post<FinancialTransaction>('/api/v1/transactions', request);
  }
}
