// ============================================
// SAMPLE DATA - FINANCE JuanJo
// SaaS Financiero Freelancer Audiovisual (Paraguay)
// ============================================

export type TipoServicio = 'filmacion' | 'edicion' | 'produccion_completa' | 'fotografia' | 'motion_graphics' | 'drone' | 'live_streaming' | 'otro';
export type EstadoProyecto = 'cotizacion' | 'en_progreso' | 'entregado' | 'facturado' | 'pagado' | 'cancelado';
export type TipoGasto = 'equipamiento_compra' | 'alquiler_equipo' | 'transporte' | 'alimentacion' | 'software_licencias' | 'subcontratacion' | 'material_produccion' | 'marketing' | 'oficina' | 'capacitacion' | 'impuestos' | 'otros';
export type MetodoPago = 'efectivo' | 'transferencia' | 'tarjeta_credito' | 'tarjeta_debito' | 'deposito';
export type EstadoGasto = 'pendiente_clasificar' | 'registrada' | 'en_proceso_pago' | 'pagada';
export type TipoEquipo = 'camara' | 'lente' | 'iluminacion' | 'audio' | 'estabilizador' | 'drone' | 'accesorios' | 'computo' | 'otro';
export type CondicionEquipo = 'nuevo' | 'bueno' | 'regular' | 'reparacion';
export type TipoPropiedad = 'PROPIO' | 'RENTADO';
export type UbicacionEquipo = 'en_stock' | 'en_proyecto' | 'mantenimiento' | 'prestado' | 'vendido';

export interface Profile {
  id: string;
  nombre_completo: string;
  email?: string;
  nivel_acceso: 1 | 2;
  estado?: 'activo' | 'suspendido';
  facturacion_habilitada?: boolean;
  modulos_habilitados?: string[];
  logo_url?: string;
  color_primario?: string;
  portfolio_url?: string;
  telefono_contacto?: string;
  direccion_fisica?: string;
  created_at: string;
}

export interface Proyecto {
  id: string;
  nombre_cliente: string;
  tipo_servicio: TipoServicio;
  descripcion: string;
  fecha_inicio: string;
  fecha_entrega: string;
  monto_presupuestado: number;
  monto_facturado: number;
  margen_objetivo?: number;
  precio_hora?: number;
  horas_estimadas?: number;
  unidad_tiempo?: 'horas' | 'dias';
  estado: EstadoProyecto;
  created_at: string;
}

export interface RegistroHora {
  id: string;
  proyecto_id: string;
  user_id: string;
  descripcion: string;
  cantidad_horas: number;
  fecha: string;
  created_at: string;
}

export interface FacturaGasto {
  id: string;
  proyecto_id: string | null;
  proyecto_nombre?: string;
  imagen_url: string | null;
  monto: number;
  fecha_factura: string;
  proveedor: string;
  ruc_proveedor: string;
  numero_factura: string;
  timbrado: string;
  iva_5: number;
  iva_10: number;
  exentas: number;
  concepto_ocr: string;
  tipo_gasto: TipoGasto;
  es_deducible: boolean;
  metodo_pago: MetodoPago;
  estado: EstadoGasto;
  notas: string;
  created_at: string;
  processed_by_n8n: boolean;
}

export interface Equipo {
  id: string;
  nombre: string;
  tipo: TipoEquipo;
  marca_modelo: string;
  numero_serie: string;
  condicion: CondicionEquipo;
  fecha_compra: string | null;
  costo_compra: number | null;
  tipo_propiedad: TipoPropiedad;
  valor_actual: number | null;
  ubicacion: UbicacionEquipo;
  proyecto_actual_id: string | null;
  proveedor_renta: string | null;
  costo_renta_dia: number | null;
  fecha_inicio_renta: string | null;
  fecha_fin_renta: string | null;
  alerta_enviada: boolean;
  created_at: string;
}

export interface Alerta {
  id: string;
  tipo: 'renta_vence_manana' | 'renta_vence_hoy' | 'pago_pendiente_30dias' | 'proyecto_sin_facturar' | 'equipo_mantenimiento';
  titulo: string;
  descripcion: string;
  severidad: 'critica' | 'advertencia' | 'info';
  fecha: string;
  leida: boolean;
}

export type CondicionVenta = 'contado' | 'credito';

export type EstadoIngreso = 'emitida' | 'enviada' | 'vista' | 'vencida' | 'cobrada';

export interface Ingreso {
  id: string;
  proyecto_id: string | null;
  cliente: string;
  ruc_cliente?: string;
  numero_factura?: string;
  timbrado?: string;
  vencimiento_timbrado?: string;
  condicion_venta?: CondicionVenta;
  cdc?: string;
  monto: number;
  iva_10?: number;
  iva_5?: number;
  exentas?: number;
  fecha_vencimiento?: string;
  enviada_at?: string;
  vista_at?: string;
  fecha?: string;
  fecha_emision?: string;
  estado: EstadoIngreso;
  metodo_pago: MetodoPago | null;
  imagen_url?: string | null;
  notas?: string;
  processed_by_n8n?: boolean;
}

export type TipoTareaAgenda = 'entrega' | 'facturacion' | 'cobro' | 'otro';

export type PrioridadTarea = 'baja' | 'media' | 'alta';

export interface AgendaTarea {
  id: string;
  user_id: string;
  titulo: string;
  descripcion: string;
  fecha_limite: string;
  tipo: TipoTareaAgenda;
  prioridad: PrioridadTarea;
  completada: boolean;
  created_at: string;
}

export interface Propuesta {
  id: string;
  proyecto_id: string;
  user_id: string;
  numero_correlativo: number;
  titulo: string;
  notas_condiciones: string;
  total_neto: number;
  total_iva_10: number;
  total_iva_5: number;
  total_bruto: number;
  estado: 'pendiente' | 'enviado' | 'aceptado' | 'rechazado';
  valido_hasta: string;
  created_at: string;
}

export interface PropuestaItem {
  id: string;
  propuesta_id: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  iva_tipo: number; // 0, 5, 10
}

