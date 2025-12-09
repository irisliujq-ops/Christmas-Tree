import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { generateOrnamentsData } from '../utils';
import { TREE_CONFIG, LUXURY_COLORS, PositionData } from '../types';

interface OrnamentsProps {
  progress: number;
}

const Ornaments: React.FC<OrnamentsProps> = ({ progress }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() => generateOrnamentsData(TREE_CONFIG.ORNAMENT_COUNT), []);
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const tempVector = useMemo(() => new THREE.Vector3(), []);
  const currentPositions = useRef<THREE.Vector3[]>(data.map(d => d.chaos.clone()));

  // Setup initial colors
  useLayoutEffect(() => {
    if (meshRef.current) {
      data.forEach((d, i) => {
        meshRef.current!.setColorAt(i, d.color);
      });
      meshRef.current.instanceColor!.needsUpdate = true;
    }
  }, [data]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // We do logic in CPU here because standard materials are harder to morph with custom attributes without patching
    // Also, 400 instances is cheap for CPU
    
    const time = state.clock.getElapsedTime();
    let needsUpdate = false;

    // Lerp Factor for smoothing
    // We want the ornaments to lag slightly behind the foliage for a "heavy" feel
    const lerpFactor = delta * 2.0; 

    data.forEach((d, i) => {
      const currentPos = currentPositions.current[i];
      
      // Calculate target based on global progress
      // We mix the chaos vector and the target vector
      // We add some noise to the "flight" path
      const targetPos = d.target;
      const chaosPos = d.chaos;

      // Determine the actual target for this frame based on prop 'progress'
      // Use cubic easing
      const t = progress; 
      const ease = 1 - Math.pow(1 - t, 3);
      
      const destination = tempVector.lerpVectors(chaosPos, targetPos, ease);

      // Apply some physics-like movement
      // Heavier objects (boxes) move slower/more directly
      // Lighter objects (lights) float a bit
      
      if (t < 0.99 && t > 0.01) {
         if (d.type === 'light') {
             destination.y += Math.sin(time * 3 + i) * 0.1;
         }
      }

      // Move current position towards calculated destination
      currentPos.lerp(destination, lerpFactor);

      // Rotation
      tempObject.position.copy(currentPos);
      tempObject.scale.setScalar(d.scale);
      
      // Rotate based on time and type
      if (d.type === 'box') {
        tempObject.rotation.set(0, time * 0.2 + i, 0);
      } else {
        tempObject.rotation.set(time * 0.5, time * 0.3, i);
      }
      
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, TREE_CONFIG.ORNAMENT_COUNT]}
      castShadow
      receiveShadow
    >
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial
        roughness={0.15}
        metalness={0.9}
        envMapIntensity={1.5}
      />
    </instancedMesh>
  );
};

export default Ornaments;