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

