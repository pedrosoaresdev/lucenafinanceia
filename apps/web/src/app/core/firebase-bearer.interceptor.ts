import { HttpInterceptorFn } from '@angular/common/http';
import { from, switchMap } from 'rxjs';
import { firebaseAuth } from './firebase';

export const firebaseBearerInterceptor: HttpInterceptorFn = (request, next) => {
  const user = firebaseAuth.currentUser;
  if (!user || !request.url.startsWith('/api/')) return next(request);
  return from(user.getIdToken()).pipe(
    switchMap((token) => next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }))),
  );
};
