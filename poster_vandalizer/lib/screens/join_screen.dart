import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
import '../services/socket_service.dart';
import 'camera_screen.dart';

class JoinScreen extends StatefulWidget {
  const JoinScreen({super.key});

  @override
  State<JoinScreen> createState() => _JoinScreenState();
}

class _JoinScreenState extends State<JoinScreen> {
  final _nameController = TextEditingController();
  final _serverController = TextEditingController(text: 'http://10.0.2.2:3000');
  bool _isJoining = false;

  @override
  void dispose() {
    _nameController.dispose();
    _serverController.dispose();
    super.dispose();
  }

  void _join() async {
    if (_nameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Please enter your name')));
      return;
    }

    setState(() => _isJoining = true);

    final userId = const Uuid().v4();
    final userName = _nameController.text.trim();
    final serverUrl = _serverController.text.trim();

    final socketService = context.read<SocketService>();
    socketService.initialize(serverUrl, userId, userName);

    // Register user with backend
    socketService.registerUser(userName);

    await Future.delayed(const Duration(milliseconds: 1000));

    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => CameraScreen(
            userId: userId,
            userName: userName,
            serverUrl: serverUrl,
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Icon(Icons.brush, size: 80, color: Colors.deepPurple),
              const SizedBox(height: 24),
              const Text(
                'Poster Vandalizer',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                'Find posters and draw on them in real-time!',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 16, color: Colors.grey),
              ),
              const SizedBox(height: 48),
              TextField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Your Name',
                  prefixIcon: Icon(Icons.person),
                  border: OutlineInputBorder(),
                ),
                textCapitalization: TextCapitalization.words,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _serverController,
                decoration: const InputDecoration(
                  labelText: 'Server URL',
                  prefixIcon: Icon(Icons.cloud),
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.url,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _isJoining ? null : _join,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: Colors.deepPurple,
                  foregroundColor: Colors.white,
                ),
                child: _isJoining
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text(
                        'START VANDALIZING',
                        style: TextStyle(fontSize: 16),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
