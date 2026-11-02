import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User } from 'firebase/auth';
import { FirebaseAuthService } from '../core/firebase-auth.service';

type AuthMode = 'login' | 'register' | 'reset';

@Component({
  selector: 'app-auth-screen',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrl: './auth-screen.css',
  template: `
    <main class="auth-page">
      <section class="auth-card">
        <button class="brand auth-brand" type="button" (click)="close.emit()" aria-label="Voltar ao início"><img class="auth-wordmark" src="/assets/brand/lucena-finance-wordmark.png" alt="Lucena Finance"></button>
        <ng-container *ngIf="user && !user.emailVerified; else authForm">
          <div class="auth-icon">✉</div><div class="eyebrow">CONFIRME SEU E-MAIL</div>
          <h1>Verifique sua caixa de entrada</h1>
          <p class="auth-description">Enviamos um link para <strong>{{ user.email }}</strong>. Confirme o endereço e entre novamente para acessar suas finanças.</p>
          <p class="auth-feedback" *ngIf="message" role="status">{{ message }}</p><p class="auth-error" *ngIf="error" role="alert">{{ error }}</p>
          <p class="mail-hint" *ngIf="mode === 'reset' && message">Confira também Spam, Promoções e se digitou o mesmo e-mail usado no cadastro. Por segurança, não informamos se o endereço está cadastrado.</p>
          <button class="auth-submit" [disabled]="busy" (click)="resend()">{{ busy ? 'Enviando…' : 'Reenviar e-mail de verificação' }}</button>
          <button class="auth-link logout-link" [disabled]="busy" (click)="logout()">Sair</button>
        </ng-container>

        <ng-template #authForm>
          <div class="auth-icon">✦</div>
          <div class="eyebrow">{{ mode === 'login' ? 'BEM-VINDO DE VOLTA' : mode === 'register' ? 'CADASTRO SEGURO · ETAPA ' + (step + 1) + ' DE 3' : 'RECUPERAÇÃO DE ACESSO' }}</div>
          <h1>{{ mode === 'login' ? 'Entre na sua conta' : mode === 'register' ? (step === 0 ? 'Vamos nos conhecer.' : step === 1 ? 'Seus dados básicos.' : 'Crie sua senha.') : 'Redefina sua senha' }}</h1>
          <p class="auth-description">{{ mode === 'reset' ? 'Enviaremos um link para redefinir sua senha ao e-mail cadastrado.' : mode === 'register' ? 'Seus dados pessoais são protegidos e seu CPF é cifrado antes de ser salvo.' : 'Acesse suas finanças com sua conta Google ou e-mail e senha.' }}</p>
          <div class="step-track" *ngIf="mode === 'register'"><i *ngFor="let item of [0,1,2]" [class.complete]="item <= step"></i></div>

          <form (ngSubmit)="submit()" #authFormElement="ngForm" novalidate>
            <ng-container *ngIf="mode === 'register' && step === 0">
              <label>Nome completo<input name="name" [(ngModel)]="name" required minlength="5" autocomplete="name" placeholder="Seu nome e sobrenome"><small class="field-hint" *ngIf="name && name.trim().split(' ').length < 2">Informe nome e sobrenome.</small></label>
              <label>CPF<input name="cpf" [ngModel]="cpf" (ngModelChange)="cpf = formatCpf($event)" required inputmode="numeric" autocomplete="off" placeholder="000.000.000-00" maxlength="14"><small class="field-hint" *ngIf="cpf && !isValidCpf(cpf)">Digite um CPF válido.</small></label>
            </ng-container>
            <ng-container *ngIf="mode === 'register' && step === 1">
              <label>Data de nascimento<input name="dateOfBirth" [(ngModel)]="dateOfBirth" required type="date" [max]="maxBirthDate" autocomplete="bday"><small class="field-hint" *ngIf="dateOfBirth && !isValidBirthDate(dateOfBirth)">Informe uma data válida, anterior a hoje.</small></label>
              <label>E-mail<input name="email" [(ngModel)]="email" required email type="email" autocomplete="email" placeholder="voce@exemplo.com"><small class="field-hint" *ngIf="email && !isValidEmail(email)">Confira o formato do e-mail.</small></label>
            </ng-container>
            <ng-container *ngIf="mode === 'register' && step === 2">
              <label>Senha<input name="password" [(ngModel)]="password" required minlength="12" type="password" autocomplete="new-password" placeholder="Pelo menos 12 caracteres"></label>
              <label>Repita sua senha<input name="confirmPassword" [(ngModel)]="confirmPassword" required type="password" autocomplete="new-password" placeholder="Digite a mesma senha novamente"><small class="field-hint" *ngIf="confirmPassword && confirmPassword !== password">As senhas não coincidem.</small></label>
              <button type="button" class="google-button" (click)="registerWithGoogle()" [disabled]="busy || !registrationDetailsValid()"><span class="google-mark">G</span> Cadastrar com Google</button>
            </ng-container>
            <ng-container *ngIf="mode === 'login'">
              <label>E-mail<input name="email" [(ngModel)]="email" required email type="email" autocomplete="email" placeholder="voce@exemplo.com"><small class="field-hint" *ngIf="email && !isValidEmail(email)">Confira o formato do e-mail.</small></label>
              <label>Senha<input name="password" [(ngModel)]="password" required type="password" autocomplete="current-password" placeholder="Sua senha"></label>
              <button type="button" class="auth-link forgot-link" (click)="setMode('reset')">Esqueci minha senha</button>
              <button class="google-button" type="button" (click)="loginWithGoogle()" [disabled]="busy"><span class="google-mark">G</span> Continuar com Google</button>
            </ng-container>
            <label *ngIf="mode === 'reset'">E-mail cadastrado<input name="email" [(ngModel)]="email" required email type="email" autocomplete="email" placeholder="voce@exemplo.com"></label>
            <p class="auth-feedback" *ngIf="message" role="status">{{ message }}</p><p class="auth-error" *ngIf="error" role="alert">{{ error }}</p>
            <button class="auth-submit" type="submit" [disabled]="busy || !canContinue(authFormElement.valid ?? false)">{{ submitLabel() }}</button>
          </form>

          <div class="auth-switch" *ngIf="mode !== 'reset'">{{ mode === 'login' ? 'Ainda não tem uma conta?' : 'Já tem uma conta?' }} <button class="auth-link" type="button" (click)="setMode(mode === 'login' ? 'register' : 'login')">{{ mode === 'login' ? 'Criar conta' : 'Entrar' }}</button></div>
          <div class="auth-switch" *ngIf="mode === 'reset'"><button class="auth-link" type="button" (click)="setMode('login')">Voltar para entrar</button></div>
          <div class="auth-privacy">♢ Seus dados ficam vinculados somente à sua conta.</div>
        </ng-template>
      </section>
    </main>
  `,
})
export class AuthScreenComponent {
  @Input() user: User | null = null;
  @Input() initialMode: AuthMode = 'login';
  @Output() close = new EventEmitter<void>();
  mode: AuthMode = 'login';
  step = 0;
  name = '';
  cpf = '';
  dateOfBirth = '';
  email = '';
  password = '';
  confirmPassword = '';
  busy = false;
  message = '';
  error = '';
  maxBirthDate = this.localDate();

