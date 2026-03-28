import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/supabase_service.dart';

class ConfirmScreen extends StatefulWidget {
  const ConfirmScreen({super.key});

  @override
  State<ConfirmScreen> createState() => _ConfirmScreenState();
}

class _ConfirmScreenState extends State<ConfirmScreen> {
  final _montoController = TextEditingController();
  final _proveedorController = TextEditingController();
  final _rucController = TextEditingController();
  final _facturaNumController = TextEditingController();
  final _timbradoController = TextEditingController();
  final _iva10Controller = TextEditingController();
  final _notasController = TextEditingController();
  DateTime _selectedDate = DateTime.now();
  String _tipoGasto = 'otros';
  String? _proyectoId;
  bool _saving = false;

  List<Map<String, dynamic>> _proyectos = [];

  final List<Map<String, String>> _tiposGasto = [
    {'value': 'equipamiento_compra', 'label': 'Equipamiento', 'icon': 'camera'},
    {'value': 'alquiler_equipo', 'label': 'Alquiler Equipo', 'icon': 'car_rental'},
    {'value': 'transporte', 'label': 'Transporte', 'icon': 'directions_car'},
    {'value': 'alimentacion', 'label': 'Alimentación', 'icon': 'restaurant'},
    {'value': 'software_licencias', 'label': 'Software/Licencias', 'icon': 'computer'},
    {'value': 'subcontratacion', 'label': 'Subcontratación', 'icon': 'people'},
    {'value': 'material_produccion', 'label': 'Material Producción', 'icon': 'inventory'},
    {'value': 'marketing', 'label': 'Marketing', 'icon': 'campaign'},
    {'value': 'oficina', 'label': 'Oficina', 'icon': 'business'},
    {'value': 'capacitacion', 'label': 'Capacitación', 'icon': 'school'},
    {'value': 'impuestos', 'label': 'Impuestos', 'icon': 'receipt'},
    {'value': 'otros', 'label': 'Otros', 'icon': 'more_horiz'},
  ];

