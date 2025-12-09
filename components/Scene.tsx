import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Environment, OrbitControls, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import TreeContainer from './TreeContainer';
import GoldDust from './GoldDust';
import Snow from './Snow';
import { LUXURY_COLORS } from '../types';

interface SceneProps {
  progress: number;
  handRotation?: { x: number; y: number };
}

const Scene: React.FC<SceneProps> = ({ progress, handRotation = { x: 0, y: 0 } }) => {
  const sceneGroup = useRef<THREE.Group>(null);

  useFrame(() => {
    if (sceneGroup.current) {
        // Smoothly interpolate the scene rotation based on hand position
        // handRotation.x (-1 to 1) -> rotates around Y axis (pan left/right)
        // handRotation.y (-1 to 1) -> rotates around X axis (tilt up/down)
        
        const targetRotX = handRotation.y * 0.3; // Max tilt 0.3 radians
        const targetRotY = handRotation.x * 0.5; // Max pan 0.5 radians

        sceneGroup.current.rotation.x = THREE.MathUtils.lerp(sceneGroup.current.rotation.x, targetRotX, 0.05);
        sceneGroup.current.rotation.y = THREE.MathUtils.lerp(sceneGroup.current.rotation.y, targetRotY, 0.05);
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 4, 22]} fov={45} />
      
      {/* Controls - Restricted to keep the cinematic view, but allow some orbit */}
      <OrbitControls 
        enablePan={false} 
        enableZoom={true} 
        minDistance={10} 
        maxDistance={35}
        maxPolarAngle={Math.PI / 2 + 0.1} // Limit to not go under floor
        minPolarAngle={Math.PI / 3}
      />

      <Environment preset="lobby" background={false} />

      {/* Lighting Setup for Drama */}
      <ambientLight intensity={0.2} color={LUXURY_COLORS.EMERALD} />
      <spotLight 
        position={[10, 20, 10]} 
        angle={0.3} 
        penumbra={1} 
        intensity={200} 
        color={LUXURY_COLORS.GOLD_LIGHT} 
        castShadow 
      />
      <pointLight position={[-10, 5, -10]} intensity={50} color="#ffffff" />
      <pointLight position={[0, -5, 5]} intensity={20} color={LUXURY_COLORS.RED_RIBBON} />

      {/* Rotatable World Group controlled by Hand */}
      <group ref={sceneGroup}>
          {/* Main Content */}
          <TreeContainer progress={progress} />
          <GoldDust />
          <Snow />

          {/* Floor Shadows */}
          <ContactShadows 
            opacity={0.6} 
            scale={30} 
            blur={2} 
            far={10} 
            resolution={256} 
            color="#000000" 
            position={[0, -9.5, 0]}
          />
      </group>

      {/* Post Processing for the "Trump-Style" Glow */}
      <EffectComposer enableNormalPass={false}>
        <Bloom 
          luminanceThreshold={0.8} 
          intensity={1.2} 
          levels={9} 
          mipmapBlur 
        />
        <Vignette offset={0.3} darkness={0.6} />
        <Noise opacity={0.02} blendFunction={BlendFunction.OVERLAY} />
      </EffectComposer>
    </>
  );
};

export default Scene;