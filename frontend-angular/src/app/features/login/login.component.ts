import { AfterViewInit, Component, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

const REMEMBER_KEY = 'importadora_remember_username';
const USERNAME_KEY = 'importadora_saved_username';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, AfterViewInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  @ViewChild('googleBtnHost', { static: false }) googleBtnHost?: ElementRef<HTMLDivElement>;

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly googleEnabled = signal(false);

  private googleClientId = '';
  private googleInitialized = false;

  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
    rememberMe: [false]
  });

  ngOnInit(): void {
    const remember = localStorage.getItem(REMEMBER_KEY) === 'true';
    const savedUser = localStorage.getItem(USERNAME_KEY) ?? '';
    this.form.patchValue({
      rememberMe: remember,
      username: remember && savedUser ? savedUser : 'admin',
      password: remember ? '' : 'admin123'
    });

    this.auth.getAuthConfig().subscribe({
      next: (cfg) => {
        this.googleClientId = cfg.googleClientId ?? '';
        this.googleEnabled.set(cfg.googleEnabled && !!this.googleClientId);
        this.scheduleGoogleInit();
      },
      error: () => this.googleEnabled.set(false)
    });
  }

  ngAfterViewInit(): void {
    this.scheduleGoogleInit();
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    const { username, password, rememberMe } = this.form.getRawValue();

    if (rememberMe) {
      localStorage.setItem(REMEMBER_KEY, 'true');
      localStorage.setItem(USERNAME_KEY, username);
    } else {
      localStorage.removeItem(REMEMBER_KEY);
      localStorage.removeItem(USERNAME_KEY);
    }

    this.auth.login(username, password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.resolveLoginError(err));
      }
    });
  }

  private scheduleGoogleInit(): void {
    const attempt = (left: number) => {
      if (this.initGoogleButton() || left <= 0) return;
      setTimeout(() => attempt(left - 1), 250);
    };
    attempt(24);
  }

  private initGoogleButton(): boolean {
    if (!this.googleEnabled() || !this.googleClientId || !this.googleBtnHost?.nativeElement) {
      return false;
    }
    if (this.googleInitialized || !window.google?.accounts?.id) {
      return this.googleInitialized;
    }

    this.googleBtnHost.nativeElement.innerHTML = '';
    window.google.accounts.id.initialize({
      client_id: this.googleClientId,
      callback: (response) => this.onGoogleCredential(response.credential)
    });
    window.google.accounts.id.renderButton(this.googleBtnHost.nativeElement, {
      type: 'standard',
      theme: 'filled_black',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      width: 320
    });
    this.googleInitialized = true;
    return true;
  }

  private resolveLoginError(err: { status?: number; error?: { detail?: string } }): string {
    if (err?.error?.detail) {
      return err.error.detail;
    }
    if (!err?.status) {
      return 'No se pudo conectar con el servidor. Verifique que MS-1 (puerto 8080) esté activo y que abra la app en http://localhost:4200 (no en otro puerto).';
    }
    if (err.status === 404 || err.status === 502 || err.status === 504) {
      return 'El proxy de Angular no alcanza el backend. Use http://localhost:4200 con npm start y confirme que MS-1 corre en el puerto 8080.';
    }
    if (err.status >= 500) {
      return 'Error del servidor. Intente de nuevo en unos segundos.';
    }
    return 'Credenciales inválidas. Verifique usuario y contraseña.';
  }

  private onGoogleCredential(idToken: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.auth.loginWithGoogle(idToken).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.detail ?? 'No se pudo iniciar sesión con Google.');
      }
    });
  }
}
