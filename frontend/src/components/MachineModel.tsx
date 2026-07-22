'use client';

import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, Float, ContactShadows, Html, useProgress } from '@react-three/drei';
import * as THREE from 'three';

// Loading Fallback Component
function Loader() {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center text-primary font-mono text-xs w-32 bg-surface-solid border border-border-strong px-4 py-3 rounded-lg shadow-lg">
        <span className="material-symbols-outlined animate-spin mb-2 text-2xl">progress_activity</span>
        LOADING...
      </div>
    </Html>
  );
}

// 3D Model Component
function Model({ url, riskLevel }: { url: string; riskLevel: string }) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const targetScale = hovered ? 1.05 : 1;
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
    
    if (riskLevel === 'CRITICAL') {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material.emissive) {
          child.material.emissiveIntensity = 0.4 + Math.sin(clock.getElapsedTime() * 5) * 0.3;
        }
      });
    }
  });

  // Dynamic light color based on state
  const lightColor = useMemo(() => {
    if (riskLevel === 'CRITICAL') return '#EF4444';
    if (riskLevel === 'WARNING') return '#F59E0B';
    return '#6366F1';
  }, [riskLevel]);

  // Apply material properties as a side effect (not useMemo — useMemo must be pure)
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (!child.userData.originalMaterial) {
          child.userData.originalMaterial = child.material.clone();
        }

        if (child.material.isMeshStandardMaterial || child.material.isMeshPhysicalMaterial) {
          child.material.metalness = 0.7;
          child.material.roughness = 0.3;
          child.material.envMapIntensity = 0.8;
        }

        if (riskLevel === 'CRITICAL') {
          child.material.emissive = new THREE.Color('#EF4444');
          child.material.emissiveIntensity = 0.4;
        } else if (riskLevel === 'WARNING') {
          child.material.emissive = new THREE.Color('#F59E0B');
          child.material.emissiveIntensity = 0.2;
        } else {
          child.material.emissive = new THREE.Color('#6366F1');
          child.material.emissiveIntensity = hovered ? 0.2 : 0.05;
        }
        child.material.needsUpdate = true;
      }
    });
  }, [scene, riskLevel, hovered]);

  const { scale, center } = useMemo(() => {
    const measureScene = scene.clone();
    measureScene.scale.set(1, 1, 1);
    measureScene.position.set(0, 0, 0);
    measureScene.rotation.set(0, 0, 0);
    measureScene.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(measureScene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    return { 
      scale: 2.5 / (maxDim || 1),
      center 
    };
  }, [scene, url]);

  return (
    <group 
      ref={groupRef}
      onPointerOver={() => setHovered(true)} 
      onPointerOut={() => setHovered(false)}
    >
      <group scale={scale} position={[-center.x * scale, -center.y * scale, -center.z * scale]}>
        <primitive object={scene} />
      </group>
      <pointLight position={[0, 0, 0]} color={lightColor} intensity={riskLevel === 'CRITICAL' ? 5 : 1} distance={6} />
    </group>
  );
}

export default function MachineModel({ machineType, riskLevel }: { machineType: string; riskLevel: string }) {
  const modelUrl = 
    machineType.toLowerCase().includes('conveyor') ? '/models/conveyor.glb' :
    machineType.toLowerCase().includes('robot') ? '/models/robot.glb' :
    machineType.toLowerCase().includes('filling') ? '/models/conveyor.glb' : 
    '/models/robot.glb';

  return (
    <div className="w-full h-full min-h-[300px] relative rounded-xl overflow-hidden cursor-grab active:cursor-grabbing bg-transparent">
      <Canvas shadows camera={{ position: [4, 3, 5], fov: 40 }} gl={{ alpha: true, antialias: true }}>
        
        <ambientLight intensity={0.3} />
        <spotLight position={[10, 10, 10]} angle={0.2} penumbra={1} intensity={1} castShadow shadow-bias={-0.0001} />
        <spotLight position={[-10, 5, -10]} angle={0.2} penumbra={1} intensity={0.5} color="#6366F1" />
        
        <pointLight 
          position={[0, 3, 0]} 
          intensity={riskLevel === 'CRITICAL' ? 3 : 0} 
          color="#EF4444" 
        />

        <React.Suspense fallback={<Loader />}>
          <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
            <Model url={modelUrl} riskLevel={riskLevel} />
          </Float>
          <Environment preset="city" />
          <ContactShadows position={[0, -1.2, 0]} opacity={0.6} scale={10} blur={2.5} far={4} color={riskLevel === 'CRITICAL' ? '#EF4444' : '#6366F1'} />
        </React.Suspense>

        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          minPolarAngle={Math.PI / 4} 
          maxPolarAngle={Math.PI / 2}
          autoRotate
          autoRotateSpeed={0.8}
          target={[0, 0, 0]}
        />
      </Canvas>
      
      <div className="absolute bottom-4 left-0 w-full text-center pointer-events-none">
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-on-surface-variant bg-surface-solid px-3 py-1 rounded-full border border-border-strong shadow-lg">
          Interactive 3D Digital Twin
        </span>
      </div>
    </div>
  );
}

// Preload assets to prevent stuttering
useGLTF.preload('/models/conveyor.glb');
useGLTF.preload('/models/robot.glb');
