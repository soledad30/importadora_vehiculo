import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'registro',
    loadComponent: () =>
      import('./features/registro/registro.component').then((m) => m.RegistroComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        canActivate: [roleGuard('ADMIN', 'VENDEDOR', 'CLIENTE')],
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'vehiculos',
        canActivate: [roleGuard('ADMIN', 'VENDEDOR', 'CLIENTE')],
        loadComponent: () =>
          import('./features/vehiculos/vehiculos.component').then((m) => m.VehiculosComponent)
      },
      {
        path: 'clientes',
        canActivate: [roleGuard('ADMIN', 'VENDEDOR')],
        loadComponent: () =>
          import('./features/clientes/clientes.component').then((m) => m.ClientesComponent)
      },
      {
        path: 'pedidos',
        canActivate: [roleGuard('ADMIN', 'VENDEDOR', 'CLIENTE')],
        loadComponent: () =>
          import('./features/pedidos/pedidos.component').then((m) => m.PedidosComponent)
      },
      {
        path: 'notificaciones',
        canActivate: [roleGuard('ADMIN', 'VENDEDOR', 'CLIENTE')],
        loadComponent: () =>
          import('./features/notificaciones/notificaciones.component').then((m) => m.NotificacionesComponent)
      },
      {
        path: 'cotizador',
        canActivate: [roleGuard('ADMIN', 'VENDEDOR')],
        loadComponent: () =>
          import('./features/cotizador/cotizador.component').then((m) => m.CotizadorComponent)
      },
      {
        path: 'facturas',
        canActivate: [roleGuard('ADMIN', 'VENDEDOR')],
        loadComponent: () =>
          import('./features/facturas/facturas.component').then((m) => m.FacturasComponent)
      },
      {
        path: 'importaciones',
        canActivate: [roleGuard('ADMIN')],
        loadComponent: () =>
          import('./features/importaciones/importaciones.component').then((m) => m.ImportacionesComponent)
      },
      {
        path: 'documentos',
        canActivate: [roleGuard('ADMIN')],
        loadComponent: () =>
          import('./features/documentos/documentos.component').then((m) => m.DocumentosComponent)
      },
      {
        path: 'proveedores',
        canActivate: [roleGuard('ADMIN')],
        loadComponent: () =>
          import('./features/proveedores/proveedores.component').then((m) => m.ProveedoresComponent)
      },
      {
        path: 'blockchain',
        canActivate: [roleGuard('ADMIN')],
        loadComponent: () =>
          import('./features/blockchain/blockchain.component').then((m) => m.BlockchainComponent)
      },
      {
        path: 'inspeccion-ia',
        canActivate: [roleGuard('ADMIN')],
        loadComponent: () =>
          import('./features/inspeccion-ia/inspeccion-ia.component').then((m) => m.InspeccionIaComponent)
      },
      {
        path: 'reportes',
        canActivate: [roleGuard('ADMIN')],
        loadComponent: () =>
          import('./features/reportes/reportes.component').then((m) => m.ReportesComponent)
      },
      {
        path: 'vendedores',
        canActivate: [roleGuard('ADMIN')],
        loadComponent: () =>
          import('./features/vendedores/vendedores.component').then((m) => m.VendedoresComponent)
      },
      {
        path: 'usuarios',
        canActivate: [roleGuard('ADMIN')],
        loadComponent: () =>
          import('./features/usuarios/usuarios.component').then((m) => m.UsuariosComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
