import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../models/drawing_data.dart';

class SocketService extends ChangeNotifier {
  io.Socket? _socket;
  bool _isConnected = false;
  String? _currentPosterId;
  String _userId = '';
  String _userName = '';

  final List<DrawingLine> _drawingHistory = [];
  final List<DrawingLine> _liveLines = [];

  bool get isConnected => _isConnected;
  String? get currentPosterId => _currentPosterId;
  String get userId => _userId;
  String get userName => _userName;
  List<DrawingLine> get drawingHistory => List.unmodifiable(_drawingHistory);
  List<DrawingLine> get liveLines => List.unmodifiable(_liveLines);

  Function(DrawingLine)? onLiveLineReceived;
  Function(DrawingLine)? onHistoryLoaded;
  Function(DrawingLine)? onRemoteGraffitiSaved;

  void initialize(String serverUrl, String userId, String userName) {
    _userId = userId;
    _userName = userName;

    _socket = io.io(serverUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': true,
    });

    _socket!.onConnect((_) {
      _isConnected = true;
      notifyListeners();
    });

    _socket!.onDisconnect((_) {
      _isConnected = false;
      _currentPosterId = null;
      _drawingHistory.clear();
      _liveLines.clear();
      notifyListeners();
    });

    _socket!.on('receive_live_line', (data) {
      final line = DrawingLine.fromJson(data);
      _liveLines.add(line);
      onLiveLineReceived?.call(line);
      notifyListeners();
    });

    _socket!.on('load_drawing_history', (data) {
      _drawingHistory.clear();
      _liveLines.clear();
      if (data is List) {
        for (var item in data) {
          _drawingHistory.add(DrawingLine.fromJson(item));
        }
      }
      onHistoryLoaded?.call(
        _drawingHistory.isNotEmpty ? _drawingHistory.last : DrawingLine.empty(),
      );
      notifyListeners();
    });

    _socket!.on('remote_graffiti_saved', (data) {
      final line = DrawingLine.fromJson(data);
      _drawingHistory.add(line);
      onRemoteGraffitiSaved?.call(line);
      notifyListeners();
    });
  }

  void registerUser(String userName) {
    if (_socket == null) return;
    _socket!.emit('register_user', {'name': userName});
  }

  void enterPoster(String posterId) {
    if (_socket == null || !_isConnected) return;
    _currentPosterId = posterId;
    _socket!.emit('phone_sees_poster', posterId);
    notifyListeners();
  }

  void leavePoster() {
    if (_socket == null || _currentPosterId == null) return;
    _socket!.emit('phone_loses_poster', _currentPosterId);
    _currentPosterId = null;
    _drawingHistory.clear();
    _liveLines.clear();
    notifyListeners();
  }

  void sendLiveLine(DrawingLine line) {
    if (_socket == null || !_isConnected || _currentPosterId == null) return;
    _socket!.emit('user_draws_line_live', line.toJson());
  }

  void saveFinalDrawing(List<DrawingLine> lines, String color, int size) {
    if (_socket == null || !_isConnected || _currentPosterId == null) return;

    final completeLineJSON = lines.map((l) => l.toJson()).toList();

    _socket!.emit('phone_saves_final_drawing', {
      'posterId': _currentPosterId,
      'dbUserId': _userId,
      'completeLineJSON': completeLineJSON,
      'color': color,
      'size': size,
    });
  }

  void clearLiveLines() {
    _liveLines.clear();
    notifyListeners();
  }

  @override
  void dispose() {
    _socket?.disconnect();
    _socket?.dispose();
    super.dispose();
  }
}
