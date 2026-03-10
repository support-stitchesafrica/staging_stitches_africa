/**
 * Avatar 3D Viewer Component
 * 
 * Renders an animated 3D avatar with product overlay using Three.js
 * Features:
 * - 3D avatar rendering
 * - Product overlay visualization
 * - 360-degree rotation controls
 * - Touch and mouse interaction
 * - Mobile optimized
 */

'use client';

import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Loader2 } from 'lucide-react';

// Avatar configuration based on user profile
export interface AvatarConfig {
  height: number; // in cm
  bodyType: 'slim' | 'average' | 'athletic' | 'plus-size';
  skinTone: string; // hex color
  gender?: 'male' | 'female' | 'unisex';
}

// Product visualization data
export interface ProductVisualization {
  productId: string;
  category: string; // 'top', 'bottom', 'dress', 'outerwear', etc.
  color: string;
  pattern?: string;
  thumbnail?: string;
}

interface Avatar3DViewerProps {
  avatarConfig: AvatarConfig;
  product?: ProductVisualization;
  className?: string;
  enableRotation?: boolean;
  autoRotate?: boolean;
  onBodySizeChange?: (size: string) => void;
  onColorChange?: (color: string) => void;
}

/**
 * Simple Avatar Mesh with Product Image Texture
 * Creates a basic humanoid figure using Three.js primitives
 * Displays actual product image on the avatar
 */