// ============ PROYECTOS ============
export const proyectos: Proyecto[] = [
  {
    id: 'p1',
    nombre_cliente: 'Tigo Paraguay',
    tipo_servicio: 'produccion_completa',
    descripcion: 'Producción completa de campaña publicitaria navideña 2025',
    fecha_inicio: '2026-01-15',
    fecha_entrega: '2026-03-30',
    monto_presupuestado: 45000000,
    monto_facturado: 30000000,
    estado: 'en_progreso',
    created_at: '2026-01-10',
  },
  {
    id: 'p2',
    nombre_cliente: 'Personal Paraguay',
    tipo_servicio: 'filmacion',
    descripcion: 'Filmación de spots televisivos para nueva campaña "Conectados"',
    fecha_inicio: '2026-02-01',
    fecha_entrega: '2026-03-15',
    monto_presupuestado: 28000000,
    monto_facturado: 28000000,
    estado: 'facturado',
    created_at: '2026-01-25',
  },
  {
    id: 'p3',
    nombre_cliente: 'Banco Itaú',
    tipo_servicio: 'edicion',
    descripcion: 'Edición de video institucional corporativo 2026',
    fecha_inicio: '2026-03-01',
    fecha_entrega: '2026-04-15',
    monto_presupuestado: 18000000,
    monto_facturado: 0,
    estado: 'cotizacion',
    created_at: '2026-02-20',
  },
  {
    id: 'p4',
    nombre_cliente: 'Shopping del Sol',
    tipo_servicio: 'fotografia',
    descripcion: 'Sesión fotográfica de campaña de moda otoño-invierno',
    fecha_inicio: '2026-01-20',
    fecha_entrega: '2026-02-10',
    monto_presupuestado: 12000000,
    monto_facturado: 12000000,
    estado: 'pagado',
    created_at: '2026-01-15',
  },
  {
    id: 'p5',
    nombre_cliente: 'Coca-Cola Paraguay',
    tipo_servicio: 'drone',
    descripcion: 'Filmación aérea con drone para evento corporativo',
    fecha_inicio: '2026-02-20',
    fecha_entrega: '2026-03-05',
    monto_presupuestado: 8500000,
    monto_facturado: 8500000,
    estado: 'entregado',
    created_at: '2026-02-15',
  },
  {
    id: 'p6',
    nombre_cliente: 'Chacomer',
    tipo_servicio: 'motion_graphics',
    descripcion: 'Motion graphics para redes sociales - Pack mensual',
    fecha_inicio: '2026-03-01',
    fecha_entrega: '2026-03-31',
    monto_presupuestado: 15000000,
    monto_facturado: 7500000,
    estado: 'en_progreso',
    created_at: '2026-02-25',
  },
  {
    id: 'p7',
    nombre_cliente: 'Conmebol',
    tipo_servicio: 'live_streaming',
    descripcion: 'Live streaming de evento Copa Sudamericana 2026',
    fecha_inicio: '2026-04-10',
    fecha_entrega: '2026-04-12',
    monto_presupuestado: 35000000,
    monto_facturado: 0,
    estado: 'cotizacion',
    created_at: '2026-03-01',
  },
  {
    id: 'p8',
    nombre_cliente: 'Salemma',
    tipo_servicio: 'fotografia',
    descripcion: 'Lookbook primavera/verano - Catálogo fotográfico completo',
    fecha_inicio: '2025-11-10',
    fecha_entrega: '2025-12-20',
    monto_presupuestado: 20000000,
    monto_facturado: 20000000,
    estado: 'pagado',
    created_at: '2025-11-01',
  },
];

