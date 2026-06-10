import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { RolUsuario } from '../../core/models';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const p = group.get('password')?.value;
  const c = group.get('confirmPassword')?.value;
  return p === c ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.scss'
})
export class RegistroComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  readonly roles: { value: RolUsuario; label: string }[] = [
    { value: 'VENDEDOR', label: 'Vendedor' },
    { value: 'CLIENTE', label: 'Cliente' }
  ];

  readonly form = this.fb.nonNullable.group(
    {
      nombreCompleto: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      cedulaDocumento: ['', [Validators.required, Validators.minLength(5)]],
      rol: ['VENDEDOR' as RolUsuario, Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    },
    { validators: passwordsMatch }
  );

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    const body = this.form.getRawValue();
    this.auth.register(body).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.success.set(`Cuenta creada. Bienvenido, ${res.username}.`);
        setTimeout(() => void this.router.navigate(['/dashboard']), 800);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.resolveRegisterError(err));
      }
    });
  }

  private resolveRegisterError(err: HttpErrorResponse): string {
    if (err.status === 0) {
      return 'No hay conexión con el servidor. Verifique que el backend esté en ejecución.';
    }
    if (err.status === 403) {
      return 'Registro no disponible (403). Reinicie el backend (ms-1-principal) con el código actual.';
    }
    const body = err.error as { detail?: string; title?: string; errors?: Record<string, string> } | null;
    if (body?.detail) {
      return body.detail;
    }
    if (body?.errors) {
      return Object.values(body.errors).join(' ');
    }
    if (body?.title) {
      return body.title;
    }
    return 'No se pudo crear la cuenta.';
  }
}