function AvatarMesh({ config, product, productPosition, productRotation }: { config: AvatarConfig; product?: ProductVisualization; productPosition?: { x: number; y: number; z: number; }; productRotation?: { x: number; y: number; z: number; }; }) {
  const groupRef = useRef<THREE.Group>(null);
  const [productTexture, setProductTexture] = useState<THREE.Texture | null>(null);
  
  // Scale factor based on height (normalized to 170cm average)
  const heightScale = config.height / 170;
  
  // Body proportions based on body type
  const bodyScales = {
    'slim': { width: 0.8, depth: 0.8 },
    'average': { width: 1.0, depth: 1.0 },
    'athletic': { width: 1.1, depth: 1.0 },
    'plus-size': { width: 1.3, depth: 1.2 },
  };
  
  const bodyScale = bodyScales[config.bodyType] || bodyScales.average;
  
  // Skin tone color
  const skinColor = new THREE.Color(config.skinTone);
  
  // Product color for clothing (fallback)
  const productColor = product ? new THREE.Color(product.color) : new THREE.Color('#888888');

  // Load product image as texture with background removal
  useState(() => {
    if (product?.thumbnail) {
      const loader = new THREE.TextureLoader();
      loader.load(
        product.thumbnail,
        (texture) => {
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.generateMipmaps = true;
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          // Apply background removal by making white pixels transparent
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const img = texture.image;
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Simple background removal - make white pixels transparent
            for (let i = 0; i < data.length; i += 4) {
              // Check if pixel is close to white
              if (data[i] > 240 && data[i+1] > 240 && data[i+2] > 240) {
                data[i+3] = 0; // Set alpha to 0 (transparent)
              }
            }
            
            ctx.putImageData(imageData, 0, 0);
            const newTexture = new THREE.CanvasTexture(canvas);
            newTexture.wrapS = THREE.RepeatWrapping;
            newTexture.wrapT = THREE.RepeatWrapping;
            newTexture.generateMipmaps = true;
            newTexture.minFilter = THREE.LinearMipmapLinearFilter;
            setProductTexture(newTexture);
          } else {
            setProductTexture(texture);
          }
        },
        undefined,
        (error) => {
          console.error('Error loading product texture:', error);
        }
      );
    }
  });

  // Subtle animation
  useFrame((state) => {
    if (groupRef.current) {
      // Gentle breathing animation
      const breathe = Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
      groupRef.current.scale.y = heightScale + breathe;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Head */}
      {/* Enhanced Head with better proportions */}
      <mesh position={[0, 1.6 * heightScale, 0]} castShadow>
        <sphereGeometry args={[0.15 * heightScale, 64, 64]} />
        <meshStandardMaterial 
          color={skinColor}
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 1.45 * heightScale, 0]} castShadow>
        <cylinderGeometry args={[0.06 * heightScale, 0.07 * heightScale, 0.15 * heightScale, 16]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>

      {/* Torso (with product image texture if available) */}
      {/* Enhanced Torso with more realistic shape */}
      <mesh position={[0, 1.0 * heightScale, 0]} castShadow>
        <capsuleGeometry args={[0.2 * bodyScale.width * heightScale, 0.6 * heightScale, 16, 32]} />
        <meshStandardMaterial 
          map={product && productTexture && ['top', 'dress', 'outerwear'].includes(product.category) ? productTexture : undefined}
          color={product && ['top', 'dress', 'outerwear'].includes(product.category) ? (productTexture ? '#ffffff' : productColor) : skinColor}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* Arms */}
      {/* Left Arm */}
      <group position={[-0.25 * bodyScale.width * heightScale, 1.15 * heightScale, 0]}>
        <mesh position={[0, -0.25 * heightScale, 0]} castShadow>
          <cylinderGeometry args={[0.05 * heightScale, 0.05 * heightScale, 0.5 * heightScale, 16]} />
          <meshStandardMaterial 
            map={product && productTexture && ['top', 'dress', 'outerwear'].includes(product.category) ? productTexture : undefined}
            color={product && ['top', 'dress', 'outerwear'].includes(product.category) ? (productTexture ? '#ffffff' : productColor) : skinColor}
          />
        </mesh>
        <mesh position={[0, -0.6 * heightScale, 0]} castShadow>
          <cylinderGeometry args={[0.045 * heightScale, 0.04 * heightScale, 0.4 * heightScale, 16]} />
          <meshStandardMaterial color={skinColor} />
        </mesh>
      </group>

      {/* Right Arm */}
      <group position={[0.25 * bodyScale.width * heightScale, 1.15 * heightScale, 0]}>
        <mesh position={[0, -0.25 * heightScale, 0]} castShadow>
          <cylinderGeometry args={[0.05 * heightScale, 0.05 * heightScale, 0.5 * heightScale, 16]} />
          <meshStandardMaterial 
            map={product && productTexture && ['top', 'dress', 'outerwear'].includes(product.category) ? productTexture : undefined}
            color={product && ['top', 'dress', 'outerwear'].includes(product.category) ? (productTexture ? '#ffffff' : productColor) : skinColor}
          />
        </mesh>
        <mesh position={[0, -0.6 * heightScale, 0]} castShadow>
          <cylinderGeometry args={[0.045 * heightScale, 0.04 * heightScale, 0.4 * heightScale, 16]} />
          <meshStandardMaterial color={skinColor} />
        </mesh>
      </group>

      {/* Hips/Pelvis */}
      <mesh position={[0, 0.6 * heightScale, 0]} castShadow>
        <boxGeometry args={[0.35 * bodyScale.width * heightScale, 0.2 * heightScale, 0.25 * bodyScale.depth * heightScale]} />
        <meshStandardMaterial 
          map={product && productTexture && ['bottom', 'dress'].includes(product.category) ? productTexture : undefined}
          color={product && ['bottom', 'dress'].includes(product.category) ? (productTexture ? '#ffffff' : productColor) : skinColor}
        />
      </mesh>

      {/* Legs */}
      {/* Left Leg */}
      <group position={[-0.1 * bodyScale.width * heightScale, 0.5 * heightScale, 0]}>
        <mesh position={[0, -0.35 * heightScale, 0]} castShadow>
          <cylinderGeometry args={[0.08 * heightScale, 0.07 * heightScale, 0.7 * heightScale, 16]} />
          <meshStandardMaterial 
            map={product && productTexture && ['bottom', 'dress'].includes(product.category) ? productTexture : undefined}
            color={product && ['bottom', 'dress'].includes(product.category) ? (productTexture ? '#ffffff' : productColor) : skinColor}
          />
        </mesh>
        <mesh position={[0, -0.85 * heightScale, 0]} castShadow>
          <cylinderGeometry args={[0.06 * heightScale, 0.055 * heightScale, 0.5 * heightScale, 16]} />
          <meshStandardMaterial color={skinColor} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group position={[0.1 * bodyScale.width * heightScale, 0.5 * heightScale, 0]}>
        <mesh position={[0, -0.35 * heightScale, 0]} castShadow>
          <cylinderGeometry args={[0.08 * heightScale, 0.07 * heightScale, 0.7 * heightScale, 16]} />
          <meshStandardMaterial 
            map={product && productTexture && ['bottom', 'dress'].includes(product.category) ? productTexture : undefined}
            color={product && ['bottom', 'dress'].includes(product.category) ? (productTexture ? '#ffffff' : productColor) : skinColor}
          />
        </mesh>
        <mesh position={[0, -0.85 * heightScale, 0]} castShadow>
          <cylinderGeometry args={[0.06 * heightScale, 0.055 * heightScale, 0.5 * heightScale, 16]} />
          <meshStandardMaterial color={skinColor} />
        </mesh>
      </group>
      
      {/* Product Image Plane (floating in front of avatar for better visibility) */}
      {product && product.thumbnail && (
        <mesh 
          position={[productPosition?.x || 0, (productPosition?.y || 1.0) * heightScale, productPosition?.z || 0.3]}
          rotation={[productRotation?.x || 0, productRotation?.y || 0, productRotation?.z || 0]}
        >
          <planeGeometry args={[0.6 * heightScale, 0.8 * heightScale]} />
          <meshStandardMaterial 
            map={productTexture}
            transparent={true}
            opacity={0.95}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

/**
 * Loading fallback component
 */
function LoadingFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-2" />
        <p className="text-sm text-gray-600">Loading 3D viewer...</p>
      </div>
    </div>
  );
}

