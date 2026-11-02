import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, map, of, switchMap, tap } from 'rxjs';
import { AuthScreenComponent } from './auth/auth-screen.component';
import { FirebaseAuthService } from './core/firebase-auth.service';
import { TransactionsPageComponent } from './transactions/transactions-page.component';
import { FinancialTransaction, TransactionsApiService } from './transactions/transactions-api.service';
import { LandingPageComponent } from './landing/landing-page.component';
import { EmailActionComponent } from './auth/email-action.component';
import { BankingApiService, BankingStatus, BankConnection } from './banking/banking-api.service';
import { AssistantPageComponent } from './assistant/assistant-page.component';
import { BillingApiService, BillingCycle, PlanCode } from './billing/billing-api.service';

type NavItem = { label: string; icon: string };
type CategorySummary = { label: string; amount: number; share: number };

@Component({
  selector: 'app-root', standalone: true, imports: [CommonModule, AuthScreenComponent, TransactionsPageComponent, LandingPageComponent, EmailActionComponent, AssistantPageComponent],
  template: `
    <ng-container *ngIf="!isEmailAction; else emailAction">
    <ng-container *ngIf="(auth.user$ | async)?.emailVerified; else publicEntry">
    <div class="app-shell">
      <aside class="sidebar" [class.open]="menuOpen">
        <a class="brand" href="#inicio" aria-label="Lucena Finance início"><img class="brand-symbol" src="/assets/brand/lucena-finance-mark.png" alt=""><span class="brand-wordmark"><strong>LUCENA</strong><small>FINANCE</small></span></a>
        <div class="workspace-label">SEU ESPAÇO</div>
        <nav aria-label="Navegação principal">
          <button *ngFor="let item of mainNav" class="nav-item" [class.active]="activeSection === item.label" (click)="navigate(item.label)"><span class="nav-icon">{{ item.icon }}</span>{{ item.label }}</button>
        </nav>
        <div class="workspace-label second-label">PLANEJAMENTO</div>
        <nav aria-label="Planejamento">
          <button *ngFor="let item of planNav" class="nav-item" [class.active]="activeSection === item.label" (click)="navigate(item.label)"><span class="nav-icon">{{ item.icon }}</span>{{ item.label }}</button>
        </nav>
        <div class="sidebar-bottom"><div class="help-card"><div class="help-orb">✦</div><strong>Seu dinheiro,<br>com mais clareza.</strong><p>Conecte suas contas para começar a enxergar o todo.</p><button (click)="openConnect()">Conectar conta <span>↗</span></button></div><button class="nav-item settings" (click)="navigate('Configurações')"><span class="nav-icon">⚙</span>Configurações</button><div class="profile"><div class="avatar">LF</div><div><strong>{{ (auth.user$ | async)?.displayName || 'Meu espaço' }}</strong><small>{{ billingPlanName }} · {{ billingAgentLimit }} agentes</small></div><button class="logout-button" aria-label="Sair da conta" title="Sair" (click)="logout()">↗</button></div></div>
      </aside>

      <main class="main-area" id="inicio">
        <header class="topbar"><button class="mobile-menu" aria-label="Abrir menu" (click)="menuOpen = !menuOpen">☰</button><div class="breadcrumb">Visão geral <span>/</span> <strong>{{ activeSection }}</strong></div><div class="top-actions"><button class="icon-button" aria-label="Notificações" (click)="showNotice('Você está em dia. Novos alertas aparecerão aqui.')">♧<i></i></button><button class="icon-button theme-button" aria-label="Alternar tema" (click)="toggleTheme()">{{ darkMode ? '☼' : '◐' }}</button><div class="top-avatar">LF</div></div></header>

        <section class="content" *ngIf="activeSection === 'Visão geral'; else sectionPage">
          <div class="welcome-row"><div><div class="eyebrow"><span class="live-dot"></span> SEU PAINEL FINANCEIRO</div><h1>Bom dia<span class="comma">,</span> <span class="name">vamos começar.</span></h1><p class="subheading">Uma visão tranquila para decisões melhores.</p></div><div class="date-pill"><span>◷</span> {{ today | date:'EEEE, d MMMM':'':'pt-BR' }}</div></div>
          <div class="connect-banner" *ngIf="bannerVisible"><div class="banner-icon">⌁</div><div class="banner-copy"><strong>Seu panorama financeiro começa aqui</strong><span>Conecte uma instituição para trazer seus dados com segurança. Você controla cada consentimento.</span></div><button class="primary-button" (click)="openConnect()">Conectar instituição <span>↗</span></button><button class="dismiss" aria-label="Fechar aviso" (click)="bannerVisible = false">×</button></div>
          <div class="section-heading"><div><h2>Seu resumo</h2><span class="muted">Seus números em um só lugar</span></div><button class="period-select" (click)="showNotice('Filtros de período serão habilitados junto com os gráficos financeiros.')">Este mês <span>⌄</span></button></div>
          <div class="metrics-grid">
            <article class="metric-card balance-card"><div class="metric-top"><span>Saldo total</span><span class="metric-icon violet">◉</span></div><div class="metric-value muted-value">—</div><div class="metric-foot"><span class="empty-dot"></span> Conecte uma conta para ver seu saldo</div><div class="balance-spark"><svg viewBox="0 0 360 52" preserveAspectRatio="none" aria-hidden="true"><path d="M0 39 C25 37 28 19 51 26 S83 41 104 25 S143 12 161 23 S191 36 217 18 S256 12 274 22 S315 36 338 16 S350 16 360 10" fill="none" stroke="#a899ff" stroke-width="2"/></svg></div></article>
            <article class="metric-card"><div class="metric-top"><span>Receitas</span><span class="metric-icon green">↙</span></div><div class="metric-value" [class.muted-value]="dashboardLoading || dashboardError">{{ dashboardAmount('INCOME') }}</div><div class="metric-foot"><span class="metric-caption">Neste mês, com os dados carregados</span></div><div class="mini-bars green-bars"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></article>
            <article class="metric-card"><div class="metric-top"><span>Despesas</span><span class="metric-icon rose">↗</span></div><div class="metric-value" [class.muted-value]="dashboardLoading || dashboardError">{{ dashboardAmount('EXPENSE') }}</div><div class="metric-foot"><span class="metric-caption">Neste mês, com os dados carregados</span></div><div class="mini-bars rose-bars"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></article>
            <article class="metric-card"><div class="metric-top"><span>Investimentos</span><span class="metric-icon blue">✳</span></div><div class="metric-value muted-value">—</div><div class="metric-foot"><span class="metric-caption">Patrimônio investido</span></div><div class="investment-line"><span>Dados ainda não disponíveis</span><span>···</span></div></article>
          </div>

          <div class="dashboard-grid"><article class="panel cashflow-panel"><div class="panel-heading"><div><h2>Fluxo financeiro</h2><span class="muted">Receitas e despesas ao longo do tempo</span></div><button class="select-small" (click)="showNotice('O gráfico será preenchido com o histórico de transações salvo no extrato.')">Histórico <span>⌄</span></button></div><div class="chart-empty"><div class="chart-field"><div class="grid-lines"><i></i><i></i><i></i><i></i><i></i></div><div class="chart-placeholder"><div class="chart-placeholder-icon">⌁</div><strong>O gráfico ainda não está disponível</strong><span>Ele será calculado com o histórico real de movimentações da sua conta.</span><button (click)="navigate('Extrato')">Abrir extrato <span>→</span></button></div></div></div><div class="chart-legend"><span><i class="legend-dot income"></i>Receitas</span><span><i class="legend-dot expense"></i>Despesas</span></div></article>
            <article class="panel category-panel"><div class="panel-heading"><div><h2>Despesas por categoria</h2><span class="muted">Distribuição deste mês nos dados carregados</span></div></div><div class="donut-wrap" *ngIf="expenseCategories.length > 0"><div class="donut" [style.background]="categoryGradient()"><div class="donut-center"><strong>{{ monthExpenseTotal | currency:'BRL':'symbol':'1.0-0':'pt-BR' }}</strong><span>Total listado</span></div></div></div><div class="category-empty" *ngIf="dashboardLoading">Carregando as movimentações…</div><div class="category-empty" *ngIf="!dashboardLoading && dashboardError">Não foi possível consultar as despesas.</div><div class="category-empty" *ngIf="!dashboardLoading && !dashboardError && expenseCategories.length === 0">Nenhuma despesa cadastrada neste mês.</div><div class="category-legend" *ngIf="expenseCategories.length > 0"><div *ngFor="let category of expenseCategories; let i = index"><i [style.backgroundColor]="categoryColor(i)"></i><span>{{ category.label }}</span><strong>{{ category.share | number:'1.0-0' }}%</strong></div></div><button class="text-button" (click)="navigate('Categorias')">Ver categorias <span>→</span></button></article></div>

          <div class="bottom-grid"><article class="panel transactions-panel"><div class="panel-heading"><div><h2>Movimentações recentes</h2><span class="muted">Acompanhe o que acontece nas suas contas</span></div><button class="text-button view-all" (click)="navigate('Extrato')">Ver extrato <span>→</span></button></div><div class="transactions-empty" *ngIf="dashboardLoading"><strong>Carregando seu extrato…</strong></div><div class="transactions-empty" *ngIf="!dashboardLoading && dashboardError"><strong>Não foi possível carregar</strong><span>Confira sua conexão e tente novamente.</span><button class="text-button" (click)="reloadDashboard()">Tentar novamente ↻</button></div><div class="transactions-empty" *ngIf="!dashboardLoading && !dashboardError && dashboardTransactions.length === 0"><div class="empty-stack"><span>↙</span><span>↗</span><span>⌁</span></div><strong>Nenhuma movimentação ainda</strong><span>Adicione um lançamento manual ou conecte uma instituição.</span></div><div class="recent-list" *ngIf="!dashboardLoading && !dashboardError && dashboardTransactions.length > 0"><div class="recent-row" *ngFor="let transaction of dashboardTransactions.slice(0, 3)"><span class="recent-icon" [class.recent-income]="transaction.kind === 'INCOME'">{{ transaction.kind === 'INCOME' ? '↙' : '↗' }}</span><span class="recent-name"><strong>{{ transaction.description }}</strong><small>{{ transaction.categoryId }} · {{ transaction.occurredAt | date:'dd/MM':'':'pt-BR' }}</small></span><strong class="recent-amount" [class.recent-positive]="transaction.kind === 'INCOME'">{{ transaction.kind === 'INCOME' ? '+' : '−' }} {{ transaction.amountMinor / 100 | currency:transaction.currency:'symbol':'1.2-2':'pt-BR' }}</strong></div></div></article><article class="panel insight-panel"><div class="insight-head"><div class="sparkle">✦</div><span>LUCENA INSIGHTS</span><span class="soon">EM BREVE</span></div><h3>Clareza que vira<br><em>bons hábitos.</em></h3><p>Insights personalizados sobre sua vida financeira, com base nos seus próprios dados.</p><button (click)="showNotice('O assistente estará disponível quando houver dados financeiros conectados.')">Conhecer o assistente <span>→</span></button><div class="insight-shape"></div></article></div>
          <footer class="page-footer"><span class="app-footer-brand"><img src="/assets/brand/lucena-finance-mark.png" alt=""><strong>LUCENA</strong><span class="footer-dot">·</span> Seus dados, suas escolhas.</span><span>Ambiente de desenvolvimento</span></footer>
        </section>
        <ng-template #sectionPage>
          <app-transactions-page *ngIf="activeSection === 'Extrato'; else assistantOrPlaceholder"></app-transactions-page>
          <ng-template #assistantOrPlaceholder><app-assistant-page *ngIf="activeSection === 'Assistente IA'; else plansOrPlaceholder" (connect)="openConnect()"></app-assistant-page></ng-template>
          <ng-template #plansOrPlaceholder><app-landing-page *ngIf="activeSection === 'Planos'; else placeholderPage" (register)="showNotice('Sua conta já está ativa. Escolha Bronze ou Ouro para alterar o plano.')" (login)="showNotice('Você já está conectado à sua conta.')" (choosePlan)="startPlanCheckout($event)"></app-landing-page></ng-template>
          <ng-template #placeholderPage><section class="content section-placeholder"><div class="eyebrow"><span class="live-dot"></span> LUCENA FINANCE</div><h1>{{ activeSection }}</h1><p class="subheading">Este módulo fica disponível após conectar suas fontes financeiras.</p><div class="placeholder-panel"><div class="placeholder-glyph">{{ activeIcon }}</div><h2>Seu espaço de {{ activeSection.toLowerCase() }}</h2><p>Conecte uma instituição ou adicione seus primeiros dados para começar. Nenhuma informação bancária é exibida sem autorização.</p><button class="primary-button" (click)="openConnect()">Conectar instituição <span>↗</span></button></div></section></ng-template>
        </ng-template>
      </main>

      <div class="toast" *ngIf="toastMessage" role="status">{{ toastMessage }}<button (click)="toastMessage = ''">×</button></div>
      <div class="modal-backdrop" *ngIf="connectOpen" (click)="connectOpen = false"><section class="connect-modal" role="dialog" aria-modal="true" aria-labelledby="connect-title" (click)="$event.stopPropagation()"><button class="modal-close" aria-label="Fechar" (click)="connectOpen = false">×</button><div class="modal-mark">⌁</div><div class="eyebrow">OPEN FINANCE</div><h2 id="connect-title">Conecte suas instituições</h2><p>Autorize o compartilhamento no seu banco. A Lucena nunca recebe sua senha bancária.</p><div class="provider-state" *ngIf="bankStatusLoading"><span class="status-ring">…</span><div><strong>Verificando conexão segura</strong><span>Consultando a disponibilidade do provedor.</span></div></div><div class="provider-state" *ngIf="!bankStatusLoading && bankStatus"><span class="status-ring" [class.ready-ring]="bankStatus.configured">{{ bankStatus.configured ? '✓' : '!' }}</span><div><strong>{{ bankStatus.configured ? (bankStatus.includeSandbox ? 'Pluggy Sandbox ativo' : 'Open Finance pronto') : 'Integração ainda não configurada' }}</strong><span>{{ bankStatus.message }}</span></div></div><div class="connected-list" *ngIf="bankConnections.length"><div class="connected-title">SUAS CONEXÕES</div><div class="connected-row" *ngFor="let connection of bankConnections"><span class="connected-bank-icon">⌂</span><div><strong>{{ connection.institution }} <em *ngIf="connection.sandbox">SANDBOX</em></strong><small>{{ connection.sandbox ? 'Dados de teste' : (connection.lastSyncedAt ? ('Sincronizado em ' + (connection.lastSyncedAt | date:'dd/MM HH:mm':'':'pt-BR')) : connection.status) }}</small></div><button type="button" (click)="syncBankConnection(connection)" [disabled]="syncingItem === connection.itemId" [attr.aria-label]="'Sincronizar ' + connection.institution">{{ syncingItem === connection.itemId ? '…' : '↻' }}</button><button type="button" class="disconnect-button" (click)="disconnectBankConnection(connection)" [disabled]="syncingItem === connection.itemId" [attr.aria-label]="'Desconectar ' + connection.institution">×</button></div></div><div class="security-note"><span>♢</span> Você aprova no app/site da instituição e pode revogar o consentimento.</div><button class="primary-button full-button" [disabled]="bankConnecting || !bankStatus?.connectionCreationAvailable" (click)="startBankConnection()">{{ bankConnecting ? 'Preparando conexão…' : bankStatus?.includeSandbox ? 'Testar conexão sandbox' : 'Conectar banco' }} <span>↗</span></button><button class="text-button connect-close" (click)="connectOpen = false">Agora não</button></section></div>
    </div>
    </ng-container>
    <ng-template #publicEntry>
      <ng-container *ngIf="auth.user$ | async as currentUser; else signedOut"><app-auth-screen [user]="currentUser"></app-auth-screen></ng-container>
      <ng-template #signedOut>
        <app-auth-screen *ngIf="authMode; else landing" [initialMode]="authMode" (close)="authMode = null"></app-auth-screen>
        <ng-template #landing><app-landing-page (register)="authMode = 'register'" (login)="authMode = 'login'" (choosePlan)="startPlanCheckout($event)"></app-landing-page></ng-template>
      </ng-template>
    </ng-template>
    </ng-container>
    <ng-template #emailAction><app-email-action></app-email-action></ng-template>
  `,
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  readonly auth = inject(FirebaseAuthService);
  private readonly transactionsApi = inject(TransactionsApiService);
  private readonly bankingApi = inject(BankingApiService);
  private readonly billingApi = inject(BillingApiService);
  private readonly destroyRef = inject(DestroyRef);
  dashboardTransactions: FinancialTransaction[] = [];
  dashboardLoading = false;
  dashboardError = false;
  readonly today = new Date();
  readonly mainNav: NavItem[] = [{ label: 'Visão geral', icon: '◫' }, { label: 'Extrato', icon: '↕' }, { label: 'Contas e cartões', icon: '▣' }, { label: 'Categorias', icon: '◉' }, { label: 'Investimentos', icon: '⌁' }];
  readonly planNav: NavItem[] = [{ label: 'Orçamentos', icon: '▤' }, { label: 'Metas', icon: '◎' }, { label: 'Relatórios', icon: '▥' }, { label: 'Assistente IA', icon: '✦' }, { label: 'Planos', icon: '◇' }];
  activeSection = 'Visão geral';
  activeIcon = '◫';
  menuOpen = false;
  darkMode = true;
  bannerVisible = true;
  connectOpen = false;
  toastMessage = '';
  authMode: 'login' | 'register' | 'reset' | null = null;
  private pendingPlan: { plan: Exclude<PlanCode, 'GRATUITO'>; cycle: BillingCycle } | null = null;
  private checkoutInProgress = false;
  bankStatus: BankingStatus | null = null;
  bankConnections: BankConnection[] = [];
  bankStatusLoading = false;
  bankConnecting = false;
  syncingItem = '';
  readonly isEmailAction = window.location.pathname === '/auth/action';
  ngOnInit(): void {
    document.body.classList.add('dark-theme');
    try {
      const savedPlan = JSON.parse(sessionStorage.getItem('lucena.pending-plan') ?? 'null') as { plan?: string; cycle?: string } | null;
      if (savedPlan?.plan && ['BRONZE', 'OURO'].includes(savedPlan.plan) && savedPlan.cycle && ['MONTHLY', 'YEARLY'].includes(savedPlan.cycle)) {
        this.pendingPlan = { plan: savedPlan.plan as Exclude<PlanCode, 'GRATUITO'>, cycle: savedPlan.cycle as BillingCycle };
      }
    } catch { sessionStorage.removeItem('lucena.pending-plan'); }
    if (new URLSearchParams(window.location.search).get('auth') === 'reset') this.authMode = 'reset';
    this.auth.user$.pipe(
      tap((user) => {
        if (user?.emailVerified) this.refreshCurrentPlan();
        else { this.billingPlanName = 'Gratuito'; this.billingAgentLimit = 2; }
        if (user?.emailVerified && this.pendingPlan && !this.checkoutInProgress) {
          const plan = this.pendingPlan;
          this.pendingPlan = null;
          this.createPlanCheckout(plan.plan, plan.cycle);
        }
      }),
      switchMap((user) => {
        if (!user?.emailVerified) {
          this.dashboardLoading = false;
          this.dashboardError = false;
          this.dashboardTransactions = [];
          return of([] as FinancialTransaction[]);
        }
        this.dashboardLoading = true;
        this.dashboardError = false;
        return this.transactionsApi.list().pipe(
          map((transactions) => { this.dashboardTransactions = transactions; return transactions; }),
          catchError(() => { this.dashboardError = true; this.dashboardTransactions = []; return of([] as FinancialTransaction[]); }),
          finalize(() => this.dashboardLoading = false),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }
  startPlanCheckout(selection: { plan: Exclude<PlanCode, 'GRATUITO'>; cycle: BillingCycle }): void {
    const user = this.auth.currentUser;
    if (!user) {
      this.pendingPlan = selection;
      sessionStorage.setItem('lucena.pending-plan', JSON.stringify(selection));
      this.authMode = 'register';
      return;
    }
    if (!user.emailVerified) {
      this.pendingPlan = selection;
      sessionStorage.setItem('lucena.pending-plan', JSON.stringify(selection));
      this.showNotice('Confirme seu e-mail para continuar com a contratação. Depois, entre na sua conta para retomar.');
      return;
    }
    this.createPlanCheckout(selection.plan, selection.cycle);
  }
  private createPlanCheckout(plan: Exclude<PlanCode, 'GRATUITO'>, cycle: BillingCycle): void {
    sessionStorage.removeItem('lucena.pending-plan');
    this.checkoutInProgress = true;
    this.billingApi.checkout(plan, cycle).pipe(finalize(() => this.checkoutInProgress = false)).subscribe({
      next: ({ checkoutUrl }) => window.location.assign(checkoutUrl),
      error: (error) => this.showNotice(error.status === 503
        ? 'A contratação ficará disponível assim que as credenciais de produção da Asaas e o webhook estiverem configurados.'
        : 'Não foi possível iniciar o checkout da Asaas. Tente novamente em instantes.'),
    });
  }
  billingPlanName = 'Gratuito';
  billingAgentLimit = 2;
  private refreshCurrentPlan(): void {
    this.billingApi.current().subscribe({ next: (plan) => {
      this.billingPlanName = typeof plan['name'] === 'string' ? plan['name'] : 'Gratuito';
      this.billingAgentLimit = typeof plan['agents'] === 'number' ? plan['agents'] : 2;
    }, error: () => { this.billingPlanName = 'Gratuito'; this.billingAgentLimit = 2; } });
  }
  dashboardAmount(kind: 'INCOME' | 'EXPENSE'): string {
    if (this.dashboardLoading) return 'Carregando…';
    if (this.dashboardError) return 'Indisponível';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(this.monthTotal(kind));
  }
  get monthExpenseTotal(): number { return this.monthTotal('EXPENSE'); }
  get expenseCategories(): CategorySummary[] {
    const sums = new Map<string, number>();
    const now = new Date();
    for (const transaction of this.dashboardTransactions) {
      const date = new Date(transaction.occurredAt);
      if (transaction.kind === 'EXPENSE' && transaction.currency === 'BRL' && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
        sums.set(transaction.categoryId, (sums.get(transaction.categoryId) ?? 0) + transaction.amountMinor / 100);
      }
    }
    const ranked = [...sums.entries()].sort((a, b) => b[1] - a[1]);
    const top = ranked.slice(0, 3);
    const other = ranked.slice(3).reduce((sum, [, amount]) => sum + amount, 0);
    if (other > 0) top.push(['Outras', other]);
    const total = ranked.reduce((sum, [, amount]) => sum + amount, 0);
    return top.map(([label, amount]) => ({ label, amount, share: total ? amount / total * 100 : 0 }));
  }
  categoryColor(index: number): string { return ['#7063dc', '#57b992', '#efa86a', '#9ea4b8'][index] ?? '#9ea4b8'; }
  categoryGradient(): string {
    let end = 0;
    const stops = this.expenseCategories.map((category, index) => {
      const start = end;
      end += category.share;
      return `${this.categoryColor(index)} ${start}% ${end}%`;
    });
    return `conic-gradient(${stops.join(', ')})`;
  }
  private monthTotal(kind: 'INCOME' | 'EXPENSE'): number {
    const now = new Date();
    return this.dashboardTransactions.reduce((total, transaction) => {
      const date = new Date(transaction.occurredAt);
      return transaction.kind === kind && transaction.currency === 'BRL' && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
        ? total + transaction.amountMinor / 100 : total;
    }, 0);
  }
  reloadDashboard(): void {
    this.dashboardLoading = true;
    this.dashboardError = false;
    this.transactionsApi.list().pipe(finalize(() => this.dashboardLoading = false)).subscribe({
      next: (items) => { this.dashboardTransactions = items; },
      error: () => { this.dashboardError = true; this.dashboardTransactions = []; },
    });
  }
  navigate(label: string): void { this.activeSection = label; this.menuOpen = false; this.activeIcon = [...this.mainNav, ...this.planNav].find((x) => x.label === label)?.icon ?? '⚙'; }
  openConnect(): void {
    this.connectOpen = true;
    this.bankStatusLoading = true;
    this.bankingApi.status().subscribe({ next: (status) => { this.bankStatus = status; this.bankStatusLoading = false; }, error: () => { this.bankStatus = null; this.bankStatusLoading = false; this.showNotice('Não foi possível consultar o provedor Open Finance.'); } });
    this.bankingApi.connections().subscribe({ next: (items) => this.bankConnections = items, error: () => this.bankConnections = [] });
  }
  startBankConnection(): void {
    if (this.bankConnecting) return;
    this.bankConnecting = true;
    this.bankingApi.connectToken().pipe(finalize(() => this.bankConnecting = false)).subscribe({
      next: (token) => {
        try {
          this.bankingApi.openWidget(token.accessToken, this.bankStatus?.includeSandbox ?? false,
            (itemId) => this.bankingApi.saveConnection(itemId).subscribe({
              next: (connection) => { this.bankConnections = [...this.bankConnections.filter((item) => item.itemId !== connection.itemId), connection]; this.reloadDashboard(); this.showNotice(`${connection.institution} conectada. ${connection.newTransactionsImported} novas movimentações importadas.`); },
              error: () => this.showNotice('A instituição respondeu, mas não foi possível importar as movimentações. Tente sincronizar em instantes.'),
            }),
            () => this.showNotice('Não foi possível concluir a conexão. Você pode tentar novamente.'),
            () => {});
        } catch { this.showNotice('Não foi possível carregar o componente seguro da Pluggy. Atualize a página e tente novamente.'); }
      },
      error: (error) => this.showNotice(error.status === 503 ? 'Configure as credenciais Pluggy no servidor para ativar o Open Finance.' : 'Não foi possível iniciar a conexão com o provedor.'),
    });
  }
  syncBankConnection(connection: BankConnection): void {
    this.syncingItem = connection.itemId;
    this.bankingApi.sync(connection.itemId).pipe(finalize(() => this.syncingItem = '')).subscribe({
      next: (result) => { this.bankConnections = this.bankConnections.map((item) => item.itemId === result.itemId ? result : item); this.reloadDashboard(); this.showNotice(`${result.newTransactionsImported} novas movimentações sincronizadas.`); },
      error: () => this.showNotice('Não foi possível sincronizar esta conexão agora.'),
    });
  }
  disconnectBankConnection(connection: BankConnection): void {
    if (!window.confirm(`Desconectar ${connection.institution}? As movimentações importadas desta conexão também serão removidas do extrato.`)) return;
    this.syncingItem = connection.itemId;
    this.bankingApi.disconnect(connection.itemId).pipe(finalize(() => this.syncingItem = '')).subscribe({
      next: () => { this.bankConnections = this.bankConnections.filter((item) => item.itemId !== connection.itemId); this.reloadDashboard(); this.showNotice(`${connection.institution} desconectada e dados importados removidos.`); },
      error: () => this.showNotice('Não foi possível revogar esta conexão. Tente novamente.'),
    });
  }
  showNotice(message: string): void { this.toastMessage = message; window.setTimeout(() => this.toastMessage = '', 4200); }
  toggleTheme(): void { this.darkMode = !this.darkMode; document.body.classList.toggle('dark-theme', this.darkMode); }
  async logout(): Promise<void> { await this.auth.logout(); }
}