// ============ FACTURAS / GASTOS ============
export const facturasGastos: FacturaGasto[] = [
  {
    id: 'f1',
    proyecto_id: 'p1',
    proyecto_nombre: 'Tigo Paraguay',
    imagen_url: null,
    monto: 2500000,
    fecha_factura: '2026-03-05',
    proveedor: 'Rental Cine PY',
    ruc_proveedor: '80012345-6',
    numero_factura: '001-001-0004521',
    timbrado: '16789012',
    iva_5: 0,
    iva_10: 227273,
    exentas: 0,
    concepto_ocr: 'Alquiler de grúa de cámara Jimmy Jib + operador, 3 días de filmación',
    tipo_gasto: 'alquiler_equipo',
    es_deducible: true,
    metodo_pago: 'transferencia',
    estado: 'pagada',
    notas: 'Alquiler para filmación Tigo',
    created_at: '2026-03-05',
    processed_by_n8n: true,
  },
  {
    id: 'f2',
    proyecto_id: 'p1',
    proyecto_nombre: 'Tigo Paraguay',
    imagen_url: null,
    monto: 850000,
    fecha_factura: '2026-03-08',
    proveedor: 'Estación de Servicio Copetrol',
    ruc_proveedor: '80098765-4',
    numero_factura: '001-002-0089123',
    timbrado: '15234567',
    iva_5: 0,
    iva_10: 77273,
    exentas: 0,
    concepto_ocr: 'Combustible diesel 120 litros + nafta super 40 litros',
    tipo_gasto: 'transporte',
    es_deducible: true,
    metodo_pago: 'tarjeta_debito',
    estado: 'registrada',
    notas: 'Combustible para traslados a Chaco',
    created_at: '2026-03-08',
    processed_by_n8n: true,
  },
  {
    id: 'f3',
    proyecto_id: 'p2',
    proyecto_nombre: 'Personal Paraguay',
    imagen_url: null,
    monto: 1200000,
    fecha_factura: '2026-02-15',
    proveedor: 'Adobe Systems',
    ruc_proveedor: 'EXT-00001',
    numero_factura: 'INV-2026-00412',
    timbrado: 'N/A',
    iva_5: 0,
    iva_10: 0,
    exentas: 1200000,
    concepto_ocr: 'Suscripción Adobe Creative Cloud anual - Licencia empresarial',
    tipo_gasto: 'software_licencias',
    es_deducible: true,
    metodo_pago: 'tarjeta_credito',
    estado: 'pagada',
    notas: 'Licencia anual Adobe CC',
    created_at: '2026-02-15',
    processed_by_n8n: false,
  },
  {
    id: 'f4',
    proyecto_id: 'p1',
    proyecto_nombre: 'Tigo Paraguay',
    imagen_url: null,
    monto: 4500000,
    fecha_factura: '2026-03-10',
    proveedor: 'Juan Carlos Benítez',
    ruc_proveedor: '3456789-0',
    numero_factura: '001-001-0000089',
    timbrado: '17890123',
    iva_5: 0,
    iva_10: 409091,
    exentas: 0,
    concepto_ocr: 'Servicio de catering para equipo de producción (15 personas x 3 días)',
    tipo_gasto: 'alimentacion',
    es_deducible: true,
    metodo_pago: 'efectivo',
    estado: 'registrada',
    notas: '',
    created_at: '2026-03-10',
    processed_by_n8n: true,
  },
  {
    id: 'f5',
    proyecto_id: null,
    proyecto_nombre: undefined,
    imagen_url: null,
    monto: 15000000,
    fecha_factura: '2026-02-28',
    proveedor: 'Casa Paraná - Electrodomésticos',
    ruc_proveedor: '80054321-9',
    numero_factura: '001-001-0012456',
    timbrado: '16543210',
    iva_5: 714286,
    iva_10: 0,
    exentas: 0,
    concepto_ocr: 'Monitor profesional BenQ SW271C 27" 4K para edición de color',
    tipo_gasto: 'equipamiento_compra',
    es_deducible: true,
    metodo_pago: 'tarjeta_credito',
    estado: 'pagada',
    notas: 'Monitor para suite de edición',
    created_at: '2026-02-28',
    processed_by_n8n: true,
  },
  {
    id: 'f6',
    proyecto_id: 'p6',
    proyecto_nombre: 'Chacomer',
    imagen_url: null,
    monto: 3200000,
    fecha_factura: '2026-03-12',
    proveedor: 'María Fernanda López',
    ruc_proveedor: '5678901-2',
    numero_factura: '001-001-0000234',
    timbrado: '18012345',
    iva_5: 0,
    iva_10: 290909,
    exentas: 0,
    concepto_ocr: 'Servicio de asistente de producción - 8 jornadas laborales',
    tipo_gasto: 'subcontratacion',
    es_deducible: true,
    metodo_pago: 'transferencia',
    estado: 'en_proceso_pago',
    notas: 'Asistente para proyecto Chacomer',
    created_at: '2026-03-12',
    processed_by_n8n: true,
  },
  {
    id: 'f7',
    proyecto_id: 'p5',
    proyecto_nombre: 'Coca-Cola Paraguay',
    imagen_url: null,
    monto: 680000,
    fecha_factura: '2026-02-22',
    proveedor: 'Papelería El Triunfo',
    ruc_proveedor: '80076543-1',
    numero_factura: '001-003-0045678',
    timbrado: '15678901',
    iva_5: 32381,
    iva_10: 0,
    exentas: 0,
    concepto_ocr: 'Material de producción: cartulinas, cintas, props para set',
    tipo_gasto: 'material_produccion',
    es_deducible: true,
    metodo_pago: 'efectivo',
    estado: 'registrada',
    notas: '',
    created_at: '2026-02-22',
    processed_by_n8n: true,
  },
  {
    id: 'f8',
    proyecto_id: null,
    proyecto_nombre: undefined,
    imagen_url: null,
    monto: 950000,
    fecha_factura: '2026-03-01',
    proveedor: 'WeWork Asunción',
    ruc_proveedor: '80087654-3',
    numero_factura: '001-001-0007890',
    timbrado: '17234567',
    iva_5: 0,
    iva_10: 86364,
    exentas: 0,
    concepto_ocr: 'Alquiler espacio coworking marzo 2026 - Escritorio dedicado',
    tipo_gasto: 'oficina',
    es_deducible: true,
    metodo_pago: 'transferencia',
    estado: 'pagada',
    notas: 'Oficina mensual',
    created_at: '2026-03-01',
    processed_by_n8n: false,
  },
  {
    id: 'f9',
    proyecto_id: 'p4',
    proyecto_nombre: 'Shopping del Sol',
    imagen_url: null,
    monto: 1800000,
    fecha_factura: '2026-01-25',
    proveedor: 'Taxi Asunción Premium',
    ruc_proveedor: '80034567-8',
    numero_factura: '001-001-0023456',
    timbrado: '16890123',
    iva_5: 85714,
    iva_10: 0,
    exentas: 0,
    concepto_ocr: 'Servicio de transporte ejecutivo - Traslados equipo fotografía 5 días',
    tipo_gasto: 'transporte',
    es_deducible: true,
    metodo_pago: 'efectivo',
    estado: 'registrada',
    notas: '',
    created_at: '2026-01-25',
    processed_by_n8n: true,
  },
  {
    id: 'f10',
    proyecto_id: null,
    proyecto_nombre: undefined,
    imagen_url: null,
    monto: 750000,
    fecha_factura: '2026-03-15',
    proveedor: 'MasterClass Online',
    ruc_proveedor: 'EXT-00002',
    numero_factura: 'MC-2026-98765',
    timbrado: 'N/A',
    iva_5: 0,
    iva_10: 0,
    exentas: 750000,
    concepto_ocr: 'Curso online cinematografía avanzada - Hans Zimmer teaches filmmaking',
    tipo_gasto: 'capacitacion',
    es_deducible: true,
    metodo_pago: 'tarjeta_credito',
    estado: 'pagada',
    notas: '',
    created_at: '2026-03-15',
    processed_by_n8n: false,
  },
];

