import 'package:flutter/material.dart';
import '../services/supabase_service.dart';

class ProjectsScreen extends StatefulWidget {
  const ProjectsScreen({super.key});

  @override
  State<ProjectsScreen> createState() => _ProjectsScreenState();
}

class _ProjectsScreenState extends State<ProjectsScreen> {
  List<Map<String, dynamic>> _projects = [];
  bool _loading = true;
  String _selectedFilter = 'todos';

  final List<String> _filterOptions = [
    'todos',
    'cotizacion',
    'en_progreso',
    'entregado',
    'facturado',
    'pagado',
    'cancelado',
  ];

  @override
  void initState() {
    super.initState();
    _loadProjects();
  }

  Future<void> _loadProjects() async {
    setState(() => _loading = true);
    try {
      final projects = await SupabaseService.getProjects(
        estado: _selectedFilter == 'todos' ? null : _selectedFilter,
      );
      setState(() => _projects = projects);
    } catch (e) {
      print('Error loading projects: $e');
    }
    setState(() => _loading = false);
  }

  void _showProjectDialog([Map<String, dynamic>? project]) {
    final isEditing = project != null;
    final _formKey = GlobalKey<FormState>();
    final _nombreController = TextEditingController(text: project?['nombre_cliente'] ?? '');
    final _descripcionController = TextEditingController(text: project?['descripcion'] ?? '');
    final _montoController = TextEditingController(
      text: project?['monto_presupuestado']?.toString() ?? '',
    );
    
    String _selectedTipo = project?['tipo_servicio'] ?? 'filmacion';
    String _selectedEstado = project?['estado'] ?? 'cotizacion';
    DateTime _fechaInicio = project != null 
        ? DateTime.parse(project['fecha_inicio'])
        : DateTime.now();
    DateTime _fechaEntrega = project != null
        ? DateTime.parse(project['fecha_entrega'])
        : DateTime.now().add(const Duration(days: 30));

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Text(isEditing ? 'Editar Proyecto' : 'Nuevo Proyecto'),
          content: SingleChildScrollView(
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextFormField(
                    controller: _nombreController,
                    decoration: const InputDecoration(
                      labelText: 'Nombre del Cliente',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) =>
                        value?.isEmpty ?? true ? 'Campo requerido' : null,
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    value: _selectedTipo,
                    decoration: const InputDecoration(
                      labelText: 'Tipo de Servicio',
                      border: OutlineInputBorder(),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'filmacion', child: Text('Filmación')),
                      DropdownMenuItem(value: 'edicion', child: Text('Edición')),
                      DropdownMenuItem(value: 'produccion_completa', child: Text('Producción Completa')),
                      DropdownMenuItem(value: 'fotografia', child: Text('Fotografía')),
                      DropdownMenuItem(value: 'motion_graphics', child: Text('Motion Graphics')),
                      DropdownMenuItem(value: 'drone', child: Text('Drone')),
                      DropdownMenuItem(value: 'live_streaming', child: Text('Live Streaming')),
                      DropdownMenuItem(value: 'otro', child: Text('Otro')),
                    ],
                    onChanged: (value) {
                      setDialogState(() => _selectedTipo = value!);
                    },
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _descripcionController,
                    decoration: const InputDecoration(
                      labelText: 'Descripción',
                      border: OutlineInputBorder(),
                    ),
                    maxLines: 3,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _montoController,
                    decoration: const InputDecoration(
                      labelText: 'Monto Presupuestado',
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
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    value: _selectedEstado,
                    decoration: const InputDecoration(
                      labelText: 'Estado',
                      border: OutlineInputBorder(),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'cotizacion', child: Text('Cotización')),
                      DropdownMenuItem(value: 'en_progreso', child: Text('En Progreso')),
                      DropdownMenuItem(value: 'entregado', child: Text('Entregado')),
                      DropdownMenuItem(value: 'facturado', child: Text('Facturado')),
                      DropdownMenuItem(value: 'pagado', child: Text('Pagado')),
                      DropdownMenuItem(value: 'cancelado', child: Text('Cancelado')),
                    ],
                    onChanged: (value) {
                      setDialogState(() => _selectedEstado = value!);
                    },
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          icon: const Icon(Icons.calendar_today, size: 16),
                          label: Text(
                            'Inicio: ${_fechaInicio.toString().split(' ')[0]}',
                            overflow: TextOverflow.ellipsis,
                          ),
                          onPressed: () async {
                            final date = await showDatePicker(
                              context: context,
                              initialDate: _fechaInicio,
                              firstDate: DateTime(2020),
                              lastDate: DateTime(2030),
                            );
                            if (date != null) {
                              setDialogState(() => _fechaInicio = date);
                            }
                          },
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton.icon(
                          icon: const Icon(Icons.calendar_today, size: 16),
                          label: Text(
                            'Entrega: ${_fechaEntrega.toString().split(' ')[0]}',
                            overflow: TextOverflow.ellipsis,
                          ),
                          onPressed: () async {
                            final date = await showDatePicker(
                              context: context,
                              initialDate: _fechaEntrega,
                              firstDate: DateTime(2020),
                              lastDate: DateTime(2030),
                            );
                            if (date != null) {
                              setDialogState(() => _fechaEntrega = date);
                            }
                          },
                        ),
                      ),
                    ],
                  ),
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
                  final data = {
                    'nombre_cliente': _nombreController.text,
                    'tipo_servicio': _selectedTipo,
                    'descripcion': _descripcionController.text,
                    'monto_presupuestado': double.parse(_montoController.text),
                    'estado': _selectedEstado,
                    'fecha_inicio': _fechaInicio.toIso8601String().split('T')[0],
                    'fecha_entrega': _fechaEntrega.toIso8601String().split('T')[0],
                  };

                  try {
                    if (isEditing) {
                      await SupabaseService.updateProject(project!['id'], data);
                    } else {
                      await SupabaseService.insertProject(data);
                    }
                    Navigator.pop(context);
                    _loadProjects();
                  } catch (e) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Error: $e')),
                    );
                  }
                }
              },
              child: Text(isEditing ? 'Guardar' : 'Crear'),
            ),
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(String estado) {
    switch (estado) {
      case 'cotizacion':
        return Colors.blue;
      case 'en_progreso':
        return Colors.orange;
      case 'entregado':
        return Colors.purple;
      case 'facturado':
        return Colors.teal;
      case 'pagado':
        return Colors.green;
      case 'cancelado':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _getStatusLabel(String estado) {
    switch (estado) {
      case 'cotizacion':
        return 'Cotización';
      case 'en_progreso':
        return 'En Progreso';
      case 'entregado':
        return 'Entregado';
      case 'facturado':
        return 'Facturado';
      case 'pagado':
        return 'Pagado';
      case 'cancelado':
        return 'Cancelado';
      default:
        return estado;
    }
  }

  String _getServiceIcon(String tipo) {
    switch (tipo) {
      case 'filmacion':
        return '🎬';
      case 'edicion':
        return '✂️';
      case 'produccion_completa':
        return '🎥';
      case 'fotografia':
        return '📸';
      case 'motion_graphics':
        return '✨';
      case 'drone':
        return '🚁';
      case 'live_streaming':
        return '📡';
      default:
        return '📁';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Proyectos'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: () {
              showModalBottomSheet(
                context: context,
                builder: (context) => Container(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Filtrar por Estado',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 16),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _filterOptions.map((filter) {
                          final isSelected = _selectedFilter == filter;
                          return FilterChip(
                            label: Text(filter == 'todos' ? 'Todos' : _getStatusLabel(filter)),
                            selected: isSelected,
                            onSelected: (selected) {
                              setState(() => _selectedFilter = filter);
                              Navigator.pop(context);
                              _loadProjects();
                            },
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _projects.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.folder_open, size: 64, color: Colors.grey[400]),
                      const SizedBox(height: 16),
                      Text(
                        'No hay proyectos',
                        style: TextStyle(fontSize: 18, color: Colors.grey[600]),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Crea tu primer proyecto',
                        style: TextStyle(color: Colors.grey[500]),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadProjects,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _projects.length,
                    itemBuilder: (context, index) {
                      final project = _projects[index];
                      final montoPresupuestado = (project['monto_presupuestado'] as num?)?.toDouble() ?? 0;
                      final montoFacturado = (project['monto_facturado'] as num?)?.toDouble() ?? 0;
                      final progress = montoPresupuestado > 0
                          ? (montoFacturado / montoPresupuestado).clamp(0.0, 1.0)
                          : 0.0;

                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: InkWell(
                          onTap: () => _showProjectDialog(project),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      _getServiceIcon(project['tipo_servicio'] ?? ''),
                                      style: const TextStyle(fontSize: 24),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            project['nombre_cliente'] ?? '',
                                            style: const TextStyle(
                                              fontSize: 16,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                          if (project['descripcion'] != null)
                                            Text(
                                              project['descripcion'],
                                              style: TextStyle(
                                                fontSize: 12,
                                                color: Colors.grey[600],
                                              ),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                        ],
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 12,
                                        vertical: 4,
                                      ),
                                      decoration: BoxDecoration(
                                        color: _getStatusColor(project['estado'] ?? '')
                                            .withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(
                                          color: _getStatusColor(project['estado'] ?? ''),
                                        ),
                                      ),
                                      child: Text(
                                        _getStatusLabel(project['estado'] ?? ''),
                                        style: TextStyle(
                                          color: _getStatusColor(project['estado'] ?? ''),
                                          fontSize: 12,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Row(
                                  children: [
                                    Icon(Icons.calendar_today,
                                        size: 14, color: Colors.grey[500]),
                                    const SizedBox(width: 4),
                                    Text(
                                      '${project['fecha_inicio']} - ${project['fecha_entrega']}',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: Colors.grey[500],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            'Progreso Financiero',
                                            style: TextStyle(
                                              fontSize: 11,
                                              color: Colors.grey[500],
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          LinearProgressIndicator(
                                            value: progress,
                                            backgroundColor: Colors.grey[200],
                                            valueColor: AlwaysStoppedAnimation(
                                              progress >= 1.0
                                                  ? Colors.green
                                                  : Colors.blue,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 16),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.end,
                                      children: [
                                        Text(
                                          '\$${montoFacturado.toStringAsFixed(0)} / \$${montoPresupuestado.toStringAsFixed(0)}',
                                          style: const TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                        Text(
                                          '${(progress * 100).toStringAsFixed(0)}%',
                                          style: TextStyle(
                                            fontSize: 11,
                                            color: Colors.grey[500],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showProjectDialog(),
        icon: const Icon(Icons.add),
        label: const Text('Nuevo Proyecto'),
      ),
    );
  }
}