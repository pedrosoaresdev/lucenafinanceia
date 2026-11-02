import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { AssistantAgent, AssistantApiService, AssistantMessage, AssistantStatus } from './assistant-api.service';
import { FirebaseAuthService } from '../core/firebase-auth.service';

@Component({
  selector: 'app-assistant-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrl: './assistant-page.css',
  template: `
    <main class="assistant-page">
      <header class="assistant-header"><div><div class="assistant-overline"><span class="assistant-sparkle">✦</span> LUCENA INTELLIGENCE</div><span class="assistant-caption">Seu dinheiro, explicado com clareza.</span></div><div class="assistant-tools"><label class="agent-select-label">SEU AGENTE<span class="agent-picker"><img class="selected-agent-image" [src]="agentImage(selectedAgentId)" [alt]="selectedAgentName"><select aria-label="Escolha seu agente financeiro" [(ngModel)]="selectedAgentId" name="agent"><option *ngFor="let agent of agents" [value]="agent.id">{{ agent.name }} · {{ agent.role }}</option></select></span></label><div class="ai-status" [class.ai-ready]="status?.configured"><i></i>{{ status?.configured ? 'IA conectada' : statusLoading ? 'Conectando IA…' : 'IA aguardando configuração' }}</div></div></header>
      <section class="chat-stage" [class.has-messages]="messages.length > 0" aria-label="Conversa com o assistente financeiro">
        <div class="welcome" *ngIf="messages.length === 0"><div class="welcome-mark"><img [src]="agentImage(selectedAgentId)" [alt]="selectedAgentName"></div><p class="welcome-label">Olá{{ firstName ? ', ' + firstName : '' }},</p><h1>Como posso te ajudar<br><span>com seu dinheiro?</span></h1><p class="welcome-subtitle">Pergunte sobre seus gastos, receitas ou hábitos. As respostas usam os lançamentos da sua conta.</p></div>
        <div class="message-list" #messageList *ngIf="messages.length > 0"><article class="chat-message" *ngFor="let message of messages" [class.from-user]="message.role === 'user'"><div class="message-avatar" [class.agent-message-avatar]="message.role !== 'user'"><ng-container *ngIf="message.role === 'user'; else assistantMascot">{{ userInitials }}</ng-container><ng-template #assistantMascot><img [src]="agentImage(selectedAgentId)" [alt]="selectedAgentName"></ng-template></div><div class="message-content"><span class="message-author">{{ message.role === 'user' ? 'Você' : selectedAgentName }}</span><p>{{ message.content }}</p></div></article><article class="chat-message" *ngIf="busy"><div class="message-avatar agent-message-avatar"><img [src]="agentImage(selectedAgentId)" [alt]="selectedAgentName"></div><div class="typing"><i></i><i></i><i></i></div></article></div>
      </section>
      <section class="chat-controls"><div class="prompt-row" *ngIf="messages.length === 0"><button class="prompt-chip" (click)="ask('Quanto gastei este mês?')"><span>↗</span> Quanto gastei este mês?</button><button class="prompt-chip" (click)="ask('Qual categoria teve mais despesas nos últimos 3 meses?')"><span>◉</span> Onde gasto mais?</button><button class="prompt-chip" (click)="ask('Quais são minhas despesas recorrentes?')"><span>↻</span> Gastos recorrentes</button><button class="prompt-chip" (click)="ask('Quanto gastei com cartão de crédito?')"><span>▣</span> Gastos com cartão</button></div>
        <div class="account-actions" *ngIf="messages.length === 0"><button class="account-chip" (click)="connect.emit()"><span>⌁</span> Contas conectadas <b>↗</b></button><span>Conecte um banco para perguntar sobre seus dados reais.</span></div>
        <form class="composer" (ngSubmit)="send()"><textarea name="question" [(ngModel)]="question" maxlength="800" rows="1" placeholder="Converse com a Lucena" aria-label="Escreva sua pergunta" (keydown.enter)="onEnter($event)" [disabled]="busy"></textarea><div class="composer-bottom"><span class="composer-note">✦ Respostas com base nos seus lançamentos</span><button type="submit" aria-label="Enviar mensagem" [disabled]="busy || !question.trim()">{{ busy ? '…' : '↑' }}</button></div></form>
        <p class="privacy-copy">Sua pergunta e os lançamentos usados na resposta serão enviados à OpenAI. <a href="#privacidade" (click)="$event.preventDefault(); privacyNotice = !privacyNotice">Saiba mais</a></p><p class="privacy-details" *ngIf="privacyNotice">A chave fica no servidor. Enviamos até 2.000 lançamentos recentes por solicitação, com armazenamento de resposta desativado. A conversa não é gravada no banco da Lucena. O processamento segue os controles de dados da API da OpenAI. Você pode usar o extrato sem conversar com a IA.</p>
        <p class="setup-note" *ngIf="!statusLoading && status && !status.configured">Para ativar o chat, configure <code>OPENAI_API_KEY</code> no arquivo .env do projeto e reinicie a API.</p>
      </section>
    </main>
  `,
})
export class AssistantPageComponent {
  @Output() connect = new EventEmitter<void>();
  private readonly api = inject(AssistantApiService);
  private readonly auth = inject(FirebaseAuthService);
  get firstName(): string { return this.auth.currentUser?.displayName?.trim().split(/\s+/)[0] ?? ''; }
  get userInitials(): string { return (this.firstName.slice(0, 1) || 'L').toUpperCase(); }
  get selectedAgentName(): string { return this.agents.find(agent => agent.id === this.selectedAgentId)?.name ?? 'Assistente Lucena'; }
  agentImage(agentId: string): string { return `/assets/mascotes/${agentId || 'arara-azul'}.png`; }
  messages: AssistantMessage[] = [];
  question = '';
  busy = false;
  status: AssistantStatus | null = null;
  agents: AssistantAgent[] = [];
  selectedAgentId = '';
  statusLoading = true;
  privacyNotice = false;

  constructor() {
    this.api.status().pipe(finalize(() => this.statusLoading = false)).subscribe({ next: (status) => this.status = status, error: () => this.status = null });
    this.api.agents().subscribe({ next: result => { this.agents = result.agents; this.selectedAgentId = this.agents[0]?.id ?? ''; }, error: () => this.agents = [] });
  }

  ask(prompt: string): void { this.question = prompt; this.send(); }
  onEnter(event: Event): void {
    const keyboard = event as KeyboardEvent;
    if (!keyboard.shiftKey) { keyboard.preventDefault(); this.send(); }
  }
  send(): void {
    const question = this.question.trim();
    if (!question || this.busy) return;
    const history = [...this.messages];
    this.messages = [...this.messages, { role: 'user', content: question }];
    this.question = '';
    this.busy = true;
    this.api.send(question, history, this.selectedAgentId).pipe(finalize(() => this.busy = false)).subscribe({
      next: (result) => this.messages = [...this.messages, { role: 'assistant', content: result.answer }],
      error: (error: HttpErrorResponse) => {
        const message = error.status === 403
          ? 'Este agente está disponível em um plano superior. Você pode conhecer as opções na área Planos.'
          : error.status === 503
          ? 'O assistente está pronto, mas falta configurar a chave da OpenAI no servidor. Seus dados financeiros continuam disponíveis no extrato.'
          : error.status === 502
            ? 'A OpenAI não respondeu agora. Tente novamente em instantes.'
            : 'Não consegui consultar seus dados nesta tentativa. Confira sua conexão e tente outra vez.';
        this.messages = [...this.messages, { role: 'assistant', content: message }];
      },
    });
  }
}