// ============ INVENTARIO EQUIPO ============
export const inventarioEquipo: Equipo[] = [
  {
    id: 'e1',
    nombre: 'Sony FX6',
    tipo: 'camara',
    marca_modelo: 'Sony FX6 Full Frame',
    numero_serie: 'SN-FX6-2024-001',
    condicion: 'bueno',
    fecha_compra: '2024-06-15',
    costo_compra: 38000000,
    tipo_propiedad: 'PROPIO',
    valor_actual: 30000000,
    ubicacion: 'en_proyecto',
    proyecto_actual_id: 'p1',
    proveedor_renta: null,
    costo_renta_dia: null,
    fecha_inicio_renta: null,
    fecha_fin_renta: null,
    alerta_enviada: false,
    created_at: '2024-06-15',
  },
  {
    id: 'e2',
    nombre: 'Canon R5',
    tipo: 'camara',
    marca_modelo: 'Canon EOS R5 Mirrorless',
    numero_serie: 'SN-R5-2024-003',
    condicion: 'bueno',
    fecha_compra: '2024-03-20',
    costo_compra: 28000000,
    tipo_propiedad: 'PROPIO',
    valor_actual: 22000000,
    ubicacion: 'en_stock',
    proyecto_actual_id: null,
    proveedor_renta: null,
    costo_renta_dia: null,
    fecha_inicio_renta: null,
    fecha_fin_renta: null,
    alerta_enviada: false,
    created_at: '2024-03-20',
  },
  {
    id: 'e3',
    nombre: 'Sigma Art 24-70mm',
    tipo: 'lente',
    marca_modelo: 'Sigma 24-70mm f/2.8 DG DN Art',
    numero_serie: 'SN-SIG-2470-005',
    condicion: 'bueno',
    fecha_compra: '2024-08-10',
    costo_compra: 8500000,
    tipo_propiedad: 'PROPIO',
    valor_actual: 7000000,
    ubicacion: 'en_proyecto',
    proyecto_actual_id: 'p1',
    proveedor_renta: null,
    costo_renta_dia: null,
    fecha_inicio_renta: null,
    fecha_fin_renta: null,
    alerta_enviada: false,
    created_at: '2024-08-10',
  },
  {
    id: 'e4',
    nombre: 'Aputure 600d Pro',
    tipo: 'iluminacion',
    marca_modelo: 'Aputure LS 600d Pro',
    numero_serie: 'SN-APU-600-007',
    condicion: 'nuevo',
    fecha_compra: '2025-12-01',
    costo_compra: 12000000,
    tipo_propiedad: 'PROPIO',
    valor_actual: 11500000,
    ubicacion: 'en_stock',
    proyecto_actual_id: null,
    proveedor_renta: null,
    costo_renta_dia: null,
    fecha_inicio_renta: null,
    fecha_fin_renta: null,
    alerta_enviada: false,
    created_at: '2025-12-01',
  },
  {
    id: 'e5',
    nombre: 'Rode NTG5',
    tipo: 'audio',
    marca_modelo: 'Rode NTG5 Shotgun Mic',
    numero_serie: 'SN-RODE-NTG5-002',
    condicion: 'bueno',
    fecha_compra: '2025-02-14',
    costo_compra: 3500000,
    tipo_propiedad: 'PROPIO',
    valor_actual: 2800000,
    ubicacion: 'en_proyecto',
    proyecto_actual_id: 'p1',
    proveedor_renta: null,
    costo_renta_dia: null,
    fecha_inicio_renta: null,
    fecha_fin_renta: null,
    alerta_enviada: false,
    created_at: '2025-02-14',
  },
  {
    id: 'e6',
    nombre: 'DJI Ronin RS3 Pro',
    tipo: 'estabilizador',
    marca_modelo: 'DJI RS3 Pro Combo',
    numero_serie: 'SN-DJI-RS3-009',
    condicion: 'bueno',
    fecha_compra: '2025-06-20',
    costo_compra: 6800000,
    tipo_propiedad: 'PROPIO',
    valor_actual: 5500000,
    ubicacion: 'en_stock',
    proyecto_actual_id: null,
    proveedor_renta: null,
    costo_renta_dia: null,
    fecha_inicio_renta: null,
    fecha_fin_renta: null,
    alerta_enviada: false,
    created_at: '2025-06-20',
  },
  {
    id: 'e7',
    nombre: 'MacBook Pro M3 Max',
    tipo: 'computo',
    marca_modelo: 'Apple MacBook Pro 16" M3 Max 48GB',
    numero_serie: 'SN-MBP-M3-011',
    condicion: 'nuevo',
    fecha_compra: '2025-11-15',
    costo_compra: 32000000,
    tipo_propiedad: 'PROPIO',
    valor_actual: 30000000,
    ubicacion: 'en_stock',
    proyecto_actual_id: null,
    proveedor_renta: null,
    costo_renta_dia: null,
    fecha_inicio_renta: null,
    fecha_fin_renta: null,
    alerta_enviada: false,
    created_at: '2025-11-15',
  },
  // RENTADOS
  {
    id: 'e8',
    nombre: 'ARRI Alexa Mini LF',
    tipo: 'camara',
    marca_modelo: 'ARRI Alexa Mini LF Kit',
    numero_serie: 'RENTAL-ARRI-001',
    condicion: 'bueno',
    fecha_compra: null,
    costo_compra: null,
    tipo_propiedad: 'RENTADO',
    valor_actual: null,
    ubicacion: 'en_proyecto',
    proyecto_actual_id: 'p1',
    proveedor_renta: 'Rental Cine PY',
    costo_renta_dia: 1500000,
    fecha_inicio_renta: '2026-03-10',
    fecha_fin_renta: '2026-03-20',
    alerta_enviada: false,
    created_at: '2026-03-10',
  },
  {
    id: 'e9',
    nombre: 'DJI Inspire 3',
    tipo: 'drone',
    marca_modelo: 'DJI Inspire 3 Premium Combo',
    numero_serie: 'RENTAL-DJI-002',
    condicion: 'bueno',
    fecha_compra: null,
    costo_compra: null,
    tipo_propiedad: 'RENTADO',
    valor_actual: null,
    ubicacion: 'en_stock',
    proyecto_actual_id: null,
    proveedor_renta: 'DronesPY Rental',
    costo_renta_dia: 800000,
    fecha_inicio_renta: '2026-03-15',
    fecha_fin_renta: '2026-03-18',
    alerta_enviada: true,
    created_at: '2026-03-15',
  },
  {
    id: 'e10',
    nombre: 'Sennheiser MKH 416',
    tipo: 'audio',
    marca_modelo: 'Sennheiser MKH 416-P48U3',
    numero_serie: 'RENTAL-SEN-003',
    condicion: 'bueno',
    fecha_compra: null,
    costo_compra: null,
    tipo_propiedad: 'RENTADO',
    valor_actual: null,
    ubicacion: 'en_proyecto',
    proyecto_actual_id: 'p1',
    proveedor_renta: 'Audio Pro Paraguay',
    costo_renta_dia: 250000,
    fecha_inicio_renta: '2026-03-10',
    fecha_fin_renta: '2026-03-22',
    alerta_enviada: false,
    created_at: '2026-03-10',
  },
];

// ============ ALERTAS ============
export const alertas: Alerta[] = [
  {
    id: 'a1',
    tipo: 'renta_vence_hoy',
    titulo: 'ARRI Alexa Mini LF — Renta vence HOY',
    descripcion: 'El equipo rentado de Rental Cine PY vence hoy. Coordinar devolución o extensión.',
    severidad: 'critica',
    fecha: '2026-03-20',
    leida: false,
  },
  {
    id: 'a2',
    tipo: 'renta_vence_manana',
    titulo: 'Sennheiser MKH 416 — Renta vence mañana',
    descripcion: 'Micrófono rentado de Audio Pro Paraguay vence el 22/03. Confirmar devolución.',
    severidad: 'advertencia',
    fecha: '2026-03-21',
    leida: false,
  },
  {
    id: 'a3',
    tipo: 'pago_pendiente_30dias',
    titulo: 'Pago pendiente — Personal Paraguay',
    descripcion: 'El proyecto "Spots Conectados" tiene ₲28.000.000 facturados sin cobrar hace 30+ días.',
    severidad: 'advertencia',
    fecha: '2026-03-15',
    leida: false,
  },
  {
    id: 'a4',
    tipo: 'proyecto_sin_facturar',
    titulo: 'Proyecto sin facturar — Coca-Cola',
    descripcion: 'El proyecto de filmación aérea está entregado pero no se ha emitido factura al cliente.',
    severidad: 'info',
    fecha: '2026-03-10',
    leida: true,
  },
  {
    id: 'a5',
    tipo: 'equipo_mantenimiento',
    titulo: 'Mantenimiento programado — Sony FX6',
    descripcion: 'La cámara Sony FX6 cumple 18 meses de uso. Se recomienda limpieza de sensor.',
    severidad: 'info',
    fecha: '2026-03-01',
    leida: true,
  },
];

