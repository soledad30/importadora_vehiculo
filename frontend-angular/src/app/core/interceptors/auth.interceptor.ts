import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';

import { inject } from '@angular/core';

import { Router } from '@angular/router';

import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';



export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const auth = inject(AuthService);

  const router = inject(Router);

  const token = auth.getToken();



  if (
    token &&
    !req.url.includes('/auth/login') &&
    !req.url.includes('/auth/google') &&
    !req.url.includes('/auth/register') &&
    !req.url.includes('/auth/config')
  ) {

    req = req.clone({

      setHeaders: { Authorization: `Bearer ${token}` }

    });

  }



  return next(req).pipe(

    catchError((err: HttpErrorResponse) => {

      if (err.status === 401 && !req.url.includes('/auth/login')) {

        auth.logout();

        void router.navigate(['/login']);

      }

      return throwError(() => err);

    })

  );

};

