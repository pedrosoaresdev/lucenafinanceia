import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { FinancialTransaction, TransactionKind, TransactionsApiService } from './transactions-api.service';

@Component({
  selector: 'app-transactions-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CurrencyPipe, DatePipe],
  template: `
    <section class="transactions-page">
      <div class="page-heading">
        <div>
          <div class="eyebrow"><span class="live-dot"></span> MOVIMENTAÇÕES DA SUA CONTA</div>
          <h1>Extrato</h1>
          <p class="subheading">Consulte e registre lançamentos manuais. Seus dados ficam associados à sua conta.</p>
        </div>
        <button class="primary-button" type="button" (click)="formOpen = !formOpen">
          {{ formOpen ? 'Fechar formulário' : 'Adicionar lançamento' }} <span>{{ formOpen ? '×' : '+' }}</span>
        </button>
      </div>

      <div class="notice error" *ngIf="errorMessage" role="alert">{{ errorMessage }}</div>
      <div class="notice success" *ngIf="successMessage" role="status">{{ successMessage }}</div>

      <section class="entry-card" *ngIf="formOpen" aria-labelledby="entry-title">
        <div class="card-heading">
          <div><h2 id="entry-title">Novo lançamento manual</h2><p>Valores bancários importados permanecem inalterados.</p></div>
        </div>
        <form [formGroup]="form" (ngSubmit)="save()" class="entry-form">
          <label class="field description-field">Descrição
            <input formControlName="description" maxlength="120" placeholder="Ex.: Conta de energia" autocomplete="off">
            <small *ngIf="form.controls.description.touched && form.controls.description.invalid">Informe uma descrição de até 120 caracteres.</small>
          </label>
          <label class="field">Tipo
            <select formControlName="kind"><option value="EXPENSE">Despesa</option><option value="INCOME">Receita</option></select>
          </label>
          <label class="field">Valor (R$)
            <input formControlName="amount" type="number" min="0.01" step="0.01" placeholder="0,00">
            <small *ngIf="form.controls.amount.touched && form.controls.amount.invalid">Informe um valor maior que zero.</small>
          </label>
          <label class="field">Categoria
            <select formControlName="categoryId"><option *ngFor="let category of categories" [value]="category">{{ category }}</option></select>
          </label>
          <label class="field">Data
            <input formControlName="date" type="date">
          </label>
          <label class="field notes-field">Observações
            <input formControlName="notes" maxlength="1000" placeholder="Opcional">
          </label>
          <div class="form-actions"><button class="secondary-button" type="button" (click)="formOpen = false">Cancelar</button><button class="primary-button" type="submit" [disabled]="saving">{{ saving ? 'Salvando…' : 'Salvar lançamento' }}</button></div>
        </form>
      </section>

      <div class="summary-grid">
        <article class="summary-card"><span>Receitas do mês</span><strong class="income">{{ monthIncome | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong></article>
        <article class="summary-card"><span>Despesas do mês</span><strong class="expense">{{ monthExpense | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong></article>
        <article class="summary-card"><span>Movimentações carregadas</span><strong>{{ transactions.length }}</strong></article>
      </div>

      <section class="list-card" aria-labelledby="list-title">
        <div class="list-heading">
          <div><h2 id="list-title">Todas as movimentações</h2><p>Até 200 lançamentos mais recentes</p></div>
          <div class="list-tools"><label class="search-box"><span aria-hidden="true">⌕</span><input [(ngModel)]="search" [ngModelOptions]="{standalone: true}" placeholder="Buscar descrição ou categoria" aria-label="Buscar no extrato"></label><select class="filter-control" [(ngModel)]="kindFilter" [ngModelOptions]="{standalone: true}" aria-label="Filtrar tipo"><option value="">Todos os tipos</option><option value="EXPENSE">Despesas</option><option value="INCOME">Receitas</option></select><select class="filter-control category-filter" [(ngModel)]="categoryFilter" [ngModelOptions]="{standalone: true}" aria-label="Filtrar categoria"><option value="">Todas as categorias</option><option *ngFor="let category of availableCategories" [value]="category">{{ category }}</option></select><label class="date-filter">De <input type="date" [(ngModel)]="fromDate" [ngModelOptions]="{standalone: true}" aria-label="Data inicial"></label><label class="date-filter">Até <input type="date" [(ngModel)]="toDate" [ngModelOptions]="{standalone: true}" aria-label="Data final"></label><button class="icon-refresh" type="button" (click)="load()" [disabled]="loading" aria-label="Atualizar extrato" title="Atualizar">↻</button></div>
        </div>

        <div class="loading-state" *ngIf="loading">Carregando movimentações…</div>
        <div class="empty-state" *ngIf="!loading && filteredTransactions.length === 0"><span class="empty-icon">↕</span><strong>{{ search ? 'Nenhum resultado encontrado' : 'Seu extrato ainda está vazio' }}</strong><span>{{ search ? 'Tente buscar por outro termo.' : 'Adicione um lançamento manual ou conecte uma instituição quando o provedor estiver configurado.' }}</span></div>

        <div class="table-wrap" *ngIf="!loading && filteredTransactions.length > 0">
          <table>
            <thead><tr><th>Descrição</th><th>Categoria</th><th>Data</th><th>Origem</th><th class="amount-cell">Valor</th></tr></thead>
            <tbody><tr *ngFor="let transaction of filteredTransactions; trackBy: trackById">
              <td><div class="transaction-name"><span class="kind-icon" [class.income-icon]="transaction.kind === 'INCOME'">{{ transaction.kind === 'INCOME' ? '↙' : '↗' }}</span><div><strong>{{ transaction.description }}</strong><small>{{ transaction.notes || (transaction.kind === 'INCOME' ? 'Receita' : 'Despesa') }}</small></div></div></td>
              <td><span class="category-pill">{{ transaction.categoryId }}</span></td>
              <td>{{ transaction.occurredAt | date:'dd/MM/yyyy':'':'pt-BR' }}</td>
              <td>{{ transaction.source === 'MANUAL' ? 'Manual' : transaction.source === 'OPEN_FINANCE_SANDBOX' ? 'Sandbox (teste)' : 'Open Finance' }}</td>
              <td class="amount-cell" [class.income]="transaction.kind === 'INCOME'" [class.expense]="transaction.kind === 'EXPENSE'">{{ transaction.kind === 'INCOME' ? '+' : '−' }} {{ transaction.amountMinor / 100 | currency:transaction.currency:'symbol':'1.2-2':'pt-BR' }}</td>
            </tr></tbody>
          </table>
        </div>
      </section>
      <p class="privacy-footnote">Os lançamentos manuais são separados dos registros importados. Nenhum dado fictício é exibido.</p>
    </section>
  `,
  styleUrl: './transactions-page.component.css',
})
export class TransactionsPageComponent implements OnInit {
  private readonly transactionsApi = inject(TransactionsApiService);
  private readonly fb = inject(FormBuilder);
  readonly categories = ['Alimentação', 'Moradia', 'Saúde', 'Transporte', 'Educação', 'Lazer', 'Pets', 'Renda', 'Finanças', 'Outros'];
  readonly form = this.fb.group({
    description: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(120)]),
    kind: this.fb.nonNullable.control<TransactionKind>('EXPENSE', Validators.required),
    amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    categoryId: this.fb.nonNullable.control('Alimentação', Validators.required),
    date: this.fb.nonNullable.control(this.localDate(), Validators.required),
    notes: this.fb.nonNullable.control('', Validators.maxLength(1000)),
  });

  transactions: FinancialTransaction[] = [];
  search = '';
  kindFilter: '' | TransactionKind = '';
  categoryFilter = '';
  fromDate = '';
  toDate = '';
  loading = true;
  saving = false;
  formOpen = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void { this.load(); }

  get filteredTransactions(): FinancialTransaction[] {
    const term = this.search.trim().toLocaleLowerCase('pt-BR');
    return this.transactions.filter((transaction) => {
      const date = transaction.occurredAt.slice(0, 10);
      return (!term || `${transaction.description} ${transaction.categoryId} ${transaction.notes ?? ''}`.toLocaleLowerCase('pt-BR').includes(term))
        && (!this.kindFilter || transaction.kind === this.kindFilter)
        && (!this.categoryFilter || transaction.categoryId === this.categoryFilter)
        && (!this.fromDate || date >= this.fromDate)
        && (!this.toDate || date <= this.toDate);
    });
  }

  get availableCategories(): string[] { return [...new Set(this.transactions.map((transaction) => transaction.categoryId))].sort((a, b) => a.localeCompare(b, 'pt-BR')); }

  get monthIncome(): number { return this.monthTotal('INCOME'); }
  get monthExpense(): number { return this.monthTotal('EXPENSE'); }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.transactionsApi.list().pipe(finalize(() => this.loading = false)).subscribe({
      next: (items) => this.transactions = items,
      error: (error: HttpErrorResponse) => this.errorMessage = this.apiError(error),
    });
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving) return;
    const value = this.form.getRawValue();
    const amountMinor = Math.round(Number(value.amount) * 100);
    if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) {
      this.errorMessage = 'Informe um valor válido.';
      return;
    }
    const occurredAt = new Date(`${value.date}T12:00:00`).toISOString();
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.transactionsApi.create({
      description: value.description?.trim(),
      amountMinor,
      currency: 'BRL',
      kind: value.kind,
      categoryId: value.categoryId,
      occurredAt,
      notes: value.notes?.trim() || null,
    }).pipe(finalize(() => this.saving = false)).subscribe({
      next: () => {
        this.successMessage = 'Lançamento salvo no seu extrato.';
        this.form.reset({ description: '', kind: 'EXPENSE', amount: null, categoryId: 'Alimentação', date: this.localDate(), notes: '' });
        this.formOpen = false;
        this.load();
      },
      error: (error: HttpErrorResponse) => this.errorMessage = this.apiError(error),
    });
  }

  trackById(_index: number, transaction: FinancialTransaction): string { return transaction.id; }

  private monthTotal(kind: TransactionKind): number {
    const now = new Date();
    return this.transactions.reduce((total, transaction) => {
      const occurredAt = new Date(transaction.occurredAt);
      return transaction.kind === kind && occurredAt.getMonth() === now.getMonth() && occurredAt.getFullYear() === now.getFullYear()
        ? total + transaction.amountMinor / 100 : total;
    }, 0);
  }

  private localDate(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  private apiError(error: HttpErrorResponse): string {
    if (error.status === 401 || error.status === 403) return 'Sua sessão precisa ser atualizada. Saia e entre novamente para continuar.';
    if (error.status === 0) return 'Não foi possível alcançar a API. Verifique se os serviços Docker estão ativos.';
    return error.status === 400 ? 'Confira os campos e tente novamente.' : 'Não foi possível carregar ou salvar o extrato agora.';
  }
}
