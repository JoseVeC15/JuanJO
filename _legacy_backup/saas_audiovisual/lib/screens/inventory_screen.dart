import 'package:flutter/material.dart';
import '../services/supabase_service.dart';

class InventoryScreen extends StatefulWidget {
  const InventoryScreen({super.key});

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Map<String, dynamic>> _ownEquipment = [];
  List<Map<String, dynamic>> _rentedEquipment = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadEquipment();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadEquipment() async {
    setState(() => _loading = true);
    try {
      final own = await SupabaseService.getEquipment(tipoPropiedad: 'PROPIO');
      final rented = await SupabaseService.getEquipment(tipoPropiedad: 'RENTADO');
      setState(() {
        _ownEquipment = own;
        _rentedEquipment = rented;
      });
    } catch (e) {
      print('Error loading equipment: $e');
    }
    setState(() => _loading = false);
  }

  void _showEquipmentDialog([Map<String, dynamic>? equipment]) {
    final isEditing = equipment != null;
    final isRented = equipment?['tipo_propiedad'] == 'RENTADO' ?? false;
    final _formKey = GlobalKey<FormState>();
    
    final _nombreController = TextEditingController(text: equipment?['nombre'] ?? '');
    final _marcaModeloController = TextEditingController(text: equipment?['marca_modelo'] ?? '');
    final _numeroSerieController = TextEditingController(text: equipment?['numero_serie'] ?? '');
    final _costoController = TextEditingController(
      text: equipment?['costo_compra']?.toString() ?? '',
    );
    final _valorActualController = TextEditingController(
      text: equipment?['valor_actual']?.toString() ?? '',
    );
    
    // Rented fields
    final _proveedorController = TextEditingController(text: equipment?['proveedor_renta'] ?? '');
    final _costoRentaController = TextEditingController(
      text: equipment?['costo_renta_dia']?.toString() ?? '',
    );

    String _selectedTipo = equipment?['tipo'] ?? 'camara';
    String _selectedCondicion = equipment?['condicion'] ?? 'bueno';
    String _selectedPropiedad = equipment?['tipo_propiedad'] ?? 'PROPIO';
    String _selectedUbicacion = equipment?['ubicacion'] ?? 'en_stock';
    
    DateTime? _fechaCompra = equipment != null && equipment['fecha_compra'] != null
        ? DateTime.parse(equipment['fecha_compra'])
        : null;
    DateTime? _fechaInicioRenta = equipment != null && equipment['fecha_inicio_renta'] != null
        ? DateTime.parse(equipment['fecha_inicio_renta'])
        : null;
    DateTime? _fechaFinRenta = equipment != null && equipment['fecha_fin_renta'] != null
        ? DateTime.parse(equipment['fecha_fin_renta'])
        : null;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Text(isEditing ? 'Editar Equipo' : 'Agregar Equipo'),
          content: SingleChildScrollView(
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextFormField(
                    controller: _nombreController,
                    decoration: const InputDecoration(
                      labelText: 'Nombre del Equipo',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) =>
                        value?.isEmpty ?? true ? 'Campo requerido' : null,
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: _selectedTipo,
                    decoration: const InputDecoration(
                      labelText: 'Tipo de Equipo',
                      border: OutlineInputBorder(),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'camara', child: Text('Cámara')),
                      DropdownMenuItem(value: 'lente', child: Text('Lente')),
                      DropdownMenuItem(value: 'iluminacion', child: Text('Iluminación')),
                      DropdownMenuItem(value: 'audio', child: Text('Audio')),
                      DropdownMenuItem(value: 'estabilizador', child: Text('Estabilizador')),
                      DropdownMenuItem(value: 'drone', child: Text('Drone')),
                      DropdownMenuItem(value: 'accesorios', child: Text('Accesorios')),
                      DropdownMenuItem(value: 'computo', child: Text('Cómputo')),
                      DropdownMenuItem(value: 'otro', child: Text('Otro')),
                    ],
                    onChanged: (value) {
                      setDialogState(() => _selectedTipo = value!);
                    },
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _marcaModeloController,
                          decoration: const InputDecoration(
                            labelText: 'Marca/Modelo',
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextFormField(
                          controller: _numeroSerieController,
                          decoration: const InputDecoration(
                            labelText: 'N° Serie',
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: _selectedCondicion,
                    decoration: const InputDecoration(
                      labelText: 'Condición',
                      border: OutlineInputBorder(),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'nuevo', child: Text('Nuevo')),
                      DropdownMenuItem(value: 'bueno', child: Text('Bueno')),
                      DropdownMenuItem(value: 'regular', child: Text('Regular')),
                      DropdownMenuItem(value: 'reparacion', child: Text('En Reparación')),
                    ],
                    onChanged: (value) {
                      setDialogState(() => _selectedCondicion = value!);
                    },
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: _selectedPropiedad,
                    decoration: const InputDecoration(
                      labelText: 'Tipo de Propiedad',
                      border: OutlineInputBorder(),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'PROPIO', child: Text('Propio')),
                      DropdownMenuItem(value: 'RENTADO', child: Text('Rentado')),
                    ],
                    onChanged: (value) {
                      setDialogState(() => _selectedPropiedad = value!);
                    },
                  ),
                  const SizedBox(height: 12),
                  
                  // Own equipment fields
                  if (_selectedPropiedad == 'PROPIO') ...[
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _costoController,
                            decoration: const InputDecoration(
                              labelText: 'Costo de Compra',
                              prefixText: '\$',
                              border: OutlineInputBorder(),
                            ),
                            keyboardType: TextInputType.number,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextFormField(
                            controller: _valorActualController,
                            decoration: const InputDecoration(
                              labelText: 'Valor Actual',
                              prefixText: '\$',
                              border: OutlineInputBorder(),
                            ),
                            keyboardType: TextInputType.number,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      value: _selectedUbicacion,
                      decoration: const InputDecoration(
                        labelText: 'Ubicación',
                        border: OutlineInputBorder(),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'en_stock', child: Text('En Stock')),
                        DropdownMenuItem(value: 'en_proyecto', child: Text('En Proyecto')),
                        DropdownMenuItem(value: 'mantenimiento', child: Text('Mantenimiento')),
                        DropdownMenuItem(value: 'prestado', child: Text('Prestado')),
                        DropdownMenuItem(value: 'vendido', child: Text('Vendido')),
                      ],
                      onChanged: (value) {
                        setDialogState(() => _selectedUbicacion = value!);
                      },
                    ),
                    const SizedBox(height: 12),
                    OutlinedButton.icon(
                      icon: const Icon(Icons.calendar_today, size: 16),
                      label: Text(
                        _fechaCompra != null
                            ? 'Compra: ${_fechaCompra.toString().split(' ')[0]}'
                            : 'Seleccionar Fecha de Compra',
                      ),
                      onPressed: () async {
                        final date = await showDatePicker(
                          context: context,
                          initialDate: _fechaCompra ?? DateTime.now(),
                          firstDate: DateTime(2010),
                          lastDate: DateTime.now(),
                        );
                        if (date != null) {
                          setDialogState(() => _fechaCompra = date);
                        }
                      },
                    ),
                  ],
                  
                  // Rented equipment fields
                  if (_selectedPropiedad == 'RENTADO') ...[
                    TextFormField(
                      controller: _proveedorController,
                      decoration: const InputDecoration(
                        labelText: 'Proveedor de Renta',
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) =>
                          value?.isEmpty ?? true ? 'Campo requerido' : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _costoRentaController,
                      decoration: const InputDecoration(
                        labelText: 'Costo de Renta por Día',
                        prefixText: '\$',
                        border: OutlineInputBorder(),
                      ),
                      keyboardType: TextInputType.number,
                      validator: (value) {
                        if (value?.isEmpty ?? true) return 'Campo requerido';
                        if (double.tryParse(value!) == null) return 'Número inválido';
                        return null;
                      },
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            icon: const Icon(Icons.calendar_today, size: 16),
                            label: Text(
                              _fechaInicioRenta != null
                                  ? 'Inicio: ${_fechaInicioRenta.toString().split(' ')[0]}'
                                  : 'Inicio Renta',
                              overflow: TextOverflow.ellipsis,
                            ),
                            onPressed: () async {
                              final date = await showDatePicker(
                                context: context,
                                initialDate: _fechaInicioRenta ?? DateTime.now(),
                                firstDate: DateTime(2020),
                                lastDate: DateTime(2030),
                              );
                              if (date != null) {
                                setDialogState(() => _fechaInicioRenta = date);
                              }
                            },
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: OutlinedButton.icon(
                            icon: const Icon(Icons.calendar_today, size: 16),
                            label: Text(
                              _fechaFinRenta != null
                                  ? 'Fin: ${_fechaFinRenta.toString().split(' ')[0]}'
                                  : 'Fin Renta',
                              overflow: TextOverflow.ellipsis,
                            ),
                            onPressed: () async {
                              final date = await showDatePicker(
                                context: context,
                                initialDate: _fechaFinRenta ?? DateTime.now().add(const Duration(days: 7)),
                                firstDate: DateTime(2020),
                                lastDate: DateTime(2030),
                              );
                              if (date != null) {
                                setDialogState(() => _fechaFinRenta = date);
                              }
                            },
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancelar'),
            ),
            ElevatedButton(
              onPressed: () async {
                if (_formKey.currentState!.validate()) {
                  final Map<String, dynamic> data = {
                    'nombre': _nombreController.text,
                    'tipo': _selectedTipo,
                    'marca_modelo': _marcaModeloController.text,
                    'numero_serie': _numeroSerieController.text,
                    'condicion': _selectedCondicion,
                    'tipo_propiedad': _selectedPropiedad,
                  };

                  if (_selectedPropiedad == 'PROPIO') {
                    data['costo_compra'] = _costoController.text.isNotEmpty
                        ? double.parse(_costoController.text)
                        : 0;
                    data['valor_actual'] = _valorActualController.text.isNotEmpty
                        ? double.parse(_valorActualController.text)
                        : 0;
                    data['ubicacion'] = _selectedUbicacion;
                    if (_fechaCompra != null) {
                      data['fecha_compra'] = _fechaCompra!.toIso8601String().split('T')[0];
                    }
                  } else {
                    data['proveedor_renta'] = _proveedorController.text;
                    data['costo_renta_dia'] = double.parse(_costoRentaController.text);
                    if (_fechaInicioRenta != null) {
                      data['fecha_inicio_renta'] = _fechaInicioRenta!.toIso8601String().split('T')[0];
                    }
                    if (_fechaFinRenta != null) {
                      data['fecha_fin_renta'] = _fechaFinRenta!.toIso8601String().split('T')[0];
                    }
                  }

                  try {
                    await SupabaseService.insertEquipment(data);
                    Navigator.pop(context);
                    _loadEquipment();
                  } catch (e) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Error: $e')),
                    );
                  }
                }
              },
              child: Text(isEditing ? 'Guardar' : 'Agregar'),
            ),
          ],
        ),
      ),
    );
  }

  String _getEquipmentIcon(String tipo) {
    switch (tipo) {
      case 'camara':
        return '📷';
      case 'lente':
        return '🔍';
      case 'iluminacion':
        return '💡';
      case 'audio':
        return '🎤';
      case 'estabilizador':
        return '📱';
      case 'drone':
        return '🚁';
      case 'accesorios':
        return '🎒';
      case 'computo':
        return '💻';
      default:
        return '📦';
    }
  }

  Color _getConditionColor(String condicion) {
    switch (condicion) {
      case 'nuevo':
        return Colors.green;
      case 'bueno':
        return Colors.blue;
      case 'regular':
        return Colors.orange;
      case 'reparacion':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  Widget _buildEquipmentCard(Map<String, dynamic> equipment) {
    final isRented = equipment['tipo_propiedad'] == 'RENTADO';
    final color = _getConditionColor(equipment['condicion'] ?? '');
    
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[100]!),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey[50],
                    shape: BoxShape.circle,
                  ),
                  child: Text(
                    _getEquipmentIcon(equipment['tipo'] ?? ''),
                    style: const TextStyle(fontSize: 24),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        equipment['nombre'] ?? '',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (equipment['marca_modelo'] != null)
                        Text(
                          equipment['marca_modelo'],
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey[600],
                          ),
                        ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    (equipment['condicion'] ?? '').toString().toUpperCase(),
                    style: TextStyle(
                      color: color,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  if (equipment['numero_serie'] != null && equipment['numero_serie'].toString().isNotEmpty)
                    _buildTag(Icons.qr_code_outlined, 'S/N: ${equipment['numero_serie']}'),
                  const SizedBox(width: 12),
                  if (!isRented && equipment['ubicacion'] != null)
                    _buildTag(Icons.location_on_outlined, equipment['ubicacion'].toString().replaceAll('_', ' ')),
                  if (isRented && equipment['proveedor_renta'] != null)
                    _buildTag(Icons.business_outlined, equipment['proveedor_renta']),
                ],
              ),
            ),
            const SizedBox(height: 16),
            const Divider(height: 1),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (!isRented && equipment['valor_actual'] != null)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Valor Actual',
                        style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                      ),
                      Text(
                        '\$${(equipment['valor_actual'] as num?)?.toStringAsFixed(0) ?? '0'}',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                          color: Colors.black87,
                        ),
                      ),
                    ],
                  ),
                if (isRented && equipment['costo_renta_dia'] != null)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Costo Día',
                        style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                      ),
                      Text(
                        '\$${(equipment['costo_renta_dia'] as num?)?.toStringAsFixed(0) ?? '0'}',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                      ),
                    ],
                  ),
                if (isRented && equipment['fecha_fin_renta'] != null)
                  _buildRentalCountdown(equipment['fecha_fin_renta']),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTag(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: Colors.grey[600]),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(fontSize: 11, color: Colors.grey[700]),
          ),
        ],
      ),
    );
  }

  Widget _buildRentalCountdown(String? fechaFin) {
    if (fechaFin == null) return const SizedBox.shrink();
    
    final dueDate = DateTime.parse(fechaFin);
    final daysLeft = dueDate.difference(DateTime.now()).inDays;
    
    Color color;
    String message;
    
    if (daysLeft < 0) {
      color = Colors.red;
      message = 'Vencido ${daysLeft.abs()} días';
    } else if (daysLeft == 0) {
      color = Colors.red;
      message = 'Vence HOY';
    } else if (daysLeft == 1) {
      color = Colors.orange;
      message = 'Vence mañana';
    } else if (daysLeft <= 3) {
      color = Colors.orange;
      message = '$daysLeft días restantes';
    } else {
      color = Colors.blue;
      message = '$daysLeft días restantes';
    }
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Text(
          'Fin de Renta',
          style: TextStyle(fontSize: 11, color: Colors.grey[500]),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            message,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Inventario de Equipo'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Propio', icon: Icon(Icons.inventory_2_outlined)),
            Tab(text: 'Rentado', icon: Icon(Icons.store_outlined)),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                // Own equipment tab
                _ownEquipment.isEmpty
                    ? _buildEmptyState('No hay equipo propio', 'Agrega tu primer equipo')
                    : RefreshIndicator(
                        onRefresh: _loadEquipment,
                        child: Center(
                          child: Container(
                            constraints: const BoxConstraints(maxWidth: 1000),
                            child: ListView.builder(
                              padding: const EdgeInsets.all(24),
                              itemCount: _ownEquipment.length,
                              itemBuilder: (context, index) =>
                                  _buildEquipmentCard(_ownEquipment[index]),
                            ),
                          ),
                        ),
                      ),
                // Rented equipment tab
                _rentedEquipment.isEmpty
                    ? _buildEmptyState('No hay equipo rentado', 'Agrega equipo rentado')
                    : RefreshIndicator(
                        onRefresh: _loadEquipment,
                        child: Center(
                          child: Container(
                            constraints: const BoxConstraints(maxWidth: 1000),
                            child: ListView.builder(
                              padding: const EdgeInsets.all(24),
                              itemCount: _rentedEquipment.length,
                              itemBuilder: (context, index) =>
                                  _buildEquipmentCard(_rentedEquipment[index]),
                            ),
                          ),
                        ),
                      ),
              ],
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showEquipmentDialog(),
        icon: const Icon(Icons.add),
        label: const Text('Agregar Equipo'),
      ),
    );
  }

  Widget _buildEmptyState(String title, String subtitle) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.inventory_2_outlined, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            title,
            style: TextStyle(fontSize: 18, color: Colors.grey[600]),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: TextStyle(color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }
}