  constructor(private readonly auth: FirebaseAuthService) {}

  ngOnChanges(): void { this.mode = this.initialMode; }

  setMode(mode: AuthMode): void {
    this.mode = mode;
    this.step = 0;
    this.message = '';
    this.error = '';
  }

  canContinue(formValid: boolean): boolean {
    if (this.mode === 'register') {
      if (this.step === 0) return this.name.trim().split(/\s+/).length >= 2 && this.isValidCpf(this.cpf);
      if (this.step === 1) return formValid && this.isValidBirthDate(this.dateOfBirth);
      return formValid && this.password.length >= 12 && this.password === this.confirmPassword;
    }
    return formValid;
  }

  submitLabel(): string {
    if (this.busy) return 'Aguarde…';
    if (this.mode === 'register') return this.step < 2 ? 'Continuar' : 'Criar conta e verificar e-mail';
    if (this.mode === 'login') return 'Entrar com e-mail e senha';
    return 'Enviar link de recuperação';
  }

  async submit(): Promise<void> {
    if (this.mode === 'register' && this.step < 2) { this.step++; this.message = ''; this.error = ''; return; }
    this.busy = true;
    this.message = '';
    this.error = '';
    try {
      if (this.mode === 'register') {
        await this.auth.register(this.name.trim(), this.email, this.password);
        await this.auth.saveProfile(this.name.trim(), this.cpf, this.dateOfBirth);
        this.message = 'Conta criada. Confira seu e-mail para confirmar o endereço antes de acessar o painel.';
      } else if (this.mode === 'login') {
        await this.auth.login(this.email, this.password);
      } else {
        await this.auth.resetPassword(this.email);
        this.message = 'Se houver uma conta para este endereço, enviaremos as instruções de recuperação.';
      }
    } catch (cause) {
      this.error = this.mode === 'login'
        ? this.firebaseError(cause, 'login')
        : this.mode === 'register'
          ? this.firebaseError(cause, 'register')
          : this.firebaseError(cause, 'reset');
    } finally { this.busy = false; }
  }

