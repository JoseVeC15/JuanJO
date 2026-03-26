import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseService {
  static final SupabaseClient _client = Supabase.instance.client;

  static SupabaseClient get client => _client;
  static String? get userId => _client.auth.currentUser?.id;
  static String? get userEmail => _client.auth.currentUser?.email;

  // ==================== AUTH ====================
  
  static Future<AuthResponse> signIn(String email, String password) {
    return _client.auth.signInWithPassword(
      email: email,
      password: password,
    );
  }

  static Future<AuthResponse> signUp(String email, String password, {String? fullName}) {
    return _client.auth.signUp(
      email: email,
      password: password,
      data: {
        'full_name': fullName ?? email.split('@')[0],
      },
    );
  }

  static Future<void> signOut() {
    return _client.auth.signOut();
  }

  // ==================== PROYECTOS ====================
  
  static Future<List<Map<String, dynamic>>> getProjects({String? estado}) async {
    var query = _client
        .from('proyectos')
        .select('*')
        .eq('user_id', userId!);
    
    if (estado != null && estado != 'todos') {
      query = query.eq('estado', estado);
    }
    
    return await query.order('created_at', ascending: false);
  }

  static Future<Map<String, dynamic>> getProject(String id) async {
    return await _client
        .from('proyectos')
        .select('*')
        .eq('id', id)
        .single();
  }

  static Future<void> insertProject(Map<String, dynamic> data) async {
    data['user_id'] = userId;
    await _client.from('proyectos').insert(data);
  }

  static Future<void> updateProject(String id, Map<String, dynamic> data) async {
    await _client.from('proyectos').update(data).eq('id', id);
  }

  // ==================== FACTURAS/GASTOS ====================
  
  static Future<List<Map<String, dynamic>>> getExpenses({String? proyectoId}) async {
    var query = _client
        .from('facturas_gastos')
        .select('*')
        .eq('user_id', userId!);
    
    if (proyectoId != null) {
      query = query.eq('proyecto_id', proyectoId);
    }
    
    return await query.order('created_at', ascending: false);
  }

  static Future<Map<String, dynamic>> insertExpense(Map<String, dynamic> data) async {
    data['user_id'] = userId;
    final response = await _client
        .from('facturas_gastos')
        .insert(data)
        .select()
        .single();
    return response;
  }

  static Future<void> updateExpense(String id, Map<String, dynamic> data) async {
    await _client.from('facturas_gastos').update(data).eq('id', id);
  }

  // ==================== INGRESOS ====================
  
  static Future<List<Map<String, dynamic>>> getIncomes() async {
    return await _client
        .from('ingresos')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', ascending: false);
  }

  static Future<void> insertIncome(Map<String, dynamic> data) async {
    data['user_id'] = userId;
    await _client.from('ingresos').insert(data);
  }

  // ==================== INVENTARIO ====================
  
  static Future<List<Map<String, dynamic>>> getEquipment({String? tipoPropiedad}) async {
    var query = _client
        .from('inventario_equipo')
        .select('*')
        .eq('user_id', userId!);
    
    if (tipoPropiedad != null) {
      query = query.eq('tipo_propiedad', tipoPropiedad);
    }
    
    return await query.order('nombre');
  }

  static Future<void> insertEquipment(Map<String, dynamic> data) async {
    data['user_id'] = userId;
    await _client.from('inventario_equipo').insert(data);
  }

  // ==================== DASHBOARD ====================
  
  static Future<Map<String, dynamic>> getDashboardStats() async {
    final now = DateTime.now();
    final firstDayOfMonth = DateTime(now.year, now.month, 1).toIso8601String();
    
    // Ingresos del mes
    final ingresosResponse = await _client
        .from('ingresos')
        .select('monto')
        .eq('user_id', userId!)
        .eq('estado', 'pagado')
        .gte('fecha_emision', firstDayOfMonth);
    
    // Gastos del mes
    final gastosResponse = await _client
        .from('facturas_gastos')
        .select('monto')
        .eq('user_id', userId!)
        .eq('estado', 'pagada')
        .gte('fecha_factura', firstDayOfMonth);
    
    // Proyectos activos
    final proyectosResponse = await _client
        .from('proyectos')
        .select('id')
        .eq('user_id', userId!)
        .inFilter('estado', ['en_progreso', 'entregado']);
    
    // Equipos rentados próximos a vencer
    final today = DateTime.now().toIso8601String().split('T')[0];
    final equiposProximos = await _client
        .from('inventario_equipo')
        .select('id, nombre, fecha_fin_renta')
        .eq('user_id', userId!)
        .eq('tipo_propiedad', 'RENTADO')
        .gte('fecha_fin_renta', today)
        .limit(5);
    
    final totalIngresos = (ingresosResponse as List).fold<double>(
      0, (sum, item) => sum + ((item['monto'] as num?)?.toDouble() ?? 0));
    final totalGastos = (gastosResponse as List).fold<double>(
      0, (sum, item) => sum + ((item['monto'] as num?)?.toDouble() ?? 0));
    
    return {
      'ingresos': totalIngresos,
      'gastos': totalGastos,
      'margen': totalIngresos > 0 
          ? ((totalIngresos - totalGastos) / totalIngresos * 100) 
          : 0,
      'proyectos_activos': (proyectosResponse as List).length,
      'equipos_por_vencer': equiposProximos,
    };
  }

  // ==================== GASTOS POR CATEGORÍA ====================
  
  static Future<List<Map<String, dynamic>>> getExpensesByCategory() async {
    final now = DateTime.now();
    final firstDayOfMonth = DateTime(now.year, now.month, 1).toIso8601String();
    
    final response = await _client
        .from('facturas_gastos')
        .select('tipo_gasto, monto')
        .eq('user_id', userId!)
        .eq('estado', 'pagada')
        .gte('fecha_factura', firstDayOfMonth);
    
    // Agrupar por categoría
    final Map<String, double> grouped = {};
    for (final item in (response as List)) {
      final tipo = item['tipo_gasto'] ?? 'otros';
      final monto = (item['monto'] as num?)?.toDouble() ?? 0;
      grouped[tipo] = (grouped[tipo] ?? 0) + monto;
    }
    
    return grouped.entries.map((e) => {
      'tipo': e.key,
      'monto': e.value,
    }).toList();
  }
}