// ============ INGRESOS ============
export const ingresos: Ingreso[] = [
  { id: 'i1', proyecto_id: 'p1', cliente: 'Tigo Paraguay', ruc_cliente: '80012345-6', numero_factura: '001-001-000001', timbrado: '12345678', condicion_venta: 'contado', monto: 15000000, iva_10: 1363636, fecha: '2026-02-01', fecha_vencimiento: '2026-02-15', estado: 'cobrada', metodo_pago: 'transferencia', processed_by_n8n: true },
  { id: 'i2', proyecto_id: 'p1', cliente: 'Tigo Paraguay', ruc_cliente: '80012345-6', numero_factura: '001-001-000002', timbrado: '12345678', condicion_venta: 'contado', monto: 15000000, iva_10: 1363636, fecha: '2026-03-01', fecha_vencimiento: '2026-03-15', estado: 'cobrada', metodo_pago: 'transferencia', processed_by_n8n: true },
  { id: 'i3', proyecto_id: 'p2', cliente: 'Personal Paraguay', ruc_cliente: '80098765-4', numero_factura: '001-001-000003', timbrado: '15234567', condicion_venta: 'credito', monto: 14000000, iva_10: 1272727, fecha: '2026-02-20', fecha_vencimiento: '2026-03-20', estado: 'cobrada', metodo_pago: 'transferencia', processed_by_n8n: true },
  { id: 'i4', proyecto_id: 'p2', cliente: 'Personal Paraguay', ruc_cliente: '80098765-4', numero_factura: '001-001-000004', timbrado: '15234567', condicion_venta: 'credito', monto: 14000000, iva_10: 1272727, fecha: '2026-03-15', fecha_vencimiento: '2026-04-15', estado: 'enviada', metodo_pago: null, processed_by_n8n: false },
  { id: 'i5', proyecto_id: 'p4', cliente: 'Shopping del Sol', ruc_cliente: '80054321-9', numero_factura: '001-001-000005', timbrado: '16543210', condicion_venta: 'contado', monto: 12000000, iva_10: 1090909, fecha: '2026-02-15', fecha_vencimiento: '2026-02-28', estado: 'cobrada', metodo_pago: 'deposito', processed_by_n8n: true },
];

// ============ FINANCIAL MONTHLY DATA ============
export const monthlyFinancials = [
  { mes: 'Oct', ingresos: 18000000, gastos: 5200000 },
  { mes: 'Nov', ingresos: 22000000, gastos: 7800000 },
  { mes: 'Dic', ingresos: 32000000, gastos: 12500000 },
  { mes: 'Ene', ingresos: 27000000, gastos: 9600000 },
  { mes: 'Feb', ingresos: 41000000, gastos: 18200000 },
  { mes: 'Mar', ingresos: 37500000, gastos: 14930000 },
];

// ============ HELPERS ============
export const formatGs = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₲ 0';
  return '₲ ' + amount.toLocaleString('es-PY');
};

export const formatGsShort = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₲ 0';
  if (amount >= 1000000) {
    return '₲ ' + (amount / 1000000).toFixed(1) + 'M';
  }
  if (amount >= 1000) {
    return '₲ ' + (amount / 1000).toFixed(0) + 'k';
  }
  return '₲ ' + amount.toLocaleString('es-PY');
};

export const getServiceIcon = (tipo: TipoServicio): string => {
  const icons: Record<TipoServicio, string> = {
    filmacion: '🎬',
    edicion: '✂️',
    produccion_completa: '🎥',
    fotografia: '📸',
    motion_graphics: '✨',
    drone: '🚁',
    live_streaming: '📡',
    otro: '📁',
  };
  return icons[tipo] || '📁';
};

export const getServiceLabel = (tipo: TipoServicio): string => {
  const labels: Record<TipoServicio, string> = {
    filmacion: 'Filmación',
    edicion: 'Edición',
    produccion_completa: 'Producción Completa',
    fotografia: 'Fotografía',
    motion_graphics: 'Motion Graphics',
    drone: 'Drone',
    live_streaming: 'Live Streaming',
    otro: 'Otro',
  };
  return labels[tipo] || tipo;
};

export const getStatusColor = (estado: EstadoProyecto): string => {
  const colors: Record<EstadoProyecto, string> = {
    cotizacion: '#3B82F6',
    en_progreso: '#F59E0B',
    entregado: '#8B5CF6',
    facturado: '#14B8A6',
    pagado: '#10B981',
    cancelado: '#EF4444',
  };
  return colors[estado] || '#6B7280';
};

export type TipoComprobante = 'factura_comercial' | 'nota_credito' | 'nota_debito' | 'recibo';

export interface FacturaAutoimpreso {
  id: string;
  user_id: string;
  tipo_comprobante: TipoComprobante;
  numero_documento: string; // XXX-XXX-XXXXXXX
  timbrado: string;
  vencimiento_timbrado?: string;
  fecha_emision: string;
  razon_social: string;
  ruc: string;
  condicion_operacion: 'contado' | 'credito';
  monto_total: number;
  iva_10: number;
  iva_5: number;
  exentas: number;
  establecimiento: string;
  punto_expedicion: string;
  estado: 'emitido' | 'anulado';
  imagen_url: string | null;
  notas: string;
  created_at: string;
}

export const TIPO_COMPROBANTE_CONFIG: Record<TipoComprobante, { label: string; sigla: string; icon: string; color: string }> = {
  factura_comercial: { label: 'Factura Comercial', sigla: 'FC', icon: '📄', color: '#10B981' },
  nota_credito: { label: 'Nota de Crédito', sigla: 'NC', icon: '🔙', color: '#F59E0B' },
  nota_debito: { label: 'Nota de Débito', sigla: 'ND', icon: '➕', color: '#EF4444' },
  recibo: { label: 'Recibo', sigla: 'REC', icon: '🧾', color: '#3B82F6' },
};

export const getStatusLabel = (estado: EstadoProyecto): string => {
  const labels: Record<EstadoProyecto, string> = {
    cotizacion: 'Cotización',
    en_progreso: 'En Progreso',
    entregado: 'Entregado',
    facturado: 'Facturado',
    pagado: 'Pagado',
    cancelado: 'Cancelado',
  };
  return labels[estado] || estado;
};

export const getEquipmentIcon = (tipo: TipoEquipo): string => {
  const icons: Record<TipoEquipo, string> = {
    camara: '📷',
    lente: '🔍',
    iluminacion: '💡',
    audio: '🎤',
    estabilizador: '📱',
    drone: '🚁',
    accesorios: '🎒',
    computo: '💻',
    otro: '📦',
  };
  return icons[tipo] || '📦';
};

export const getGastoLabel = (tipo: TipoGasto): string => {
  const labels: Record<TipoGasto, string> = {
    equipamiento_compra: 'Equipamiento',
    alquiler_equipo: 'Alquiler',
    transporte: 'Transporte',
    alimentacion: 'Alimentación',
    software_licencias: 'Software',
    subcontratacion: 'Personal',
    material_produccion: 'Materiales',
    marketing: 'Marketing',
    oficina: 'Oficina',
    capacitacion: 'Formación',
    impuestos: 'Impuestos',
    otros: 'Otros',
  };
  return labels[tipo] || tipo;
};