  private firebaseError(cause: unknown, action: 'login' | 'register' | 'reset'): string {
    const code = typeof cause === 'object' && cause !== null && 'code' in cause
      ? String((cause as { code?: unknown }).code ?? '') : '';
    if (code) console.warn('Firebase Authentication request failed', { action, code });
    if (code === 'auth/too-many-requests') return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.';
    if (code === 'auth/network-request-failed') return 'Sem conexão com o serviço de autenticação. Verifique sua internet e tente novamente.';
    if (code === 'auth/unauthorized-continue-uri' || code === 'auth/invalid-continue-uri') return 'O domínio deste app não está autorizado no Firebase. Adicione localhost ou o domínio publicado em Authentication → Settings → Authorized domains.';
    if (code === 'auth/operation-not-allowed') return 'O envio de e-mails ainda não está habilitado no Firebase. Ative E-mail/senha em Authentication → Método de login.';
    if (code === 'auth/invalid-email') return 'Esse endereço de e-mail parece inválido. Confira e tente novamente.';
    if (code === 'auth/user-not-found' && action === 'login') return 'Não encontramos uma conta com esse e-mail. Confira o endereço ou crie sua conta.';
    if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') return 'E-mail ou senha incorretos. Confira os dados ou redefina sua senha.';
    if (code === 'auth/email-already-in-use') return 'Esse e-mail já possui cadastro. Entre na sua conta ou redefina sua senha.';
    if (code === 'auth/weak-password') return 'Escolha uma senha mais forte, com pelo menos 12 caracteres.';
    return action === 'login'
      ? 'Não foi possível entrar. Confira os dados e tente novamente.'
      : action === 'register'
        ? 'Não foi possível finalizar o cadastro. Verifique os dados e tente novamente.'
        : 'O Firebase não aceitou o pedido de recuperação. Verifique a configuração de Authentication e tente novamente.';
  }

  async loginWithGoogle(): Promise<void> {
    this.busy = true;
    this.error = '';
    try { await this.auth.loginWithGoogle(); }
    catch (error) { this.error = error instanceof Error && error.message === 'google-registration-required'
      ? 'Primeiro acesso? Crie sua conta e preencha o CPF e a data de nascimento para completar seu perfil.'
      : 'Não foi possível entrar com Google. Tente novamente.'; }
    finally { this.busy = false; }
  }

  async registerWithGoogle(): Promise<void> {
    if (!this.registrationDetailsValid()) return;
    this.busy = true;
    this.error = '';
    try {
      await this.auth.loginWithGoogle(true);
      const googleUser = this.auth.currentUser;
      if (!googleUser?.email) throw new Error('google-email-required');
      if (this.email.trim().toLowerCase() !== googleUser.email.toLowerCase()) throw new Error('google-email-mismatch');
      await this.auth.saveProfile(this.name.trim(), this.cpf, this.dateOfBirth);
    } catch (error) {
      if (this.auth.currentUser) await this.auth.logout();
      this.error = error instanceof Error && error.message === 'google-email-mismatch'
        ? 'Use o mesmo e-mail da sua conta Google para concluir o cadastro.'
        : 'Não foi possível concluir o cadastro com Google. Confira os dados e tente novamente.';
    } finally { this.busy = false; }
  }

  registrationDetailsValid(): boolean {
    return this.name.trim().split(/\s+/).length >= 2 && this.isValidCpf(this.cpf)
      && this.isValidBirthDate(this.dateOfBirth) && this.isValidEmail(this.email);
  }

  isValidEmail(value: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()); }

  isValidBirthDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00`);
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value && value <= this.maxBirthDate && value >= '1900-01-01';
  }

  isValidCpf(value: string): boolean {
    const digits = value.replace(/\D/g, '');
    if (!/^\d{11}$/.test(digits) || /^([0-9])\1{10}$/.test(digits)) return false;
    const check = (length: number) => {
      const sum = Array.from(digits.slice(0, length)).reduce((total, number, index) => total + Number(number) * (length + 1 - index), 0);
      const digit = (sum * 10) % 11;
      return digit === 10 ? 0 : digit;
    };
    return check(9) === Number(digits[9]) && check(10) === Number(digits[10]);
  }

  formatCpf(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length > 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
    if (digits.length > 6) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    if (digits.length > 3) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    return digits;
  }

  private localDate(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  async resend(): Promise<void> {
    this.busy = true;
    this.error = '';
    this.message = '';
    try { await this.auth.resendVerification(); this.message = 'Enviamos outro link de verificação.'; }
    catch { this.error = 'Não foi possível reenviar o link. Entre novamente e tente outra vez.'; }
    finally { this.busy = false; }
  }

  async logout(): Promise<void> { await this.auth.logout(); }
}
