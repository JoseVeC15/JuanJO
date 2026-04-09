# Reglas de Negocio y Requisitos: Facturación SIFEN / DNIT (Paraguay)

## 1. Requisitos Legales y Administrativos (Lo que debes tener en regla)
Antes de pensar en el software, la empresa debe cumplir con ciertos requisitos ante la DNIT.
- **RUC Activo y Datos Actualizados**: El Registro Único de Contribuyente (RUC) debe estar activo y sin suspensiones.
- **Cumplimiento Fiscal al Día**: No tener deudas pendientes con la DNIT (IVA, IRE/IRP, declaraciones juradas al día).
- **Inscripción como "Emisor Electrónico"**: Solicitar habilitación como facturador electrónico a través del portal *Marangatu*. Allí se gestiona el "timbrado electrónico".
- **Documentación**: Tener a mano estatutos, actas, cédula del representante, etc.

## 2. Requisitos Técnicos y Tecnológicos
Para la integración nativa y manejo vía Software Privado (nuestro caso):
- **Certificado Digital**: Obligatorio. Es la firma electrónica proveída por un ente autorizado por el MIC (costo anual aprox. 200.000 a 500.000 Gs).
- **Software Homologado**: El sistema debe estar preparado para generar XML, conectarse al SIFEN, enviar, firmar y recibir el Código de Aprobación.
- **Infraestructura**: Se debe contar con una sólida conexión y backup de documentos (Supabase en nuestro caso).

## 3. El Proceso de Emisión (En la Práctica)
El flujo sistemático que DEBEMOS seguir al programar la emisión SIFEN:
1. **Emisión**: El sistema genera el comprobante en estricto formato **XML** estándar.
2. **Firma y Envío**: El sistema firma el XML usando el Certificado Digital y dispara la validación síncrona/asíncrona a la DNIT.
3. **Validación (SIFEN)**: La DNIT procesa el paquete y asigna un **Código de Aprobación (CA)** o lo rechaza. (SIN CA, EL DOCUMENTO ES NULO).
4. **Entrega (KuDE / XML)**:
   - Si el cliente es receptor electrónico = se manda el XML validado.
   - Si el cliente NO es electrónico = Se genera el comprobante impreso o PDF llamado **KuDE**, el cual DEBE incluir el Código QR oficial.