export const getGastoColor = (tipo: TipoGasto): string => {
  const colors: Record<TipoGasto, string> = {
    equipamiento_compra: '#3B82F6',
    alquiler_equipo: '#6366F1',
    transporte: '#8B5CF6',
    alimentacion: '#EC4899',
    software_licencias: '#06B6D4',
    subcontratacion: '#10B981',
    material_produccion: '#F59E0B',
    marketing: '#EF4444',
    oficina: '#64748B',
    capacitacion: '#D946EF',
    impuestos: '#475569',
    otros: '#94A3B8',
  };
  return colors[tipo] || '#94A3B8';
};

export const calculateSuggestedVAT10 = (total: number) => {
  const totalNum = Number(total);
  if (isNaN(totalNum) || totalNum <= 0) return { iva_10: 0, iva_5: 0, exentas: 0 };
  return { 
    iva_10: Math.floor(totalNum / 11), 
    iva_5: 0, 
    exentas: 0 
  };
};

export const calculateSuggestedVAT5 = (total: number) => {
  const totalNum = Number(total);
  if (isNaN(totalNum) || totalNum <= 0) return { iva_10: 0, iva_5: 0, exentas: 0 };
  return { 
    iva_10: 0, 
    iva_5: Math.floor(totalNum / 21), 
    exentas: 0 
  };
};

/**
 * Calcula la fecha de vencimiento del IVA (F120) según terminación de RUC.
 * Regla SET/DNIT: 0 -> 7, 1 -> 8, ..., 9 -> 16.
 * Si cae en fin de semana, se traslada al siguiente día hábil.
 */
// ============ FLOTA LOGISTICA ============

export type TipoNegocio = 'audiovisual' | 'logistica';
export type TipoVehiculo = 'camion' | 'camioneta' | 'furgon' | 'remolque' | 'otro';
export type TipoPropiedadVehiculo = 'propietario' | 'alquilado';
export type EstadoVehiculo = 'activo' | 'mantenimiento' | 'fuera_servicio';
export type TipoMantenimiento = 'preventivo' | 'correctivo' | 'neumaticos' | 'aceite' | 'frenos' | 'otro';
export type EstadoViaje = 'pendiente' | 'en_curso' | 'completado' | 'facturado' | 'anulado';

export interface Vehiculo {
  id: string;
  user_id: string;
  patente: string;
  marca_modelo: string;
  anio: number | null;
  tipo_vehiculo: TipoVehiculo;
  tipo_propiedad: TipoPropiedadVehiculo;
  costo_adquisicion: number | null;
  valor_actual: number | null;
  fecha_compra: string | null;
  proveedor_alquiler: string | null;
  costo_alquiler_diario: number | null;
  costo_alquiler_mensual: number | null;
  fecha_inicio_alquiler: string | null;
  fecha_fin_alquiler: string | null;
  estado: EstadoVehiculo;
  capacidad_carga_kg: number | null;
  km_actual: number | null;
  created_at: string;
}

export interface RegistroCombustible {
  id: string;
  user_id: string;
  vehiculo_id: string;
  fecha: string;
  cantidad_litros: number;
  precio_total: number;
  precio_por_litro: number | null;
  estacion: string | null;
  km_actual: number | null;
  created_at: string;
}

export interface RegistroMantenimiento {
  id: string;
  user_id: string;
  vehiculo_id: string;
  fecha: string;
  tipo: TipoMantenimiento;
  descripcion: string | null;
  costo: number;
  proveedor: string | null;
  km_actual: number | null;
  proximo_mantenimiento_km: number | null;
  proxima_fecha_mantenimiento: string | null;
  created_at: string;
}

export interface Viaje {
  id: string;
  user_id: string;
  vehiculo_id: string;
  cliente: string;
  ruc_cliente: string | null;
  origen: string | null;
  destino: string | null;
  fecha_salida: string | null;
  fecha_llegada: string | null;
  km_recorridos: number | null;
  ingreso_total: number | null;
  estado: EstadoViaje;
  created_at: string;
}

export const getVehiculoIcon = (tipo: TipoVehiculo): string => {
  const icons: Record<TipoVehiculo, string> = {
    camion: '🚛',
    camioneta: '🛻',
    furgon: '🚐',
    remolque: '🚚',
    otro: '📦',
  };
  return icons[tipo] || '📦';
};

export const getVehiculoLabel = (tipo: TipoVehiculo): string => {
  const labels: Record<TipoVehiculo, string> = {
    camion: 'Camion',
    camioneta: 'Camioneta',
    furgon: 'Furgon',
    remolque: 'Remolque',
    otro: 'Otro',
  };
  return labels[tipo] || tipo;
};

export const getVehiculoColor = (estado: EstadoVehiculo): string => {
  const colors: Record<EstadoVehiculo, string> = {
    activo: '#10B981',
    mantenimiento: '#F59E0B',
    fuera_servicio: '#EF4444',
  };
  return colors[estado] || '#6B7280';
};

export const getVehiculoEstadoLabel = (estado: EstadoVehiculo): string => {
  const labels: Record<EstadoVehiculo, string> = {
    activo: 'Activo',
    mantenimiento: 'En Mantenimiento',
    fuera_servicio: 'Fuera de Servicio',
  };
  return labels[estado] || estado;
};

export const getMantenimientoLabel = (tipo: TipoMantenimiento): string => {
  const labels: Record<TipoMantenimiento, string> = {
    preventivo: 'Preventivo',
    correctivo: 'Correctivo',
    neumaticos: 'Neumaticos',
    aceite: 'Cambio de Aceite',
    frenos: 'Frenos',
    otro: 'Otro',
  };
  return labels[tipo] || tipo;
};

export const getMantenimientoColor = (tipo: TipoMantenimiento): string => {
  const colors: Record<TipoMantenimiento, string> = {
    preventivo: '#3B82F6',
    correctivo: '#EF4444',
    neumaticos: '#F59E0B',
    aceite: '#10B981',
    frenos: '#8B5CF6',
    otro: '#64748B',
  };
  return colors[tipo] || '#94A3B8';
};

export const getViajeEstadoLabel = (estado: EstadoViaje): string => {
  const labels: Record<EstadoViaje, string> = {
    pendiente: 'Pendiente',
    en_curso: 'En Curso',
    completado: 'Completado',
    facturado: 'Facturado',
    anulado: 'Anulado',
  };
  return labels[estado] || estado;
};

export const getViajeEstadoColor = (estado: EstadoViaje): string => {
  const colors: Record<EstadoViaje, string> = {
    pendiente: '#64748B',
    en_curso: '#3B82F6',
    completado: '#10B981',
    facturado: '#8B5CF6',
    anulado: '#EF4444',
  };
  return colors[estado] || '#94A3B8';
};

