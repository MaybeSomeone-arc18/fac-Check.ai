'use client';

import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, Float, ContactShadows, Html, useProgress } from '@react-three/drei';
import * as THREE from 'three';

// Loading Fallback Component
function Loader() {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center text-primary font-mono text-xs w-32 bg-[#0a101c]/95 backdrop-blur-md px-4 py-3 rounded-lg border border-primary/40 shadow-[0_0_20px_rgba(0,218,243,0.3)]">
        <span className="material-symbols-outlined animate-spin mb-2 text-2xl drop-shadow-[0_0_8px_rgba(0,218,243,0.8)]">progress_activity</span>
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

  // Auto-rotation is now handled by OrbitControls to keep the object static in world space.
  // We only handle hover scaling here.
  useFrame(() => {
    if (groupRef.current) {
      const targetScale = hovered ? 1.05 : 1;
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  // Dynamic light color based on state
  const lightColor = useMemo(() => {
    if (riskLevel === 'CRITICAL') return '#ff453a';
    if (riskLevel === 'WARNING') return '#ffaa00';
    return '#00daf3'; // STABLE uses primary color (cyan)
  }, [riskLevel]);

  // Recursively apply glow/emissive based on risk level
  useMemo(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (!child.userData.originalMaterial) {
          // Backup original materials
          child.userData.originalMaterial = child.material.clone();
        }
        
        // Enhance materials safely if they support PBR
        if (child.material.isMeshStandardMaterial || child.material.isMeshPhysicalMaterial) {
          child.material.metalness = 0.7;
          child.material.roughness = 0.3;
          child.material.envMapIntensity = 0.8;
        }

        // Apply dynamic emissive glow
        if (riskLevel === 'CRITICAL') {
          child.material.emissive = new THREE.Color('#ff453a');
          child.material.emissiveIntensity = 0.4 + Math.sin(Date.now() * 0.005) * 0.3; // Strobe
        } else if (riskLevel === 'WARNING') {
          child.material.emissive = new THREE.Color('#ffaa00');
          child.material.emissiveIntensity = 0.2;
        } else {
          // Stable: Subtle primary glow
          child.material.emissive = new THREE.Color('#00daf3');
          child.material.emissiveIntensity = hovered ? 0.2 : 0.05;
        }
        child.material.needsUpdate = true;
      }
    });
  }, [scene, riskLevel, hovered]);

  // Calculate center and scale exactly ONCE per model load
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
      scale: 2.5 / (maxDim || 1), // Slightly larger framing
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
      {/* Dynamic Aura Light centered on the object */}
      <pointLight position={[0, 0, 0]} color={lightColor} intensity={riskLevel === 'CRITICAL' ? 5 : 1} distance={6} />
    </group>
  );
}

export default function MachineModel({ machineType, riskLevel }: { machineType: string; riskLevel: string }) {
  // Determine model URL
  const modelUrl = 
    machineType.toLowerCase().includes('conveyor') ? '/models/conveyor.glb' :
    machineType.toLowerCase().includes('robot') ? '/models/robot.glb' :
    machineType.toLowerCase().includes('filling') ? '/models/conveyor.glb' : // Fallback
    '/models/robot.glb'; // Fallback for Sealing

  return (
    <div className="w-full h-full min-h-[300px] relative rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing bg-transparent">
      {/* The background should be transparent to show the glassmorphism panel behind it */}
      <Canvas shadows camera={{ position: [4, 3, 5], fov: 40 }} gl={{ alpha: true, antialias: true }}>
        
        {/* Soft, dramatic studio lighting */}
        <ambientLight intensity={0.3} />
        <spotLight position={[10, 10, 10]} angle={0.2} penumbra={1} intensity={1} castShadow shadow-bias={-0.0001} />
        <spotLight position={[-10, 5, -10]} angle={0.2} penumbra={1} intensity={0.5} color="#00daf3" />
        
        {/* Dynamic Risk Lighting from above */}
        <pointLight 
          position={[0, 3, 0]} 
          intensity={riskLevel === 'CRITICAL' ? 3 : 0} 
          color="#ff453a" 
        />

        <React.Suspense fallback={<Loader />}>
          <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
            <Model url={modelUrl} riskLevel={riskLevel} />
          </Float>
          <Environment preset="city" />
          <ContactShadows position={[0, -1.2, 0]} opacity={0.6} scale={10} blur={2.5} far={4} color={riskLevel === 'CRITICAL' ? '#ff453a' : '#00daf3'} />
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
      
      {/* Absolute overlay for Risk % text if needed */}
      <div className="absolute bottom-4 left-0 w-full text-center pointer-events-none drop-shadow-md">
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-on-surface-variant bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
          Interactive 3D Digital Twin
        </span>
      </div>
    </div>
  );
}

// Preload assets to prevent stuttering
useGLTF.preload('/models/conveyor.glb');
useGLTF.preload('/models/robot.glb');
