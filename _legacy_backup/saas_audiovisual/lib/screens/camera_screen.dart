import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' as http;
import '../services/supabase_service.dart';

class CameraScreen extends StatefulWidget {
  const CameraScreen({super.key});

  @override
  State<CameraScreen> createState() => _CameraScreenState();
}

class _CameraScreenState extends State<CameraScreen> {
  XFile? _imageFile;
  Uint8List? _imageBytes;
  bool _processing = false;
  final _picker = ImagePicker();

  Future<void> _pickImage(ImageSource source) async {
    try {
      final pickedFile = await _picker.pickImage(
        source: source,
        maxWidth: 1920,
        maxHeight: 1920,
        imageQuality: 85,
      );
      
      if (pickedFile != null) {
        final bytes = await pickedFile.readAsBytes();
        setState(() {
          _imageFile = pickedFile;
          _imageBytes = bytes;
        });
      }
    } catch (e) {
      _showError('Error al seleccionar imagen: $e');
    }
  }

  Future<void> _processInvoice() async {
    if (_imageBytes == null) return;
    setState(() => _processing = true);
    try {
      // Convertir imagen a base64
      final base64Image = base64Encode(_imageBytes!);
      
      // Llamamos al webhook de producción
      final url = Uri.parse('https://n8naws.josevec.uk/webhook/process-invoice');
      
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          // Colocamos temporalmente el ID que usamos de prueba.
          // En el futuro puedes traer el ID logueado: SupabaseService.client.auth.currentUser?.id
          'user_id': 'af341d31-c861-4242-950c-7f21be0b13b7',
          'image_base64': base64Image
        }),
      ).timeout(const Duration(seconds: 120)); // Ampliamos el timeout porque la IA puede tardar

      if (response.statusCode == 200) {
        final result = jsonDecode(response.body);
        
        if (result['success'] == true) {
          final extracted = result['extracted'] ?? {};
          if (mounted) {
            Navigator.pushNamed(context, '/confirm', arguments: {
              'image_path': _imageFile!.path,
              'monto': extracted['monto']?.toString(),
              'fecha_factura': extracted['fecha']?.toString(),
              'proveedor': extracted['proveedor']?.toString(),
              'concepto_ocr': extracted['categoria']?.toString() ?? '',
              'factura_id': null,
            });
          }
        } else {
          throw Exception('La IA no pudo procesar la factura: ${result['message']}');
        }
      } else {
        throw Exception('Error del servidor: HTTP ${response.statusCode}');
      }
    } catch (e) {
      _showError('Error procesando factura: $e');
    }
    if (mounted) setState(() => _processing = false);
  }

  // Métodos auxiliares para extraer datos del texto OCR
  String? _extractMonto(String text) {
    final montoRegExp = RegExp(r'(\$|USD|S/|€|MXN)?\s?([0-9]+[\.,][0-9]{2})');
    final match = montoRegExp.firstMatch(text);
    return match != null ? match.group(0) : null;
  }

  String? _extractFecha(String text) {
    final fechaRegExp = RegExp(r'(\d{2}[/-]\d{2}[/-]\d{4})|(\d{4}[/-]\d{2}[/-]\d{2})');
    final match = fechaRegExp.firstMatch(text);
    return match != null ? match.group(0) : null;
  }

  String? _extractProveedor(String text) {
    // Busca la primera línea como proveedor (puedes mejorar esto según tus facturas)
    final lines = text.split('\n');
    if (lines.isNotEmpty) {
      return lines[0].trim();
    }
    return null;
  }

  void _showError(String message) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Nueva Factura'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Column(
        children: [
          // Imagen o placeholder
          Expanded(
            child: _imageBytes == null
                ? _buildImagePlaceholder()
                : _buildImagePreview(),
          ),
          
          // Loading indicator
          if (_processing) _buildProcessingIndicator(),
          
          // Botones
          _buildActionButtons(),
        ],
      ),
    );
  }

  Widget _buildImagePlaceholder() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(60),
            ),
            child: Icon(
              Icons.receipt_long,
              size: 60,
              color: Colors.grey[400],
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Selecciona una imagen',
            style: TextStyle(
              color: Colors.grey[600],
              fontSize: 18,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Toma una foto o selecciona de la galería',
            style: TextStyle(color: Colors.grey[500], fontSize: 14),
          ),
        ],
      ),
    );
  }

  Widget _buildImagePreview() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Container(
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey[300]!),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Image.memory(
                  _imageBytes!,
                  fit: BoxFit.contain,
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              TextButton.icon(
                onPressed: () => setState(() {
                  _imageFile = null;
                  _imageBytes = null;
                }),
                icon: const Icon(Icons.delete_outline),
                label: const Text('Eliminar'),
                style: TextButton.styleFrom(foregroundColor: Colors.red),
              ),
              const SizedBox(width: 16),
              TextButton.icon(
                onPressed: () => _pickImage(ImageSource.gallery),
                icon: const Icon(Icons.swap_horiz),
                label: const Text('Cambiar'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildProcessingIndicator() {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          const LinearProgressIndicator(),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
              const SizedBox(width: 12),
              Text(
                'Procesando factura con IA...',
                style: TextStyle(color: Colors.grey[600]),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'Extrayendo monto, fecha y proveedor',
            style: TextStyle(color: Colors.grey[500], fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Botones de selección
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _processing ? null : () => _pickImage(ImageSource.gallery),
                  icon: const Icon(Icons.photo_library),
                  label: const Text('Galería'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _processing ? null : () => _pickImage(ImageSource.camera),
                  icon: const Icon(Icons.camera_alt),
                  label: const Text('Cámara'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          
          // Botón procesar
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton.icon(
              onPressed: _imageBytes != null && !_processing ? _processInvoice : null,
              icon: const Icon(Icons.auto_awesome),
              label: Text(
                _processing ? 'Procesando...' : 'Procesar Factura',
                style: const TextStyle(fontSize: 16),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Theme.of(context).primaryColor,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                disabledBackgroundColor: Colors.grey[300],
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    super.dispose();
  }
}