// ============ SEED DATA FLOTA LOGISTICA ============

export const vehiculosSeed: Vehiculo[] = [
  {
    id: 'v1', user_id: 'demo', patente: 'ABC-123', marca_modelo: 'Volkswagen Delivery 8.160',
    anio: 2022, tipo_vehiculo: 'camion', tipo_propiedad: 'propietario',
    costo_adquisicion: 280000000, valor_actual: 245000000, fecha_compra: '2022-03-15',
    proveedor_alquiler: null, costo_alquiler_diario: null, costo_alquiler_mensual: null,
    fecha_inicio_alquiler: null, fecha_fin_alquiler: null,
    estado: 'activo', capacidad_carga_kg: 8160, km_actual: 85000, created_at: '2022-03-15',
  },
  {
    id: 'v2', user_id: 'demo', patente: 'DEF-456', marca_modelo: 'Mercedes-Benz Atego 1725',
    anio: 2021, tipo_vehiculo: 'camion', tipo_propiedad: 'propietario',
    costo_adquisicion: 350000000, valor_actual: 298000000, fecha_compra: '2021-07-20',
    proveedor_alquiler: null, costo_alquiler_diario: null, costo_alquiler_mensual: null,
    fecha_inicio_alquiler: null, fecha_fin_alquiler: null,
    estado: 'activo', capacidad_carga_kg: 17000, km_actual: 120000, created_at: '2021-07-20',
  },
  {
    id: 'v3', user_id: 'demo', patente: 'GHI-789', marca_modelo: 'Scania P360',
    anio: 2023, tipo_vehiculo: 'camion', tipo_propiedad: 'propietario',
    costo_adquisicion: 520000000, valor_actual: 468000000, fecha_compra: '2023-01-10',
    proveedor_alquiler: null, costo_alquiler_diario: null, costo_alquiler_mensual: null,
    fecha_inicio_alquiler: null, fecha_fin_alquiler: null,
    estado: 'activo', capacidad_carga_kg: 25000, km_actual: 62000, created_at: '2023-01-10',
  },
  {
    id: 'v4', user_id: 'demo', patente: 'JKL-012', marca_modelo: 'Iveco Daily 70C17',
    anio: 2023, tipo_vehiculo: 'camioneta', tipo_propiedad: 'propietario',
    costo_adquisicion: 185000000, valor_actual: 167000000, fecha_compra: '2023-06-01',
    proveedor_alquiler: null, costo_alquiler_diario: null, costo_alquiler_mensual: null,
    fecha_inicio_alquiler: null, fecha_fin_alquiler: null,
    estado: 'mantenimiento', capacidad_carga_kg: 7000, km_actual: 45000, created_at: '2023-06-01',
  },
  {
    id: 'v5', user_id: 'demo', patente: 'MNO-345', marca_modelo: 'Renault D-16 Wide',
    anio: 2020, tipo_vehiculo: 'camion', tipo_propiedad: 'propietario',
    costo_adquisicion: 310000000, valor_actual: 217000000, fecha_compra: '2020-11-05',
    proveedor_alquiler: null, costo_alquiler_diario: null, costo_alquiler_mensual: null,
    fecha_inicio_alquiler: null, fecha_fin_alquiler: null,
    estado: 'activo', capacidad_carga_kg: 16000, km_actual: 156000, created_at: '2020-11-05',
  },
  {
    id: 'v6', user_id: 'demo', patente: 'PQR-678', marca_modelo: 'Volvo FH 540',
    anio: 2024, tipo_vehiculo: 'camion', tipo_propiedad: 'alquilado',
    costo_adquisicion: null, valor_actual: null, fecha_compra: null,
    proveedor_alquiler: 'Transportsa Paraguay SRL', costo_alquiler_diario: 1800000, costo_alquiler_mensual: 45000000,
    fecha_inicio_alquiler: '2026-01-01', fecha_fin_alquiler: '2026-12-31',
    estado: 'activo', capacidad_carga_kg: 30000, km_actual: 32000, created_at: '2026-01-01',
  },
];

export const registroCombustibleSeed: RegistroCombustible[] = [
  { id: 'c1', user_id: 'demo', vehiculo_id: 'v1', fecha: '2026-04-01', cantidad_litros: 120, precio_total: 600000, precio_por_litro: 5000, estacion: 'Copetrol Ruta 2', km_actual: 84500, created_at: '2026-04-01' },
  { id: 'c2', user_id: 'demo', vehiculo_id: 'v1', fecha: '2026-04-03', cantidad_litros: 95, precio_total: 475000, precio_por_litro: 5000, estacion: 'Puma Asuncion', km_actual: 84800, created_at: '2026-04-03' },
  { id: 'c3', user_id: 'demo', vehiculo_id: 'v2', fecha: '2026-04-02', cantidad_litros: 180, precio_total: 900000, precio_por_litro: 5000, estacion: 'Copetrol Ruta 2', km_actual: 119500, created_at: '2026-04-02' },
  { id: 'c4', user_id: 'demo', vehiculo_id: 'v3', fecha: '2026-04-01', cantidad_litros: 250, precio_total: 1250000, precio_por_litro: 5000, estacion: 'Axion Luque', km_actual: 61500, created_at: '2026-04-01' },
  { id: 'c5', user_id: 'demo', vehiculo_id: 'v3', fecha: '2026-04-04', cantidad_litros: 230, precio_total: 1150000, precio_por_litro: 5000, estacion: 'Copetrol Encarnacion', km_actual: 62000, created_at: '2026-04-04' },
  { id: 'c6', user_id: 'demo', vehiculo_id: 'v5', fecha: '2026-04-02', cantidad_litros: 140, precio_total: 700000, precio_por_litro: 5000, estacion: 'Puma San Lorenzo', km_actual: 155200, created_at: '2026-04-02' },
  { id: 'c7', user_id: 'demo', vehiculo_id: 'v6', fecha: '2026-04-01', cantidad_litros: 300, precio_total: 1500000, precio_por_litro: 5000, estacion: 'Copetrol Ruta 2', km_actual: 31500, created_at: '2026-04-01' },
  { id: 'c8', user_id: 'demo', vehiculo_id: 'v6', fecha: '2026-04-05', cantidad_litros: 280, precio_total: 1400000, precio_por_litro: 5000, estacion: 'Axion Caacupe', km_actual: 32000, created_at: '2026-04-05' },
  { id: 'c9', user_id: 'demo', vehiculo_id: 'v4', fecha: '2026-03-28', cantidad_litros: 60, precio_total: 300000, precio_por_litro: 5000, estacion: 'Puma Asuncion', km_actual: 44900, created_at: '2026-03-28' },
  { id: 'c10', user_id: 'demo', vehiculo_id: 'v2', fecha: '2026-04-05', cantidad_litros: 165, precio_total: 825000, precio_por_litro: 5000, estacion: 'Copetrol Ruta 2', km_actual: 120000, created_at: '2026-04-05' },
];

