import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  NbAlertModule,
  NbButtonModule,
  NbCardModule,
  NbIconModule,
  NbInputModule,
  NbOptionModule,
  NbSelectModule,
  NbSpinnerModule
} from '@nebular/theme';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Cliente, RolUsuario, Usuario } from '../../core/models';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NbCardModule,
    NbButtonModule,
    NbInputModule,
    NbSelectModule,
    NbOptionModule,
    NbSpinnerModule,
    NbAlertModule,
    NbIconModule
  ],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.scss'
})
export class UsuariosComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly items = signal<Usuario[]>([]);
  readonly clientes = signal<Cliente[]>([]);
  readonly loading = signal(true);
  readonly showForm = signal(false);
  readonly resetTarget = signal<Usuario | null>(null);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly togglingId = signal<number | null>(null);

  readonly isAdmin = computed(() => this.auth.rol() === 'ADMIN');

  readonly rolesDisponibles = computed((): { value: RolUsuario; label: string }[] => {
    if (this.isAdmin()) {
      return [
        { value: 'ADMIN', label: 'Administrador' },
        { value: 'VENDEDOR', label: 'Vendedor' },
        { value: 'CLIENTE', label: 'Cliente' }
      ];
    }
    return [{ value: 'CLIENTE', label: 'Cliente' }];
  });

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    email: ['', [Validators.required, Validators.email]],
    rol: ['CLIENTE' as RolUsuario, Validators.required],
    clienteId: [0]
  });

  readonly resetForm = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  });

  ngOnInit(): void {
    if (!this.isAdmin()) {
      this.form.patchValue({ rol: 'CLIENTE' });
    }
    this.load();
    this.api.getClientes().subscribe({
      next: (data) => this.clientes.set(data),
      error: () => this.clientes.set([])
    });
  }

  load(): void {
    this.loading.set(true);
    this.api.getUsuarios().subscribe({
      next: (data) => {
        this.items.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.detail ?? 'No se pudo cargar usuarios');
      }
    });
  }

  openCreate(): void {
    const defaultRol: RolUsuario = this.isAdmin() ? 'VENDEDOR' : 'CLIENTE';
    this.form.reset({
      username: '',
      password: '',
      email: '',
      rol: defaultRol,
      clienteId: 0
    });
    this.resetTarget.set(null);
    this.showForm.set(true);
    this.error.set(null);
    this.success.set(null);
  }

  puedeRestablecerContrasena(u: Usuario): boolean {
    return this.isAdmin() && u.activo && (u.rol === 'CLIENTE' || u.rol === 'VENDEDOR');
  }

  openResetPassword(u: Usuario): void {
    this.showForm.set(false);
    this.resetTarget.set(u);
    this.resetForm.reset({ password: '', confirmPassword: '' });
    this.error.set(null);
    this.success.set(null);
  }

  cancelReset(): void {
    this.resetTarget.set(null);
    this.resetForm.reset();
  }

  saveResetPassword(): void {
    const u = this.resetTarget();
    if (!u || this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }
    const { password, confirmPassword } = this.resetForm.getRawValue();
    if (password !== confirmPassword) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }
    this.api.restablecerContrasenaUsuario(u.id, password).subscribe({
      next: () => {
        this.success.set(`Contraseña actualizada para ${u.username}. Comuníquela al usuario de forma segura.`);
        this.resetTarget.set(null);
        this.resetForm.reset();
      },
      error: (err) => this.error.set(err?.error?.detail ?? 'No se pudo actualizar la contraseña')
    });
  }

  onRolChange(): void {
    const rol = this.form.controls.rol.value;
    if (rol !== 'CLIENTE') {
      this.form.controls.clienteId.setValue(0);
    }
  }

  save(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    if (raw.rol === 'CLIENTE' && (!raw.clienteId || raw.clienteId <= 0)) {
      this.error.set('Seleccione el cliente vinculado al usuario CLIENTE');
      return;
    }

    const body = {
      username: raw.username,
      password: raw.password,
      email: raw.email,
      rol: raw.rol,
      clienteId: raw.rol === 'CLIENTE' ? raw.clienteId : undefined
    };

    this.api.createUsuario(body).subscribe({
      next: () => {
        this.showForm.set(false);
        this.load();
      },
      error: (err) => this.error.set(err?.error?.detail ?? 'Error al registrar usuario')
    });
  }

  cambiarEstado(u: Usuario): void {
    if (!this.isAdmin()) return;
    const accion = u.activo ? 'desactivar' : 'activar';
    if (!confirm(`¿Desea ${accion} al usuario ${u.username}?`)) return;

    this.togglingId.set(u.id);
    this.error.set(null);
    this.api.desactivarUsuario(u.id).subscribe({
      next: () => {
        this.items.update((list) =>
          list.map((x) => (x.id === u.id ? { ...x, activo: !x.activo } : x))
        );
        this.togglingId.set(null);
      },
      error: (err) => {
        this.togglingId.set(null);
        this.error.set(err?.error?.detail ?? `No se pudo ${accion} el usuario`);
      }
    });
  }

  rolLabel(rol: RolUsuario): string {
    const map: Record<RolUsuario, string> = {
      ADMIN: 'Administrador',
      VENDEDOR: 'Vendedor',
      CLIENTE: 'Cliente'
    };
    return map[rol];
  }
}
