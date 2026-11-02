import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { AppComponent } from './app/app.component';
import { firebaseBearerInterceptor } from './app/core/firebase-bearer.interceptor';

registerLocaleData(localePt, 'pt-BR');
bootstrapApplication(AppComponent, { providers: [
  provideRouter([]),
  provideHttpClient(withInterceptors([firebaseBearerInterceptor])),
  { provide: LOCALE_ID, useValue: 'pt-BR' },
] }).catch((error) => console.error(error));
