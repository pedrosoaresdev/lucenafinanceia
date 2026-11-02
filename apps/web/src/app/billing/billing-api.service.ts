import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type PlanCode = 'GRATUITO' | 'BRONZE' | 'OURO';
export type BillingCycle = 'MONTHLY' | 'YEARLY';
export interface PlanInfo { code: PlanCode; name: string; agents: number; monthlyMinor: number; annualMinor?: number; annualSavingsMinor?: number; }
export interface PlanCatalog { provider: string; configured: boolean; currency: string; plans: PlanInfo[]; }

@Injectable({ providedIn: 'root' })
export class BillingApiService {
  constructor(private readonly http: HttpClient) {}
  plans(): Observable<PlanCatalog> { return this.http.get<PlanCatalog>('/api/v1/billing/plans'); }
  checkout(plan: Exclude<PlanCode, 'GRATUITO'>, cycle: BillingCycle): Observable<{ checkoutUrl: string; checkoutId: string; state: string }> {
    return this.http.post<{ checkoutUrl: string; checkoutId: string; state: string }>('/api/v1/billing/checkout', { plan, cycle });
  }
  current(): Observable<Record<string, unknown>> { return this.http.get<Record<string, unknown>>('/api/v1/billing/me'); }
}
