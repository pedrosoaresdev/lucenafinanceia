import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FirebaseAuthService } from '../core/firebase-auth.service';

type ActionState = 'checking' | 'ready' | 'success' | 'invalid';

@Component({
  selector: 'app-email-action',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrl: './email-action.css',
  template: `
    <main class="action-page">
      <div class="action-glow glow-one"></div><div class="action-glow glow-two"></div>
      <section class="action-shell">
        <a class="brand action-brand" href="/" aria-label="Lucena Finance início"><img src="/assets/brand/lucena-finance-wordmark.png" alt="Lucena Finance"></a>
        <article class="action-card">
          <div class="action-icon" [class.success-icon]="state === 'success'">{{ state === 'success' ? '✓' : state === 'invalid' ? '!' : '✦' }}</div>
          <ng-container [ngSwitch]="state">
            <div *ngSwitchCase="'checking'" class="state-content" aria-live="polite"><div class="eyebrow">LINK SEGURO</div><h1>Validando seu link</h1><p>Estamos conferindo se ele ainda pode ser usado.</p><div class="loader"><i></i></div></div>
            <ng-container *ngSwitchCase="'ready'">
              <div class="eyebrow">RECUPERAÇÃO DE ACESSO</div><h1>Uma nova senha.<br><span>Seu acesso de volta.</span></h1>
              <p class="intro">Crie uma senha forte para proteger sua vida financeira. O link foi enviado para <strong>{{ email }}</strong>.</p>
              <form (ngSubmit)="submit()" #resetForm="ngForm" novalidate>
                <label>Nova senha<input name="password" [(ngModel)]="password" type="password" autocomplete="new-password" required minlength="12" placeholder="Pelo menos 12 caracteres"></label>
                <div class="password-meter" aria-label="Requisitos da senha"><i [class.met]="password.length >= 12"></i><i [class.met]="hasMixedCase"></i><i [class.met]="hasNumberOrSymbol"></i></div>
                <div class="requirements"><span [class.met-text]="password.length >= 12">12 caracteres</span><span [class.met-text]="hasMixedCase">Maiúsculas e minúsculas</span><span [class.met-text]="hasNumberOrSymbol">Número ou símbolo</span></div>
                <label>Confirme sua nova senha<input name="confirmPassword" [(ngModel)]="confirmPassword" type="password" autocomplete="new-password" required placeholder="Digite novamente"></label>
                <small class="field-error" *ngIf="confirmPassword && confirmPassword !== password">As senhas não coincidem.</small>
                <p class="form-error" *ngIf="error" role="alert">{{ error }}</p>
                <button class="primary-button" type="submit" [disabled]="busy || !resetForm.valid || !passwordIsStrong || password !== confirmPassword">{{ busy ? 'Salvando…' : 'Salvar nova senha' }} <span>↗</span></button>
              </form>
              <div class="security-note"><span>♢</span> Você não será conectado automaticamente. Entre com sua nova senha.</div>
            </ng-container>
            <div *ngSwitchCase="'success'" class="state-content"><div class="eyebrow">TUDO PRONTO</div><h1>Senha atualizada.</h1><p>Sua conta está protegida com a nova senha. Agora você já pode entrar.</p><a class="primary-button link-button" href="/">Ir para o login <span>→</span></a></div>
            <div *ngSwitchCase="'invalid'" class="state-content"><div class="eyebrow">LINK INDISPONÍVEL</div><h1>Vamos tentar de novo.</h1><p>{{ error || 'Este link expirou ou já foi usado. Peça um novo link de recuperação.' }}</p><a class="primary-button link-button" href="/?auth=reset">Solicitar novo link <span>→</span></a></div>
          </ng-container>
          <footer><span>Lucena Finance</span><span>Seus dados, suas escolhas.</span></footer>
        </article>
        <div class="encrypted"><span>⌑</span> Conexão protegida · Seus dados permanecem privados</div>
      </section>
    </main>
  `,
})
export class EmailActionComponent implements OnInit {
  state: ActionState = 'checking';
  code = '';
  email = '';
  password = '';
  confirmPassword = '';
  error = '';
  busy = false;

  constructor(private readonly auth: FirebaseAuthService) {}

  get hasMixedCase(): boolean { return /[a-z]/.test(this.password) && /[A-Z]/.test(this.password); }
  get hasNumberOrSymbol(): boolean { return /[0-9\W_]/.test(this.password); }
  get passwordIsStrong(): boolean { return this.password.length >= 12 && this.hasMixedCase && this.hasNumberOrSymbol; }

  async ngOnInit(): Promise<void> {
    const params = new URLSearchParams(window.location.search);
    this.code = params.get('oobCode') ?? '';
    if (params.get('mode') !== 'resetPassword' || !this.code) {
      this.state = 'invalid';
      this.error = 'O link de redefinição não está completo. Solicite um novo e-mail.';
      return;
    }
    try {
      this.email = await this.auth.verifyPasswordResetCode(this.code);
      this.state = 'ready';
    } catch {
      this.state = 'invalid';
      this.error = 'Este link expirou, já foi usado ou não é válido. Solicite um novo e-mail de recuperação.';
    }
  }

  async submit(): Promise<void> {
    if (!this.passwordIsStrong || this.password !== this.confirmPassword || this.busy) return;
    this.busy = true;
    this.error = '';
    try {
      await this.auth.confirmPasswordReset(this.code, this.password);
      this.password = '';
      this.confirmPassword = '';
      this.state = 'success';
    } catch (cause) {
      const code = typeof cause === 'object' && cause !== null && 'code' in cause ? String((cause as { code?: unknown }).code ?? '') : '';
      this.error = code === 'auth/expired-action-code' || code === 'auth/invalid-action-code'
        ? 'Este link expirou ou já foi usado. Solicite um novo e-mail de recuperação.'
        : code === 'auth/weak-password'
          ? 'Essa senha não atende aos requisitos. Escolha outra senha mais forte.'
          : 'Não foi possível atualizar a senha. Confira sua conexão e tente novamente.';
    } finally { this.busy = false; }
  }
}
