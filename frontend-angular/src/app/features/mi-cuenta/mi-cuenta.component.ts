import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  NbAlertModule,
  NbButtonModule,
  NbCardModule,
  NbIconModule,
  NbInputModule,
  NbSpinnerModule
} from '@nebular/theme';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/services/i18n.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { MiPerfil } from '../../core/models';

@Component({
  selector: 'app-mi-cuenta',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NbCardModule,
    NbButtonModule,
    NbInputModule,
    NbAlertModule,
    NbSpinnerModule,
    NbIconModule,
    TranslatePipe
  ],
  templateUrl: './mi-cuenta.component.html',
  styleUrl: './mi-cuenta.component.scss'
})
export class MiCuentaComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly i18n = inject(I18nService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly savingPassword = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly passwordError = signal<string | null>(null);
  readonly passwordSuccess = signal<string | null>(null);
  readonly perfil = signal<MiPerfil | null>(null);

  readonly rol = computed(() => this.auth.rol());
  readonly isCliente = computed(() => this.rol() === 'CLIENTE');
  readonly isVendedor = computed(() => this.rol() === 'VENDEDOR');
  readonly isAdmin = computed(() => this.rol() === 'ADMIN');

  readonly perfilForm = this.fb.nonNullable.group({
    nombreCompleto: [''],
    email: ['', [Validators.required, Validators.email]],
    telefono: [''],
    direccion: [''],
    ciudad: [''],
    zonaAsignada: ['']
  });

  readonly passwordForm = this.fb.nonNullable.group({
    contrasenaActual: ['', Validators.required],
    contrasenaNueva: ['', [Validators.required, Validators.minLength(6)]],
    confirmarContrasena: ['', Validators.required]
  });

  ngOnInit(): void {
    this.load();
    if (this.route.snapshot.fragment === 'contrasena') {
      setTimeout(() => document.getElementById('contrasena')?.scrollIntoView({ behavior: 'smooth' }), 300);
    }
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getMiPerfil().subscribe({
      next: (data) => {
        this.perfil.set(data);
        this.patchForm(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.detail ?? this.i18n.t('account.loadError'));
      }
    });
  }

  savePerfil(): void {
    if (this.perfilForm.invalid) {
      this.perfilForm.markAllAsTouched();
      return;
    }

    const raw = this.perfilForm.getRawValue();
    const body = {
      nombreCompleto: raw.nombreCompleto || undefined,
      email: raw.email,
      telefono: raw.telefono || undefined,
      direccion: raw.direccion || undefined,
      ciudad: raw.ciudad || undefined,
      zonaAsignada: raw.zonaAsignada || undefined
    };

    this.saving.set(true);
    this.error.set(null);
    this.success.set(null);

    this.api.updateMiPerfil(body).subscribe({
      next: (updated) => {
        this.perfil.set(updated);
        this.patchForm(updated);
        this.saving.set(false);
        this.success.set(this.i18n.t('account.saved'));

        if (this.isCliente() && updated.cliente) {
          this.auth.patchUser({ clienteNombre: updated.cliente.nombreCompleto });
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.detail ?? this.i18n.t('account.saveError'));
      }
    });
  }

  savePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { contrasenaActual, contrasenaNueva, confirmarContrasena } = this.passwordForm.getRawValue();
    if (contrasenaNueva !== confirmarContrasena) {
      this.passwordError.set(this.i18n.t('account.passwordMismatch'));
      return;
    }

    this.savingPassword.set(true);
    this.passwordError.set(null);
    this.passwordSuccess.set(null);

    this.api.cambiarMiContrasena({ contrasenaActual, contrasenaNueva }).subscribe({
      next: () => {
        this.savingPassword.set(false);
        this.passwordSuccess.set(this.i18n.t('account.passwordSaved'));
        this.passwordForm.reset();
      },
      error: (err) => {
        this.savingPassword.set(false);
        this.passwordError.set(err?.error?.detail ?? this.i18n.t('account.passwordError'));
      }
    });
  }

  private patchForm(data: MiPerfil): void {
    const c = data.cliente;
    const v = data.vendedor;

    this.perfilForm.patchValue({
      nombreCompleto: c?.nombreCompleto ?? v?.nombreCompleto ?? '',
      email: data.email,
      telefono: c?.telefono ?? v?.telefono ?? '',
      direccion: c?.direccion ?? '',
      ciudad: c?.ciudad ?? '',
      zonaAsignada: v?.zonaAsignada ?? ''
    });
  }
}