/**
 * Main Avatar 3D Viewer Component
 */
export function Avatar3DViewer({
  avatarConfig,
  product,
  className = '',
  enableRotation = true,
  autoRotate = false,
}: Avatar3DViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [productPosition, setProductPosition] = useState({ x: 0, y: 1.0, z: 0.3 });
  const [productRotation, setProductRotation] = useState({ x: 0, y: 0, z: 0 });

  // Handle keyboard controls for product positioning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!product) return;
      
      const step = 0.05;
      const rotationStep = 0.1;
      
      switch (e.key) {
        case 'ArrowUp':
          setProductPosition(prev => ({ ...prev, y: prev.y + step }));
          break;
        case 'ArrowDown':
          setProductPosition(prev => ({ ...prev, y: prev.y - step }));
          break;
        case 'ArrowLeft':
          setProductPosition(prev => ({ ...prev, x: prev.x - step }));
          break;
        case 'ArrowRight':
          setProductPosition(prev => ({ ...prev, x: prev.x + step }));
          break;
        case 'KeyW':
          setProductPosition(prev => ({ ...prev, z: prev.z + step }));
          break;
        case 'KeyS':
          setProductPosition(prev => ({ ...prev, z: prev.z - step }));
          break;
        case 'KeyQ':
          setProductRotation(prev => ({ ...prev, y: prev.y + rotationStep }));
          break;
        case 'KeyE':
          setProductRotation(prev => ({ ...prev, y: prev.y - rotationStep }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [product]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Canvas
        shadows
        onCreated={() => setIsLoading(false)}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          {/* Camera */}
          <PerspectiveCamera makeDefault position={[0, 1, 3]} fov={50} />

          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[5, 5, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <pointLight position={[-5, 5, -5]} intensity={0.3} />

          {/* Additional lighting for better visibility */}
          <hemisphereLight args={['#ffffff', '#444444', 0.6]} />
          <directionalLight position={[0, 5, 5]} intensity={0.5} castShadow />

          {/* Avatar with product */}
          <AvatarMesh 
            config={avatarConfig} 
            product={product} 
            productPosition={productPosition}
            productRotation={productRotation}
          />

          {/* Ground plane */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.1, 0]} receiveShadow>
            <planeGeometry args={[10, 10]} />
            <shadowMaterial opacity={0.2} />
          </mesh>

          {/* Orbit Controls for rotation */}
          {enableRotation && (
            <OrbitControls
              enableZoom={true}
              enablePan={false}
              minDistance={2}
              maxDistance={5}
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={Math.PI / 2}
              autoRotate={autoRotate}
              autoRotateSpeed={2}
            />
          )}
        </Suspense>
      </Canvas>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-10">
          <LoadingFallback />
        </div>
      )}
      
      {/* Product positioning instructions */}
      {product && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white text-xs p-2 rounded">
          Use arrow keys to move, W/S to adjust depth, Q/E to rotate
        </div>
      )}
    </div>
  );
}
