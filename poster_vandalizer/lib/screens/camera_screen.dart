import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:tflite_flutter/tflite_flutter.dart';
import 'package:provider/provider.dart';
import '../services/socket_service.dart';
import '../models/drawing_data.dart';
import '../widgets/drawing_canvas.dart';

class CameraScreen extends StatefulWidget {
  final String userId;
  final String userName;
  final String serverUrl;

  const CameraScreen({
    super.key,
    required this.userId,
    required this.userName,
    required this.serverUrl,
  });

  @override
  State<CameraScreen> createState() => _CameraScreenState();
}

class _CameraScreenState extends State<CameraScreen> {
  CameraController? _cameraController;
  List<CameraDescription>? _cameras;
  Interpreter? _interpreter;
  List<String>? _labels;
  bool _isModelLoaded = false;

  String? _currentPosterId;
  String? _lastDetectedPoster;
  bool _isDrawing = false;
  bool _isCameraReady = false;
  String? _recognizedPosterMessage;

  final List<DrawingLine> _currentDrawingLines = [];
  DrawingLine? _currentLine;
  String _selectedColor = '#FF6B6B';
  int _selectedSize = 12;

  static const List<String> _colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEAA7',
    '#DDA0DD',
    '#98D8C8',
    '#F7DC6F',
  ];

  static const List<String> _availablePosters = [
    'afis1',
    'afis2',
    'afis3',
    'afis4',
    'afis5',
    'afis6',
    'afis7',
    'afis8',
    'afis9',
    'afis10',
  ];

  @override
  void initState() {
    super.initState();
    _initModel();
    _initCamera();
    _initSocket();
  }

  Future<void> _initModel() async {
    try {
      _interpreter = await Interpreter.fromAsset('poster_classifier.tflite');

      final labelFile = await DefaultAssetBundle.of(
        context,
      ).loadString('assets/labels.txt');
      _labels = labelFile.split('\n').where((s) => s.isNotEmpty).toList();

      setState(() => _isModelLoaded = true);
      debugPrint('Model loaded successfully with ${_labels?.length} labels');
    } catch (e) {
      debugPrint('Error loading model: $e');
    }
  }

  void _initSocket() {
    final socketService = context.read<SocketService>();
    socketService.initialize(widget.serverUrl, widget.userId, widget.userName);

    socketService.onLiveLineReceived = (line) {
      if (mounted) setState(() {});
    };

    socketService.onHistoryLoaded = (line) {
      if (mounted) setState(() {});
    };
  }

  Future<void> _initCamera() async {
    try {
      _cameras = await availableCameras();
      if (_cameras == null || _cameras!.isEmpty) {
        debugPrint('No cameras available');
        return;
      }

      final camera = _cameras!.firstWhere(
        (c) => c.lensDirection == CameraLensDirection.back,
        orElse: () => _cameras!.first,
      );

      _cameraController = CameraController(
        camera,
        ResolutionPreset.high,
        enableAudio: false,
      );

      await _cameraController!.initialize();
      _cameraController!.startImageStream(_processCameraImage);

      if (mounted) {
        setState(() => _isCameraReady = true);
      }
    } catch (e) {
      debugPrint('Error initializing camera: $e');
    }
  }

  Future<void> _processCameraImage(CameraImage image) async {
    if (_interpreter == null || !_isModelLoaded || _labels == null) return;

    try {
      if (image.planes.isEmpty) return;

      final input = _preprocessImage(image);

      final output = List.filled(10, 0.0);
      _interpreter!.run(input, output);

      double maxConfidence = 0;
      int maxIndex = 0;
      for (int i = 0; i < output.length; i++) {
        if (output[i] > maxConfidence) {
          maxConfidence = output[i];
          maxIndex = i;
        }
      }

      if (maxConfidence > 0.6 && maxIndex < _labels!.length) {
        final detectedPoster = _labels![maxIndex];

        if (detectedPoster != _lastDetectedPoster) {
          _lastDetectedPoster = detectedPoster;

          if (mounted) {
            setState(() {
              _recognizedPosterMessage =
                  '${detectedPoster.toUpperCase()} recognized!';
            });

            Future.delayed(const Duration(seconds: 2), () {
              if (mounted) {
                setState(() => _recognizedPosterMessage = null);
              }
            });

            _onPosterDetected(detectedPoster);
          }
        }
      }
    } catch (e) {
      debugPrint('Error processing image: $e');
    }
  }

  List<List<List<List<double>>>> _preprocessImage(CameraImage image) {
    const targetSize = 224;

    final plane = image.planes.first;
    final bytes = plane.bytes;
    final width = image.width;
    final height = image.height;

    final input = List.generate(
      1,
      (b) => List.generate(
        targetSize,
        (y) => List.generate(targetSize, (x) {
          final xRatio = x / targetSize;
          final yRatio = y / targetSize;
          final srcX = (xRatio * width).toInt().clamp(0, width - 1);
          final srcY = (yRatio * height).toInt().clamp(0, height - 1);
          final index = (srcY * width + srcX) * 4;
          if (index + 2 < bytes.length) {
            final r = bytes[index] / 255.0;
            final g = bytes[index + 1] / 255.0;
            final bVal = bytes[index + 2] / 255.0;
            return [r, g, bVal];
          }
          return [0.0, 0.0, 0.0];
        }),
      ),
    );

    return input;
  }

  void _onPosterDetected(String posterId) {
    if (_currentPosterId != posterId) {
      setState(() {
        _currentPosterId = posterId;
        _currentDrawingLines.clear();
      });

      final socketService = context.read<SocketService>();
      socketService.enterPoster(posterId);
    }
  }

  void _selectPosterManually(String posterId) {
    setState(() {
      _currentPosterId = posterId;
      _currentDrawingLines.clear();
      _recognizedPosterMessage = '${posterId.toUpperCase()} selected!';
    });

    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() => _recognizedPosterMessage = null);
      }
    });

    final socketService = context.read<SocketService>();
    socketService.enterPoster(posterId);
  }

  void _showPosterSelector() {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Select Poster to Vandalize',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _availablePosters.map((poster) {
                final isSelected = poster == _currentPosterId;
                return ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    _selectPosterManually(poster);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isSelected
                        ? Colors.green
                        : Colors.deepPurple,
                    foregroundColor: Colors.white,
                  ),
                  child: Text(poster.toUpperCase()),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  void _onTouchStart(Offset position) {
    if (_currentPosterId == null) return;

    setState(() {
      _isDrawing = true;
      _currentLine = DrawingLine(
        posterId: _currentPosterId,
        points: [DrawingPoint.fromOffset(position)],
        color: _selectedColor,
        size: _selectedSize,
        userId: widget.userId,
        userName: widget.userName,
      );
    });
  }

  void _onTouchMove(Offset position) {
    if (!_isDrawing || _currentLine == null) return;

    setState(() {
      final newPoints = List<DrawingPoint>.from(_currentLine!.points)
        ..add(DrawingPoint.fromOffset(position));
      _currentLine = _currentLine!.copyWith(points: newPoints);
    });

    final socketService = context.read<SocketService>();
    socketService.sendLiveLine(_currentLine!);
  }

  void _onTouchEnd() {
    if (!_isDrawing || _currentLine == null) return;

    setState(() {
      _isDrawing = false;
      if (_currentLine!.points.length > 1) {
        _currentDrawingLines.add(_currentLine!);
      }
      _currentLine = null;
    });

    final socketService = context.read<SocketService>();
    socketService.saveFinalDrawing(
      _currentDrawingLines,
      _selectedColor,
      _selectedSize,
    );
  }

  void _clearCanvas() {
    setState(() {
      _currentDrawingLines.clear();
    });
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    _interpreter?.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          if (_isCameraReady && _cameraController != null)
            Positioned.fill(child: CameraPreview(_cameraController!))
          else
            const Center(child: CircularProgressIndicator()),

          if (_currentPosterId != null)
            Positioned.fill(
              child: GestureDetector(
                onPanStart: (details) => _onTouchStart(details.localPosition),
                onPanUpdate: (details) => _onTouchMove(details.localPosition),
                onPanEnd: (_) => _onTouchEnd(),
                child: Consumer<SocketService>(
                  builder: (context, socketService, child) {
                    return CustomPaint(
                      painter: DrawingCanvas(
                        savedLines: _currentDrawingLines,
                        currentLine: _currentLine,
                        liveLines: socketService.liveLines,
                        historyLines: socketService.drawingHistory,
                      ),
                      size: Size.infinite,
                    );
                  },
                ),
              ),
            ),

          if (_recognizedPosterMessage != null)
            Positioned(
              top: 100,
              left: 0,
              right: 0,
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.green,
                    borderRadius: BorderRadius.circular(25),
                  ),
                  child: Text(
                    _recognizedPosterMessage!,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ),

          SafeArea(
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: _currentPosterId != null
                              ? Colors.green
                              : Colors.grey,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              _currentPosterId != null
                                  ? Icons.visibility
                                  : Icons.visibility_off,
                              color: Colors.white,
                              size: 16,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              _currentPosterId ?? 'Point at a poster',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Row(
                        children: [
                          IconButton(
                            icon: const Icon(Icons.image, color: Colors.white),
                            onPressed: _showPosterSelector,
                            style: IconButton.styleFrom(
                              backgroundColor: Colors.blue.withValues(
                                alpha: 0.7,
                              ),
                            ),
                            tooltip: 'Select Poster',
                          ),
                          if (_currentPosterId != null) ...[
                            const SizedBox(width: 8),
                            IconButton(
                              icon: const Icon(
                                Icons.delete,
                                color: Colors.white,
                              ),
                              onPressed: _clearCanvas,
                              style: IconButton.styleFrom(
                                backgroundColor: Colors.red.withValues(
                                  alpha: 0.7,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),

                const Spacer(),

                if (_currentPosterId != null)
                  Container(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.line_weight, color: Colors.white),
                            Expanded(
                              child: Slider(
                                value: _selectedSize.toDouble(),
                                min: 4,
                                max: 30,
                                onChanged: (value) {
                                  setState(() => _selectedSize = value.toInt());
                                },
                              ),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.5),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                            children: _colors.map((color) {
                              final isSelected = color == _selectedColor;
                              return GestureDetector(
                                onTap: () =>
                                    setState(() => _selectedColor = color),
                                child: Container(
                                  width: 36,
                                  height: 36,
                                  decoration: BoxDecoration(
                                    color: Color(
                                      int.parse(
                                        color.replaceFirst('#', '0xFF'),
                                      ),
                                    ),
                                    shape: BoxShape.circle,
                                    border: isSelected
                                        ? Border.all(
                                            color: Colors.white,
                                            width: 3,
                                          )
                                        : null,
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