export const registroMantenimientoSeed: RegistroMantenimiento[] = [
  { id: 'm1', user_id: 'demo', vehiculo_id: 'v4', fecha: '2026-04-05', tipo: 'correctivo', descripcion: 'Reparacion sistema de freno neumático', costo: 4500000, proveedor: 'Talleres Rodriguez SRL', km_actual: 45000, proximo_mantenimiento_km: null, proxima_fecha_mantenimiento: null, created_at: '2026-04-05' },
  { id: 'm2', user_id: 'demo', vehiculo_id: 'v1', fecha: '2026-03-25', tipo: 'preventivo', descripcion: 'Service 80.000 km — filtros, aceite, revisión general', costo: 2800000, proveedor: 'VW Centro de Servicio', km_actual: 84000, proximo_mantenimiento_km: 90000, proxima_fecha_mantenimiento: '2026-07-01', created_at: '2026-03-25' },
  { id: 'm3', user_id: 'demo', vehiculo_id: 'v3', fecha: '2026-04-02', tipo: 'neumaticos', descripcion: 'Cambio de 4 neumaticos traseros Michelin XDA', costo: 8500000, proveedor: 'Neumaticos Paraguay', km_actual: 61500, proximo_mantenimiento_km: null, proxima_fecha_mantenimiento: null, created_at: '2026-04-02' },
  { id: 'm4', user_id: 'demo', vehiculo_id: 'v2', fecha: '2026-03-20', tipo: 'aceite', descripcion: 'Cambio de aceite y filtros', costo: 1200000, proveedor: 'Mercedes-Benz Servicio', km_actual: 119000, proximo_mantenimiento_km: 130000, proxima_fecha_mantenimiento: '2026-08-15', created_at: '2026-03-20' },
  { id: 'm5', user_id: 'demo', vehiculo_id: 'v6', fecha: '2026-04-03', tipo: 'frenos', descripcion: 'Reemplazo pastillas de freno completas', costo: 3200000, proveedor: 'Volvo Service Paraguay', km_actual: 31800, proximo_mantenimiento_km: null, proxima_fecha_mantenimiento: '2026-07-15', created_at: '2026-04-03' },
];

export const viajesSeed: Viaje[] = [
  { id: 't1', user_id: 'demo', vehiculo_id: 'v1', cliente: 'Coca-Cola FEMSA', ruc_cliente: '80001234-5', origen: 'Asuncion', destino: 'Ciudad del Este', fecha_salida: '2026-04-01', fecha_llegada: '2026-04-01', km_recorridos: 330, ingreso_total: 4500000, estado: 'completado', created_at: '2026-04-01' },
  { id: 't2', user_id: 'demo', vehiculo_id: 'v1', cliente: 'Coca-Cola FEMSA', ruc_cliente: '80001234-5', origen: 'Asuncion', destino: 'Encarnacion', fecha_salida: '2026-04-03', fecha_llegada: '2026-04-03', km_recorridos: 370, ingreso_total: 5200000, estado: 'completado', created_at: '2026-04-03' },
  { id: 't3', user_id: 'demo', vehiculo_id: 'v2', cliente: 'Arca Continental', ruc_cliente: '80056789-1', origen: 'Asuncion', destino: 'Concepcion', fecha_salida: '2026-04-02', fecha_llegada: '2026-04-02', km_recorridos: 380, ingreso_total: 6800000, estado: 'completado', created_at: '2026-04-02' },
  { id: 't4', user_id: 'demo', vehiculo_id: 'v3', cliente: 'Coca-Cola FEMSA', ruc_cliente: '80001234-5', origen: 'Asuncion', destino: 'Salto del Guaira', fecha_salida: '2026-04-04', fecha_llegada: null, km_recorridos: null, ingreso_total: 8500000, estado: 'en_curso', created_at: '2026-04-04' },
  { id: 't5', user_id: 'demo', vehiculo_id: 'v5', cliente: 'Distribuidora Parana', ruc_cliente: '80034567-0', origen: 'Asuncion', destino: 'Pedro Juan Caballero', fecha_salida: '2026-04-02', fecha_llegada: '2026-04-02', km_recorridos: 450, ingreso_total: 7200000, estado: 'completado', created_at: '2026-04-02' },
  { id: 't6', user_id: 'demo', vehiculo_id: 'v6', cliente: 'Coca-Cola FEMSA', ruc_cliente: '80001234-5', origen: 'Asuncion', destino: 'Ayolas', fecha_salida: '2026-04-05', fecha_llegada: null, km_recorridos: null, ingreso_total: 9500000, estado: 'en_curso', created_at: '2026-04-05' },
  { id: 't7', user_id: 'demo', vehiculo_id: 'v2', cliente: 'Arca Continental', ruc_cliente: '80056789-1', origen: 'Asuncion', destino: 'Villarrica', fecha_salida: '2026-04-05', fecha_llegada: null, km_recorridos: null, ingreso_total: 4800000, estado: 'pendiente', created_at: '2026-04-05' },
  { id: 't8', user_id: 'demo', vehiculo_id: 'v5', cliente: 'Distribuidora Parana', ruc_cliente: '80034567-0', origen: 'Asuncion', destino: 'Pilar', fecha_salida: '2026-04-06', fecha_llegada: null, km_recorridos: null, ingreso_total: 5500000, estado: 'pendiente', created_at: '2026-04-06' },
];

export const getIVAExpirationDate = (ruc: string | undefined | null, month: number, year: number): Date => {
  if (!ruc) return new Date(year, month, 10); // Default day 10 if no RUC
  
  // Extraer el último dígito antes del guion
  const rucBase = ruc.split('-')[0];
  const lastDigit = parseInt(rucBase.charAt(rucBase.length - 1));
  
  // Tabla de vencimientos: 0 -> 7, 1 -> 8, ..., 9 -> 16
  let day = 7 + lastDigit;
  
  // El mes de presentación es el mes SIGUIENTE al periodo liquidado
  // Si liquidamos Marzo (month=3), presentamos en Abril.
  let expirationDate = new Date(year, month, day); 
  
  // Ajuste por fin de semana (DNIT: Siguiente día hábil)
  const dayOfWeek = expirationDate.getDay();
  if (dayOfWeek === 0) { // Domingo
    expirationDate.setDate(expirationDate.getDate() + 1);
  } else if (dayOfWeek === 6) { // Sábado
    expirationDate.setDate(expirationDate.getDate() + 2);
  }
  
  return expirationDate;
};
