import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../services/supabase_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Map<String, dynamic> _stats = {
    'ingresos': 0.0,
    'gastos': 0.0,
    'margen': 0.0,
    'proyectos_activos': 0,
    'equipos_por_vencer': [],
  };
  List<Map<String, dynamic>> _categoryExpenses = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final stats = await SupabaseService.getDashboardStats();
      final categories = await SupabaseService.getExpensesByCategory();
      setState(() {
        _stats = stats;
        _categoryExpenses = categories;
      });
    } catch (e) {
      print('Error loading data: $e');
    }
    setState(() => _loading = false);
  }

  Future<void> _signOut() async {
    await SupabaseService.signOut();
    if (mounted) {
      Navigator.pushReplacementNamed(context, '/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = SupabaseService.client.auth.currentUser;
    final userName = user?.userMetadata?['full_name'] ?? user?.email?.split('@')[0] ?? 'Usuario';
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {
              _showNotifications();
            },
          ),
          PopupMenuButton(
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'profile',
                child: ListTile(
                  leading: Icon(Icons.person),
                  title: Text('Perfil'),
                  contentPadding: EdgeInsets.zero,
                ),
              ),
              const PopupMenuItem(
                value: 'logout',
                child: ListTile(
                  leading: Icon(Icons.logout),
                  title: Text('Cerrar sesión'),
                  contentPadding: EdgeInsets.zero,
                ),
              ),
            ],
            onSelected: (value) {
              if (value == 'logout') _signOut();
            },
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Saludo
                    Text(
                      '¡Hola, $userName! 👋',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Aquí está tu resumen financiero',
                      style: TextStyle(color: Colors.grey[600], fontSize: 14),
                    ),
                    const SizedBox(height: 24),
                    
                    // Cards de estadísticas
                    _buildStatsGrid(),
                    const SizedBox(height: 24),
                    
                    // Gráfico de gastos
                    if (_categoryExpenses.isNotEmpty) ...[
                      const Text(
                        'Gastos por Categoría',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 12),
                      _buildExpenseChart(),
                      const SizedBox(height: 24),
                    ],
                    
                    // Alertas de equipo
                    if ((_stats['equipos_por_vencer'] as List).isNotEmpty) ...[
                      const Text(
                        '⚠️ Equipment Alerts',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 12),
                      _buildEquipmentAlerts(),
                      const SizedBox(height: 24),
                    ],
                    
                    // Acciones rápidas
                    const Text(
                      'Acciones Rápidas',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 12),
                    _buildQuickActions(),
                  ],
                ),
              ),
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.pushNamed(context, '/camera'),
        icon: const Icon(Icons.camera_alt),
        label: const Text('Nueva Factura'),
      ),
    );
  }

  Widget _buildStatsGrid() {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.5,
      children: [
        _buildStatCard(
          'Ingresos',
          '\$${(_stats['ingresos'] as double).toStringAsFixed(2)}',
          Colors.green,
          Icons.trending_up,
          '+este mes',
        ),
        _buildStatCard(
          'Gastos',
          '\$${(_stats['gastos'] as double).toStringAsFixed(2)}',
          Colors.red,
          Icons.trending_down,
          '-este mes',
        ),
        _buildStatCard(
          'Margen',
          '${(_stats['margen'] as double).toStringAsFixed(1)}%',
          Colors.blue,
          Icons.analytics,
          (_stats['margen'] as double) >= 0 ? 'positivo' : 'negativo',
        ),
        _buildStatCard(
          'Proyectos',
          '${_stats['proyectos_activos']}',
          Colors.purple,
          Icons.folder,
          'activos',
        ),
      ],
    );
  }

  Widget _buildStatCard(
    String title,
    String value,
    Color color,
    IconData icon,
    String subtitle,
  ) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Icon(icon, color: color, size: 24),
                Text(
                  title,
                  style: TextStyle(color: Colors.grey[600], fontSize: 12),
                ),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
                Text(
                  subtitle,
                  style: TextStyle(color: Colors.grey[500], fontSize: 10),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildExpenseChart() {
    final colors = [
      Colors.blue,
      Colors.green,
      Colors.orange,
      Colors.purple,
      Colors.red,
      Colors.teal,
      Colors.pink,
      Colors.indigo,
    ];

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: SizedBox(
          height: 200,
          child: Row(
            children: [
              // Pie Chart
              Expanded(
                flex: 2,
                child: PieChart(
                  PieChartData(
                    sectionsSpace: 2,
                    centerSpaceRadius: 40,
                    sections: _categoryExpenses.asMap().entries.map((entry) {
                      final total = _categoryExpenses.fold<double>(
                        0, (sum, e) => sum + (e['monto'] as double));
                      final percentage = (entry.value['monto'] as double) / total * 100;
                      
                      return PieChartSectionData(
                        color: colors[entry.key % colors.length],
                        value: entry.value['monto'] as double,
                        title: '${percentage.toStringAsFixed(0)}%',
                        radius: 50,
                        titleStyle: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              // Legend
              Expanded(
                flex: 3,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: _categoryExpenses.take(5).toList().asMap().entries.map((entry) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 2),
                      child: Row(
                        children: [
                          Container(
                            width: 12,
                            height: 12,
                            decoration: BoxDecoration(
                              color: colors[entry.key % colors.length],
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              (entry.value['tipo'] as String).replaceAll('_', ' '),
                              style: const TextStyle(fontSize: 11),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          Text(
                            '\$${(entry.value['monto'] as double).toStringAsFixed(0)}',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEquipmentAlerts() {
    final alerts = _stats['equipos_por_vencer'] as List;
    
    return Column(
      children: alerts.take(3).map((equipment) {
        final dueDate = equipment['fecha_fin_renta'] != null
            ? DateTime.parse(equipment['fecha_fin_renta'])
            : null;
        final daysLeft = dueDate?.difference(DateTime.now()).inDays;
        
        Color color = Colors.orange;
        String message = '';
        
        if (daysLeft != null) {
          if (daysLeft == 0) {
            color = Colors.red;
            message = 'Vence HOY';
          } else if (daysLeft == 1) {
            color = Colors.orange;
            message = 'Vence mañana';
          } else {
            message = '$daysLeft días restantes';
          }
        }
        
        return Card(
          color: color.withOpacity(0.1),
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: Icon(Icons.warning, color: color),
            title: Text(equipment['nombre'] ?? ''),
            subtitle: Text(message),
            trailing: Text(
              equipment['fecha_fin_renta'] ?? '',
              style: TextStyle(color: color, fontWeight: FontWeight.bold),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildQuickActions() {
    return Row(
      children: [
        Expanded(
          child: _buildActionButton(
            context,
            Icons.camera_alt,
            'Factura',
            Colors.blue,
            () => Navigator.pushNamed(context, '/camera'),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildActionButton(
            context,
            Icons.folder,
            'Proyectos',
            Colors.green,
            () => Navigator.pushNamed(context, '/projects'),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildActionButton(
            context,
            Icons.inventory,
            'Equipo',
            Colors.orange,
            () => Navigator.pushNamed(context, '/inventory'),
          ),
        ),
      ],
    );
  }

  Widget _buildActionButton(
    BuildContext context,
    IconData icon,
    String label,
    Color color,
    VoidCallback onTap,
  ) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 8),
            Text(
              label,
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.w500,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showNotifications() {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Notificaciones',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: const CircleAvatar(
                backgroundColor: Colors.red,
                child: Icon(Icons.warning, color: Colors.white),
              ),
              title: const Text('Equipo rentado próximo a vencer'),
              subtitle: const Text('Tienes 2 equipos por vencer esta semana'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushNamed(context, '/inventory');
              },
            ),
            ListTile(
              leading: const CircleAvatar(
                backgroundColor: Colors.orange,
                child: Icon(Icons.payment, color: Colors.white),
              ),
              title: const Text('Pagos pendientes'),
              subtitle: const Text('3 proyectos esperando pago'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushNamed(context, '/projects');
              },
            ),
          ],
        ),
      ),
    );
  }
}
