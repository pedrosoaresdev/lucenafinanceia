import { TestBed } from '@angular/core/testing';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { AppComponent } from './app.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

registerLocaleData(localePt, 'pt-BR');

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('shows the public landing page before authentication', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Menos ruído.');
    expect(fixture.nativeElement.textContent).toContain('PRÉVIA ILUSTRATIVA');
    expect(fixture.nativeElement.textContent).not.toContain('Saldo total');
  });

  it('opens the step-by-step registration from the landing page', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const createAccount = fixture.nativeElement.querySelector('.nav-cta') as HTMLButtonElement;
    createAccount.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('CADASTRO SEGURO · ETAPA 1 DE 3');
    expect(fixture.nativeElement.textContent).toContain('CPF');
  });
});
