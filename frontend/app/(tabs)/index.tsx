import { useState } from 'react';
import { View, StyleSheet, PanResponder, TouchableOpacity, Text } from 'react-native';
import { Canvas, Path, vec, Circle, Fill } from '@shopify/react-native-skia';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  size: number;
}

export default function DrawingApp() {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [currentColor, setCurrentColor] = useState('#FF6B6B');
  const [brushSize, setBrushSize] = useState(8);
  
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
  const sizes = [4, 8, 12, 16, 20];

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      setCurrentStroke([{ x: locationX, y: locationY }]);
    },
    onPanResponderMove: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      setCurrentStroke(prev => [...prev, { x: locationX, y: locationY }]);
    },
    onPanResponderRelease: () => {
      if (currentStroke.length > 0) {
        setStrokes(prev => [...prev, {
          points: currentStroke,
          color: currentColor,
          size: brushSize
        }]);
        setCurrentStroke([]);
      }
    },
  });

  const clearCanvas = () => {
    setStrokes([]);
    setCurrentStroke([]);
  };

  // Convert points to SVG path string
  const pointsToPath = (points: Point[]) => {
    if (points.length === 0) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎨 Skia Drawing Pad</Text>
        <TouchableOpacity style={styles.clearButton} onPress={clearCanvas}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <View {...panResponder.panHandlers} style={styles.canvasContainer}>
        <Canvas style={styles.canvas}>
          <Fill color="#FFFFFF" />
          
          {/* Draw completed strokes */}
          {strokes.map((stroke, strokeIndex) => (
            <Path
              key={`stroke-${strokeIndex}`}
              path={pointsToPath(stroke.points)}
              color={stroke.color}
              style="stroke"
              strokeWidth={stroke.size}
              strokeCap="round"
              strokeJoin="round"
            />
          ))}
          
          {/* Draw current stroke (while finger is down) */}
          {currentStroke.length > 0 && (
            <Path
              path={pointsToPath(currentStroke)}
              color={currentColor}
              style="stroke"
              strokeWidth={brushSize}
              strokeCap="round"
              strokeJoin="round"
            />
          )}
        </Canvas>
      </View>

      {/* Color picker */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Colors</Text>
        <View style={styles.colorContainer}>
          {colors.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorButton,
                { backgroundColor: color },
                currentColor === color && styles.selectedColor
              ]}
              onPress={() => setCurrentColor(color)}
            />
          ))}
        </View>

        {/* Brush size picker */}
        <Text style={styles.panelTitle}>Brush Size</Text>
        <View style={styles.sizeContainer}>
          {sizes.map((size) => (
            <TouchableOpacity
              key={size}
              style={[
                styles.sizeButton,
                brushSize === size && styles.selectedSize
              ]}
              onPress={() => setBrushSize(size)}
            >
              <View style={[styles.sizePreview, { width: size, height: size, backgroundColor: currentColor }]} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  clearButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
  },
  clearText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  canvasContainer: {
    flex: 1,
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  canvas: {
    flex: 1,
    borderRadius: 12,
  },
  panel: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  colorContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  selectedColor: {
    borderColor: '#333',
    transform: [{ scale: 1.1 }],
  },
  sizeContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  sizeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedSize: {
    borderColor: '#FF6B6B',
    backgroundColor: '#ffe6e6',
  },
  sizePreview: {
    borderRadius: 10,
  },
});