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
    final size = MediaQuery.of(context).size;
    final isDesktop = size.width > 600;
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Gestión Autónoma'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: _showNotifications,
          ),
          PopupMenuButton(
            icon: const Icon(Icons.account_circle_outlined),
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'profile',
                child: ListTile(
                  leading: Icon(Icons.person_outline),
                  title: Text('Mi Perfil'),
                  contentPadding: EdgeInsets.zero,
                ),
              ),
              const PopupMenuItem(
                value: 'logout',
                child: ListTile(
                  leading: Icon(Icons.logout_rounded, color: Colors.red),
                  title: Text('Cerrar sesión', style: TextStyle(color: Colors.red)),
                  contentPadding: EdgeInsets.zero,
                ),
              ),
            ],
            onSelected: (value) {
              if (value == 'logout') _signOut();
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: Center(
                child: Container(
                  constraints: const BoxConstraints(maxWidth: 1100),
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Saludo
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '¡Hola, $userName! 👋',
                                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                        fontWeight: FontWeight.bold,
                                      ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Aquí está tu resumen de hoy',
                                  style: TextStyle(color: Colors.grey[600]),
                                ),
                              ],
                            ),
                            if (isDesktop)
                              ElevatedButton.icon(
                                onPressed: () => Navigator.pushNamed(context, '/camera'),
                                icon: const Icon(Icons.add_a_photo_outlined),
                                label: const Text('Subir Factura'),
                                style: ElevatedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 32),
                        
                        // Cards de estadísticas (Responsive)
                        _buildResponsiveStatsGrid(isDesktop),
                        const SizedBox(height: 32),
                        
                        // Fila de Contenido Principal (Grafico + Acciones/Alertas)
                        if (isDesktop)
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                flex: 2,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    _buildSectionTitle('Gastos por Categoría'),
                                    const SizedBox(height: 16),
                                    _buildExpenseChart(),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 32),
                              Expanded(
                                flex: 1,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    _buildSectionTitle('Acciones Rápidas'),
                                    const SizedBox(height: 16),
                                    _buildQuickActions(isVertical: true),
                                    if ((_stats['equipos_por_vencer'] as List).isNotEmpty) ...[
                                      const SizedBox(height: 32),
                                      _buildSectionTitle('Alertas de Equipo'),
                                      const SizedBox(height: 16),
                                      _buildEquipmentAlerts(),
                                    ],
                                  ],
                                ),
                              ),
                            ],
                          )
                        else ...[
                          // Mobile Layout (Stacked)
                          if (_categoryExpenses.isNotEmpty) ...[
                            _buildSectionTitle('Gastos por Categoría'),
                            const SizedBox(height: 16),
                            _buildExpenseChart(),
                            const SizedBox(height: 32),
                          ],
                          
                          if ((_stats['equipos_por_vencer'] as List).isNotEmpty) ...[
                            _buildSectionTitle('Alertas de Equipo'),
                            const SizedBox(height: 16),
                            _buildEquipmentAlerts(),
                            const SizedBox(height: 32),
                          ],
                          
                          _buildSectionTitle('Acciones Rápidas'),
                          const SizedBox(height: 16),
                          _buildQuickActions(),
                        ],
                        const SizedBox(height: 80), // Espacio para el FAB
                      ],
                    ),
                  ),
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

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
          ),
    );
  }

  Widget _buildResponsiveStatsGrid(bool isDesktop) {
    return GridView.count(
      crossAxisCount: isDesktop ? 4 : 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      childAspectRatio: isDesktop ? 2.5 : 1.5,
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
          Icons.analytics_outlined,
          (_stats['margen'] as double) >= 0 ? 'positivo' : 'negativo',
        ),
        _buildStatCard(
          'Proyectos',
          '${_stats['proyectos_activos']}',
          Colors.purple,
          Icons.folder_open_rounded,
          'activos',
        ),
      ],
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

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey[100]!),
      ),
      child: SizedBox(
        height: 240,
        child: Row(
          children: [
            Expanded(
              flex: 2,
              child: PieChart(
                PieChartData(
                  sectionsSpace: 4,
                  centerSpaceRadius: 50,
                  sections: _categoryExpenses.asMap().entries.map((entry) {
                    final total = _categoryExpenses.fold<double>(
                      0, (sum, e) => sum + (e['monto'] as double));
                    final percentage = (entry.value['monto'] as double) / total * 100;
                    
                    return PieChartSectionData(
                      color: colors[entry.key % colors.length],
                      value: entry.value['monto'] as double,
                      title: '${percentage.toStringAsFixed(0)}%',
                      radius: 60,
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
            const SizedBox(width: 24),
            Expanded(
              flex: 3,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: _categoryExpenses.take(5).toList().asMap().entries.map((entry) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    child: Row(
                      children: [
                        Container(
                          width: 10,
                          height: 10,
                          decoration: BoxDecoration(
                            color: colors[entry.key % colors.length],
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            (entry.value['tipo'] as String).replaceAll('_', ' '),
                            style: TextStyle(fontSize: 12, color: Colors.grey[700]),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Text(
                          '\$${(entry.value['monto'] as double).toStringAsFixed(0)}',
                          style: const TextStyle(
                            fontSize: 12,
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
    );
  }

  Widget _buildEquipmentAlerts() {
    final alerts = _stats['equipos_por_vencer'] as List;
    
    return Column(
      children: alerts.take(3).map((equipment) {
        final dueDate = equipment['fecha_fin_renta'] != null
            ? DateTime.parse(equipment['fecha_fin_renta'])
            : null;
        final now = DateTime.now();
        final daysLeft = dueDate?.difference(DateTime(now.year, now.month, now.day)).inDays;
        
        Color color = Colors.orange;
        String message = '';
        
        if (daysLeft != null) {
          if (daysLeft < 0) {
            color = Colors.red;
            message = 'Vencido';
          } else if (daysLeft == 0) {
            color = Colors.red;
            message = 'Vence HOY';
          } else if (daysLeft == 1) {
            color = Colors.orange;
            message = 'Vence mañana';
          } else {
            message = '$daysLeft días restantes';
          }
        }
        
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: color.withOpacity(0.05),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: color.withOpacity(0.1)),
          ),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: color.withOpacity(0.1),
              child: Icon(Icons.warning_amber_rounded, color: color, size: 20),
            ),
            title: Text(
              equipment['nombre'] ?? '',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            ),
            subtitle: Text(message, style: TextStyle(fontSize: 12, color: color)),
            trailing: Text(
              equipment['fecha_fin_renta'] ?? '',
              style: TextStyle(color: Colors.grey[500], fontSize: 11),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildStatCard(
    String title,
    String value,
    Color color,
    IconData icon,
    String subtitle,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(color: Colors.grey[100]!),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              Text(
                title,
                style: TextStyle(color: Colors.grey[600], fontSize: 13, fontWeight: FontWeight.w500),
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              FittedBox(
                child: Text(
                  value,
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.onSurface,
                  ),
                ),
              ),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  subtitle,
                  style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions({bool isVertical = false}) {
    final actions = [
      _buildActionItem(
        Icons.camera_alt_outlined,
        'Factura',
        'Cargar gastos',
        Colors.blue,
        () => Navigator.pushNamed(context, '/camera'),
      ),
      _buildActionItem(
        Icons.folder_outlined,
        'Proyectos',
        'Ver todos',
        Colors.green,
        () => Navigator.pushNamed(context, '/projects'),
      ),
      _buildActionItem(
        Icons.inventory_2_outlined,
        'Equipo',
        'Ver inventario',
        Colors.orange,
        () => Navigator.pushNamed(context, '/inventory'),
      ),
    ];

    if (isVertical) {
      return Column(
        children: actions.map((a) => Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: a,
        )).toList(),
      );
    }

    return Row(
      children: actions.map((a) => Expanded(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: a,
        ),
      )).toList(),
    );
  }

  Widget _buildActionItem(
    IconData icon,
    String label,
    String sub,
    Color color,
    VoidCallback onTap,
  ) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.05),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withOpacity(0.1)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  Text(
                    sub,
                    style: TextStyle(color: Colors.grey[600], fontSize: 11),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: Colors.grey[400], size: 16),
          ],
        ),
      ),
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
