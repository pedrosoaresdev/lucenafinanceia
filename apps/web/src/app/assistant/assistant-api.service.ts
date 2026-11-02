import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface AssistantMessage { role: 'user' | 'assistant'; content: string; }
export interface AssistantAnswer { answer: string; source: string; transactionsConsidered: number; }
export interface AssistantStatus { configured: boolean; provider: string; model: string; }
export interface AssistantAgent { id: string; name: string; role: string; instruction: string; }
export interface AssistantAgentCatalog { plan: string; limit: number; agents: AssistantAgent[]; }

@Injectable({ providedIn: 'root' })
export class AssistantApiService {
  private readonly http = inject(HttpClient);
  status(): Observable<AssistantStatus> { return this.http.get<AssistantStatus>('/api/v1/assistant/status'); }
  agents(): Observable<AssistantAgentCatalog> { return this.http.get<AssistantAgentCatalog>('/api/v1/assistant/agents'); }
  send(question: string, history: AssistantMessage[], agentId: string): Observable<AssistantAnswer> {
    return this.http.post<AssistantAnswer>('/api/v1/assistant/chat', { question, history: history.slice(-10), agentId });
  }
}
