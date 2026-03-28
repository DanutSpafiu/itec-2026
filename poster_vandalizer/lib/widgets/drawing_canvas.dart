import 'package:flutter/material.dart';
import '../models/drawing_data.dart';

class DrawingCanvas extends CustomPainter {
  final List<DrawingLine> savedLines;
  final DrawingLine? currentLine;
  final List<DrawingLine> liveLines;
  final List<DrawingLine> historyLines;

  DrawingCanvas({
    required this.savedLines,
    this.currentLine,
    required this.liveLines,
    required this.historyLines,
  });

  @override
  void paint(Canvas canvas, Size size) {
    // Draw history lines (from database)
    for (final line in historyLines) {
      _drawLine(canvas, line);
    }

    // Draw live lines (from other users)
    for (final line in liveLines) {
      _drawLine(canvas, line);
    }

    // Draw saved lines (from current session)
    for (final line in savedLines) {
      _drawLine(canvas, line);
    }

    // Draw current line being drawn
    if (currentLine != null) {
      _drawLine(canvas, currentLine!);
    }
  }

  void _drawLine(Canvas canvas, DrawingLine line) {
    if (line.points.isEmpty) return;

    final paint = Paint()
      ..color = _parseColor(line.color)
      ..strokeWidth = line.size.toDouble()
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..style = PaintingStyle.stroke;

    final path = Path();
    final firstPoint = line.points.first.toOffset();
    path.moveTo(firstPoint.dx, firstPoint.dy);

    for (int i = 1; i < line.points.length; i++) {
      final point = line.points[i].toOffset();
      path.lineTo(point.dx, point.dy);
    }

    canvas.drawPath(path, paint);
  }

  Color _parseColor(String colorHex) {
    try {
      final hex = colorHex.replaceFirst('#', '');
      return Color(int.parse('0xFF$hex'));
    } catch (e) {
      return Colors.red;
    }
  }

  @override
  bool shouldRepaint(covariant DrawingCanvas oldDelegate) {
    return true;
  }
}
