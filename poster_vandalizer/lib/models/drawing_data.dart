import 'dart:ui';

class DrawingPoint {
  final double x;
  final double y;

  DrawingPoint({required this.x, required this.y});

  factory DrawingPoint.fromJson(Map<String, dynamic> json) {
    return DrawingPoint(
      x: (json['x'] as num).toDouble(),
      y: (json['y'] as num).toDouble(),
    );
  }

  Map<String, dynamic> toJson() => {'x': x, 'y': y};

  Offset toOffset() => Offset(x, y);

  factory DrawingPoint.fromOffset(Offset offset) {
    return DrawingPoint(x: offset.dx, y: offset.dy);
  }
}

class DrawingLine {
  final String? id;
  final String? posterId;
  final List<DrawingPoint> points;
  final String color;
  final int size;
  final String? userId;
  final String? userName;

  DrawingLine({
    this.id,
    this.posterId,
    required this.points,
    required this.color,
    required this.size,
    this.userId,
    this.userName,
  });

  factory DrawingLine.empty() {
    return DrawingLine(points: [], color: '#FF6B6B', size: 12);
  }

  factory DrawingLine.fromJson(Map<String, dynamic> json) {
    final linesData = json['linesData'] ?? json['points'];
    List<DrawingPoint> parsedPoints = [];

    if (linesData is List) {
      parsedPoints = linesData.map((p) {
        if (p is Map<String, dynamic>) {
          return DrawingPoint.fromJson(p);
        } else if (p is List && p.length >= 2) {
          return DrawingPoint(
            x: (p[0] as num).toDouble(),
            y: (p[1] as num).toDouble(),
          );
        }
        return DrawingPoint(x: 0, y: 0);
      }).toList();
    }

    return DrawingLine(
      id: json['id']?.toString(),
      posterId: json['posterId']?.toString(),
      points: parsedPoints,
      color: json['color']?.toString() ?? '#FF6B6B',
      size: json['size'] is int
          ? json['size']
          : int.tryParse(json['size']?.toString() ?? '12') ?? 12,
      userId: json['userId']?.toString() ?? json['user']?['id']?.toString(),
      userName: json['user']?['name']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (posterId != null) 'posterId': posterId,
      'points': points.map((p) => p.toJson()).toList(),
      'color': color,
      'size': size,
    };
  }

  DrawingLine copyWith({
    String? id,
    String? posterId,
    List<DrawingPoint>? points,
    String? color,
    int? size,
    String? userId,
    String? userName,
  }) {
    return DrawingLine(
      id: id ?? this.id,
      posterId: posterId ?? this.posterId,
      points: points ?? this.points,
      color: color ?? this.color,
      size: size ?? this.size,
      userId: userId ?? this.userId,
      userName: userName ?? this.userName,
    );
  }
}
