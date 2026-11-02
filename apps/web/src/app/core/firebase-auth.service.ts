import { Injectable } from '@angular/core';
import {
  User,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  getAdditionalUserInfo,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  signInWithEmailAndPassword,
  signOut,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { firebaseAuth } from './firebase';

@Injectable({ providedIn: 'root' })
export class FirebaseAuthService {
  private readonly userState = new BehaviorSubject<User | null>(null);
  readonly user$ = this.userState.asObservable();
  get currentUser(): User | null { return firebaseAuth.currentUser; }

  constructor(private readonly http: HttpClient) {
    onAuthStateChanged(firebaseAuth, (user) => this.userState.next(user));
  }

  async register(name: string, email: string, password: string): Promise<void> {
    const credential = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
    await updateProfile(credential.user, { displayName: name.trim() });
    await sendEmailVerification(credential.user);
  }

  async login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
  }

  async loginWithGoogle(allowRegistration = false): Promise<void> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(firebaseAuth, provider);
    if (!allowRegistration && getAdditionalUserInfo(result)?.isNewUser) {
      await signOut(firebaseAuth);
      throw new Error('google-registration-required');
    }
  }

  async saveProfile(fullName: string, cpf: string, dateOfBirth: string): Promise<void> {
    await firstValueFrom(this.http.post<void>('/api/v1/profiles/me', { fullName, cpf, dateOfBirth }));
  }

  async resendVerification(): Promise<void> {
    const user = firebaseAuth.currentUser;
    if (!user) throw new Error('auth/no-current-user');
    await sendEmailVerification(user);
  }

  async resetPassword(email: string): Promise<void> {
    firebaseAuth.languageCode = 'pt-BR';
    await sendPasswordResetEmail(firebaseAuth, email.trim(), {
      url: `${window.location.origin}/`,
      handleCodeInApp: false,
    });
  }

  async verifyPasswordResetCode(code: string): Promise<string> {
    return verifyPasswordResetCode(firebaseAuth, code);
  }

  async confirmPasswordReset(code: string, newPassword: string): Promise<void> {
    await confirmPasswordReset(firebaseAuth, code, newPassword);
  }

  async logout(): Promise<void> {
    await signOut(firebaseAuth);
  }
}
