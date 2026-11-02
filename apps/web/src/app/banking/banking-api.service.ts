import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface BankingStatus { provider: string; configured: boolean; connectionCreationAvailable: boolean; includeSandbox: boolean; message: string; }
export interface BankConnection { itemId: string; institution: string; status: string; sandbox: boolean; lastSyncedAt: string | null; newTransactionsImported: number; }
interface ConnectToken { provider: string; accessToken: string; theme: 'dark' | 'light'; }

interface PluggyWidget {
  init(): void;
}
interface PluggyWidgetOptions {
  connectToken: string;
  theme: 'dark' | 'light';
  includeSandbox: boolean;
  onSuccess: (data: { item: { id: string } }) => void | Promise<void>;
  onError: (error: { message?: string }) => void;
  onClose: () => void;
}
declare global { interface Window { PluggyConnect?: new (options: PluggyWidgetOptions) => PluggyWidget; } }

@Injectable({ providedIn: 'root' })
export class BankingApiService {
  private readonly http = inject(HttpClient);
  status(): Observable<BankingStatus> { return this.http.get<BankingStatus>('/api/v1/banking/status'); }
  connectToken(): Observable<ConnectToken> { return this.http.post<ConnectToken>('/api/v1/banking/connect-token', {}); }
  connections(): Observable<BankConnection[]> { return this.http.get<BankConnection[]>('/api/v1/banking/connections'); }
  saveConnection(itemId: string): Observable<BankConnection> { return this.http.post<BankConnection>('/api/v1/banking/connections', { itemId }); }
  sync(itemId: string): Observable<BankConnection> { return this.http.post<BankConnection>(`/api/v1/banking/connections/${encodeURIComponent(itemId)}/sync`, {}); }
  disconnect(itemId: string): Observable<void> { return this.http.delete<void>(`/api/v1/banking/connections/${encodeURIComponent(itemId)}`); }

  openWidget(token: string, includeSandbox: boolean, onSuccess: (itemId: string) => void, onError: () => void, onClose: () => void): void {
    if (!window.PluggyConnect) throw new Error('pluggy-widget-not-loaded');
    new window.PluggyConnect({
      connectToken: token,
      theme: 'dark',
      includeSandbox,
      onSuccess: (data) => onSuccess(data.item.id),
      onError,
      onClose,
    }).init();
  }
}
