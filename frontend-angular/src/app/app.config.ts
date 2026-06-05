import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';

import { provideRouter } from '@angular/router';

import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { provideAnimations } from '@angular/platform-browser/animations';

import {

  NbDialogModule,

  NbIconModule,

  NbMenuModule,

  NbSidebarModule,

  NbThemeModule

} from '@nebular/theme';

import { NbEvaIconsModule } from '@nebular/eva-icons';

import { routes } from './app.routes';

import { authInterceptor } from './core/interceptors/auth.interceptor';



export const appConfig: ApplicationConfig = {

  providers: [

    provideZoneChangeDetection({ eventCoalescing: true }),

    provideAnimations(),

    importProvidersFrom(

      NbThemeModule.forRoot({ name: 'dark' }),

      NbSidebarModule.forRoot(),

      NbMenuModule.forRoot(),

      NbDialogModule.forRoot(),

      NbEvaIconsModule,

      NbIconModule

    ),

    provideRouter(routes),

    provideHttpClient(withInterceptors([authInterceptor]))

  ]

};

