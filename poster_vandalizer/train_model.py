import os
import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.callbacks import ReduceLROnPlateau, EarlyStopping

posters_dir = "backend/posters"
output_dir = "poster_vandalizer/assets"
model_path = os.path.join(output_dir, "poster_classifier.tflite")
labels_path = os.path.join(output_dir, "labels.txt")

os.makedirs(output_dir, exist_ok=True)

image_size = (128, 128)
classes = []
X_train = []
y_train = []

for filename in sorted(os.listdir(posters_dir)):
    if filename.endswith(('.png', '.jpg', '.jpeg')):
        poster_name = os.path.splitext(filename)[0]
        if poster_name not in classes:
            classes.append(poster_name)

print(f"Found classes: {classes}")

def add_noise(img):
    noise = np.random.normal(0, 10, img.shape)
    return np.clip(img + noise, 0, 255).astype(np.uint8)

def brightness_adjust(img, factor):
    return np.clip(img * factor, 0, 255).astype(np.uint8)

def random_crop_resize(img, target_size):
    w, h = img.size
    crop_size = min(w, h)
    left = (w - crop_size) // 2
    top = (h - crop_size) // 2
    cropped = img.crop((left, top, left + crop_size, top + crop_size))
    return cropped.resize(target_size, Image.LANCZOS)

for idx, class_name in enumerate(classes):
    class_dir = os.path.join(posters_dir, class_name + ".png")
    if os.path.exists(class_dir):
        img = Image.open(class_dir).convert('RGB')
        img = img.resize(image_size)
        img_array = np.array(img)
        
        for _ in range(20):
            X_train.append(img_array / 255.0)
            y_train.append(idx)
        
        for angle in [15, 30, 45, 60, 90, 120, 135, 150, 165, 180, 210, 225, 240, 255, 270, 300, 315, 330]:
            rotated = img.rotate(angle, expand=True)
            rotated = rotated.resize(image_size, Image.LANCZOS)
            X_train.append(np.array(rotated) / 255.0)
            y_train.append(idx)
            
            flipped = rotated.transpose(Image.FLIP_LEFT_RIGHT)
            X_train.append(np.array(flipped) / 255.0)
            y_train.append(idx)
        
        for brightness in [0.6, 0.7, 0.8, 0.9, 1.1, 1.2, 1.3, 1.4, 1.5]:
            bright_img = brightness_adjust(img_array, brightness)
            X_train.append(bright_img / 255.0)
            y_train.append(idx)
        
        for contrast in [0.7, 0.85, 1.15, 1.3]:
            factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255))
            contrast_img = np.clip(factor * (img_array - 128) + 128, 0, 255).astype(np.uint8)
            X_train.append(contrast_img / 255.0)
            y_train.append(idx)
        
        noisy = add_noise(img_array)
        X_train.append(noisy / 255.0)
        y_train.append(idx)
        
        for crop_factor in [0.7, 0.8, 0.9]:
            crop_size = (int(image_size[0] * crop_factor), int(image_size[1] * crop_factor))
            temp_img = img.resize(crop_size)
            new_img = Image.new('RGB', image_size, (128, 128, 128))
            new_img.paste(temp_img, ((image_size[0] - crop_size[0]) // 2, (image_size[1] - crop_size[1]) // 2))
            X_train.append(np.array(new_img) / 255.0)
            y_train.append(idx)

X_train = np.array(X_train)
y_train = to_categorical(y_train, num_classes=len(classes))

print(f"Training samples: {len(X_train)}")
print(f"Classes: {len(classes)}")
print(f"Shape: {X_train.shape}")

base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(128, 128, 3))
x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dropout(0.5)(x)
x = Dense(256, activation='relu')(x)
x = Dropout(0.3)(x)
predictions = Dense(len(classes), activation='softmax')(x)

model = Model(inputs=base_model.input, outputs=predictions)

for layer in base_model.layers:
    layer.trainable = False

model.compile(optimizer=Adam(learning_rate=0.001), loss='categorical_crossentropy', metrics=['accuracy'])

reduce_lr = ReduceLROnPlateau(monitor='loss', factor=0.5, patience=3, min_lr=0.00001)
early_stop = EarlyStopping(monitor='loss', patience=10, restore_best_weights=True)

model.fit(X_train, y_train, epochs=100, batch_size=16, verbose=1, callbacks=[reduce_lr, early_stop])

for layer in base_model.layers[-30:]:
    layer.trainable = True

model.compile(optimizer=Adam(learning_rate=0.0001), loss='categorical_crossentropy', metrics=['accuracy'])

model.fit(X_train, y_train, epochs=50, batch_size=16, verbose=1, callbacks=[reduce_lr, early_stop])

converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.target_spec.supported_types = [tf.float32]
tflite_model = converter.convert()

with open(model_path, 'wb') as f:
    f.write(tflite_model)

print(f"Model saved to {model_path}")

with open(labels_path, 'w') as f:
    for cls in classes:
        f.write(cls + '\n')

print(f"Labels saved to {labels_path}")
