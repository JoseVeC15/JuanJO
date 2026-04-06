# Gestión Documental Eficiente

Finance Pro revolucionará la manera en la que procesas entradas y salidas de dinero. El enfoque es dejar que la tecnología trabaje por ti, convirtiendo fotografías o PDFs en datos financieros puros.

## 📤 Extracción Automatizada (Ingresos y Gastos)

La plataforma cuenta con un núcleo de Inteligencia Artificial que procesa el contenido visual de tus comprobantes.

![Módulo de Gastos](/manuales/gastos.png)
![Módulo de Ingresos](/manuales/ingresos.png)

1. **Subida por Interfaz o Telegram:** Arrastra los PDFs de facturas o reenvía las imágenes desde WhatsApp a nuestro Bot estructurador.
2. **Reconocimiento Óptico (OCR) + Lógica de Negocio:** La IA procesa y extrae el *RUC*, *Monto Total*, *IVA discriminado*, *Concepto* y *Fecha*.
3. **Validación Automática:** Se cruza con el Padrón Nacional o tus reglas prestablecidas. En el 95% de los casos, la carga es en "un solo clic" (Auto-Guardado).

> [!TIP]
> Las carpetas en la nube de tu ordenador también se pueden enlazar (ver Integraciones). Coloca una factura allí, y aparecerá registrada en tu módulo como Borrador automáticamente.

## 🏛️ Integración con SIFEN (DNIT e-Kuatia)
Tu plataforma es compatible de manera bidireccional mediante APIs con el Sistema Integrado de Facturación Electrónica Nacional.

* **Descarga de Recibidos:** Todos los KuDEs emitidos a tu nombre o a tu RUC desde proveedores, pueden importarse directamente al módulo de Gastos de forma periódica, previniendo fraude y evitando perder documentación deducible.
* **Emisión Directa:** Desde el Panel de Ingresos o desde el Centro de Servicios al Cliente puedes emitir Notas de Crédito, Facturas Contado/Crédito Oficialmente validadas ante DNIT.

> [!NOTE]
> Para utilizar la emisión y descarga automática con SIFEN, recuerda haber gestionado tu certificado p12 y tu clave SIFEN de ambiente Producción/Pruebas en la pantalla de *Configuración* -> *Credenciales Fiscales*.

## 🔄 Conciliación Bancaria

En lugar de confirmar a ciegas, el módulo te pide respaldos, integrándolos contra flujos de caja. 
Sube un extracto `.csv` bancario, y Finance Pro asociará los montos de salidas de banco con los Gastos registrados previamente, buscando emparejar Fechas y Montos de tolerancia, consolidando en el *Libro Mayor* tu saldo real impecable.