  Map<String, dynamic>? _invoiceData;
  String? _imagePath;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadInitialData();
    });
  }

  void _loadInitialData() {
    final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    if (args != null) {
      _invoiceData = args;
      _imagePath = args['image_path'];
      
      // Pre-cargar datos del OCR (Soporta formato plano y anidado)
      if (args['monto'] != null) {
        _montoController.text = args['monto'].toString();
      } else if (args['totals']?['total'] != null) {
        _montoController.text = args['totals']['total'].toString();
      }

      if (args['proveedor'] != null) {
        _proveedorController.text = args['proveedor'].toString();
      } else if (args['supplier']?['razon_social'] != null) {
        _proveedorController.text = args['supplier']['razon_social'].toString();
      }

      if (args['supplier']?['ruc'] != null) {
        _rucController.text = args['supplier']['ruc'].toString();
      }

      if (args['document_info']?['numero_factura'] != null) {
        _facturaNumController.text = args['document_info']['numero_factura'].toString();
      }

      if (args['document_info']?['timbrado'] != null) {
        _timbradoController.text = args['document_info']['timbrado'].toString();
      }

      if (args['tax_summary']?['total_gravadas_10'] != null) {
        _iva10Controller.text = args['tax_summary']['total_gravadas_10'].toString();
      } else if (args['tax_summary']?['iva_10'] != null) {
        _iva10Controller.text = args['tax_summary']['iva_10'].toString();
      }

      final rawFecha = args['fecha_factura'] ?? args['document_info']?['fecha_emision'];
      if (rawFecha != null) {
        try {
          _selectedDate = DateTime.parse(rawFecha.toString());
        } catch (e) {
          // Keep current date if parsing fails
        }
      }
    }
    _loadProjects();
  }

  Future<void> _loadProjects() async {
    try {
      final projects = await SupabaseService.getProjects(estado: 'en_progreso');
      if (mounted) {
        setState(() => _proyectos = projects);
      }
    } catch (e) {
      print('Error loading projects: $e');
    }
  }

  Future<void> _selectDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 30)),
    );
    if (date != null && mounted) {
      setState(() => _selectedDate = date);
    }
  }

  Future<void> _saveInvoice() async {
    if (_montoController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('El monto es requerido'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() => _saving = true);

    try {
      final data = {
        'monto': double.tryParse(_montoController.text) ?? 0,
        'fecha_factura': DateFormat('yyyy-MM-dd').format(_selectedDate),
        'proveedor': _proveedorController.text,
        'ruc_proveedor': _rucController.text,
        'numero_factura': _facturaNumController.text,
        'timbrado': _timbradoController.text,
        'iva_10': double.tryParse(_iva10Controller.text) ?? 0,
        'concepto_ocr': _invoiceData?['concepto_ocr'] ?? '',
        'tipo_gasto': _tipoGasto,
        'proyecto_id': _proyectoId,
        'estado': 'pendiente_clasificar',
        'es_deducible': true,
        'imagen_url': _invoiceData?['factura_id'] != null 
            ? '${SupabaseService.userId}/${_invoiceData!['factura_id']}/invoice.jpg'
            : null,
        'notas': _notasController.text,
        'processed_by_n8n': true,
      };

      await SupabaseService.insertExpense(data);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Row(
              children: [
                Icon(Icons.check_circle, color: Colors.white),
                SizedBox(width: 12),
                Text('✅ Factura guardada exitosamente'),
              ],
            ),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          ),
        );
        Navigator.popUntil(context, ModalRoute.withName('/home'));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }

    if (mounted) setState(() => _saving = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Confirmar Factura'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          TextButton(
            onPressed: _saving ? null : _saveInvoice,
            child: _saving
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Guardar', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Info card
            _buildInfoCard(),
            const SizedBox(height: 20),
            
            // Campos del formulario
            _buildFormFields(),
            const SizedBox(height: 24),
            
            // Botón guardar
            _buildSaveButton(),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard() {
    final hasData = _invoiceData != null && 
        (_invoiceData!['monto'] != null || _invoiceData!['proveedor'] != null);
    
    return Card(
      color: hasData ? Colors.green[50] : Colors.orange[50],
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Icon(
              hasData ? Icons.check_circle : Icons.info,
              color: hasData ? Colors.green[700] : Colors.orange[700],
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                hasData
                    ? 'Datos extraídos. Confirma o edita los campos.'
                    : 'No se pudieron extraer datos. Ingresa manualmente.',
                style: TextStyle(
                  color: hasData ? Colors.green[700] : Colors.orange[700],
                  fontWeight: FontWeight.w500,
                  fontSize: 13,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFormFields() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Monto
        TextField(
          controller: _montoController,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: InputDecoration(
            labelText: 'Monto *',
            prefixText: '\$ ',
            prefixIcon: const Icon(Icons.attach_money),
            border: const OutlineInputBorder(),
            helperText: 'monto_total de la factura',
          ),
        ),
        const SizedBox(height: 16),
        
        // Proveedor
        TextField(
          controller: _proveedorController,
          textCapitalization: TextCapitalization.words,
          decoration: const InputDecoration(
            labelText: 'Proveedor',
            prefixIcon: Icon(Icons.store),
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 16),

        Row(
          children: [
            Expanded(
              flex: 2,
              child: TextField(
                controller: _rucController,
                decoration: const InputDecoration(
                  labelText: 'RUC/ID Fiscal',
                  prefixIcon: Icon(Icons.fingerprint),
                  border: OutlineInputBorder(),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              flex: 1,
              child: TextField(
                controller: _iva10Controller,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(
                  labelText: 'IVA 10%',
                  prefixText: '\$ ',
                  border: OutlineInputBorder(),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _facturaNumController,
                decoration: const InputDecoration(
                  labelText: 'Nº Factura',
                  prefixIcon: Icon(Icons.confirmation_number_outlined),
                  border: OutlineInputBorder(),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: TextField(
                controller: _timbradoController,
                decoration: const InputDecoration(
                  labelText: 'Timbrado',
                  prefixIcon: Icon(Icons.verified_user_outlined),
                  border: OutlineInputBorder(),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        
        // Fecha
        Card(
          child: ListTile(
            leading: const Icon(Icons.calendar_today),
            title: const Text('Fecha de factura'),
            subtitle: Text(
              DateFormat('dd MMMM yyyy').format(_selectedDate),
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
            trailing: const Icon(Icons.chevron_right),
            onTap: _selectDate,
          ),
        ),
        const SizedBox(height: 16),
        
        // Tipo de gasto
        DropdownButtonFormField<String>(
          value: _tipoGasto,
          decoration: const InputDecoration(
            labelText: 'Tipo de Gasto',
            prefixIcon: Icon(Icons.category),
            border: OutlineInputBorder(),
          ),
          items: _tiposGasto.map((tipo) {
            return DropdownMenuItem(
              value: tipo['value'],
              child: Text(tipo['label']!),
            );
          }).toList(),
          onChanged: (value) {
            setState(() => _tipoGasto = value!);
          },
        ),
        const SizedBox(height: 16),
        
        // Proyecto (opcional)
        DropdownButtonFormField<String?>(
          value: _proyectoId,
          decoration: const InputDecoration(
            labelText: 'Asignar a Proyecto',
            prefixIcon: Icon(Icons.folder),
            border: OutlineInputBorder(),
            helperText: 'Opcional - vincular gasto a proyecto',
          ),
          items: [
            const DropdownMenuItem<String?>(
              value: null,
              child: Row(
                children: [
                  Icon(Icons.link_off, size: 18, color: Colors.grey),
                  SizedBox(width: 8),
                  Text('Sin proyecto'),
                ],
              ),
            ),
            ..._proyectos.map((p) {
              return DropdownMenuItem<String?>(
                value: p['id'],
                child: Row(
                  children: [
                    const Icon(Icons.folder, size: 18, color: Colors.blue),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        p['nombre_cliente'] ?? 'Sin nombre',
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ],
          onChanged: (value) {
            setState(() => _proyectoId = value);
          },
        ),
        const SizedBox(height: 16),
        
        // Notas
        TextField(
          controller: _notasController,
          maxLines: 3,
          decoration: const InputDecoration(
            labelText: 'Notas (opcional)',
            prefixIcon: Icon(Icons.notes),
            border: OutlineInputBorder(),
            alignLabelWithHint: true,
            hintText: 'Agrega cualquier detalle adicional...',
          ),
        ),
        
        // Concepto OCR (si existe)
        if (_invoiceData?['concepto_ocr'] != null) ...[
          const SizedBox(height: 16),
          ExpansionTile(
            title: const Text('Texto OCR completo'),
            children: [
              Padding(
                padding: const EdgeInsets.all(12),
                child: Text(
                  _invoiceData!['concepto_ocr'],
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[700],
                    fontFamily: 'monospace',
                  ),
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }

  Widget _buildSaveButton() {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton.icon(
        onPressed: _saving ? null : _saveInvoice,
        icon: _saving
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : const Icon(Icons.save),
        label: Text(
          _saving ? 'Guardando...' : 'Guardar Factura',
          style: const TextStyle(fontSize: 16),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.green,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _montoController.dispose();
    _proveedorController.dispose();
    _rucController.dispose();
    _facturaNumController.dispose();
    _timbradoController.dispose();
    _iva10Controller.dispose();
    _notasController.dispose();
    super.dispose();
  }
}
