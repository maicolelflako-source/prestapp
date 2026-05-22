export interface Profile {
  id: string;
  nombre: string;
  email?: string;
  codigo: string;
  ruta_id?: string;
  rol: string;
  activo: boolean;
  created_at: string;
}

export interface Ruta {
  id: string;
  nombre: string;
  descripcion: string;
}

export interface Cliente {
  id: string;
  ruta_id: string;
  cedula: string;
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  garante: string;
  prioridad: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Credito {
  id: string;
  cliente_id: string;
  ruta_id: string;
  credito_no: string;
  fecha_ini: string;
  fecha_fin?: string;
  capital: number;
  cuota: number;
  cuotas_pactadas: number;
  fecha_cuota?: string;
  forma_pago: string;
  estado: string;
  saldo_capital: number;
  saldo_utilidad: number;
  cuotas_pend: number;
  cuotas_canc: number;
  color_type: string;
  notas: string;
  created_at: string;
  updated_at: string;
  cliente?: Cliente;
}

export interface Abono {
  id: string;
  credito_id: string;
  cliente_id: string;
  ruta_id: string;
  cobrador_id?: string;
  fecha: string;
  valor: number;
  aplicado: boolean;
  created_at: string;
}

export interface Gasto {
  id: string;
  ruta_id: string;
  cobrador_id?: string;
  fecha: string;
  nombre: string;
  concepto: string;
  tipo: string;
  valor: number;
  created_at: string;
}

export type ViewName =
  | 'listado'
  | 'nuevo-cliente'
  | 'ventas'
  | 'gastos'
  | 'totalizar'
  | 'rutas'
  | 'prioridad'
  | 'activar'
  | 'morosos'
  | 'consultas'
  | 'actualizar'
  | 'clave'
  | 'opciones';
