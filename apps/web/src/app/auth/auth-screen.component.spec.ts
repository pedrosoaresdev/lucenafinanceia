import { TestBed } from '@angular/core/testing';
import { AuthScreenComponent } from './auth-screen.component';
import { FirebaseAuthService } from '../core/firebase-auth.service';

describe('AuthScreenComponent', () => {
  let component: AuthScreenComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthScreenComponent],
      providers: [{ provide: FirebaseAuthService, useValue: {} }],
    }).compileComponents();
    component = TestBed.createComponent(AuthScreenComponent).componentInstance;
  });

  it('accepts a CPF with correct check digits and rejects invalid values', () => {
    expect(component.isValidCpf('529.982.247-25')).toBeTrue();
    expect(component.isValidCpf('529.982.247-24')).toBeFalse();
    expect(component.isValidCpf('111.111.111-11')).toBeFalse();
  });

  it('formats CPF as the user types', () => {
    expect(component.formatCpf('52998224725')).toBe('529.982.247-25');
  });

  it('requires a full name and a valid CPF before advancing', () => {
    component.mode = 'register';
    component.name = 'Pedro Lucena';
    component.cpf = '529.982.247-25';
    expect(component.canContinue(false)).toBeTrue();
    component.cpf = '529.982.247-24';
    expect(component.canContinue(false)).toBeFalse();
    component.name = 'Pedro';
    component.cpf = '529.982.247-25';
    expect(component.canContinue(false)).toBeFalse();
  });

  it('rejects future and impossible birth dates', () => {
    expect(component.isValidBirthDate(component.maxBirthDate)).toBeTrue();
    expect(component.isValidBirthDate('2099-12-31')).toBeFalse();
    expect(component.isValidBirthDate('2000-02-31')).toBeFalse();
  });
});
