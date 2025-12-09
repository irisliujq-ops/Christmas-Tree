import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TREE_CONFIG } from '../types';
import { getRandomSpherePoint, getTreeConePoint, FOLIAGE_VERTEX_SHADER, FOLIAGE_FRAGMENT_SHADER } from '../utils';

interface FoliageProps {
  progress: number;
}

const Foliage: React.FC<FoliageProps> = ({ progress }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Generate geometry data once
  const { chaosPositions, targetPositions, randoms } = useMemo(() => {
    const count = TREE_CONFIG.FOLIAGE_COUNT;
    const chaos = new Float32Array(count * 3);
    const target = new Float32Array(count * 3);
    const rnd = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Tree Shape (Target)
      const targetP = getTreeConePoint(TREE_CONFIG.TREE_HEIGHT, TREE_CONFIG.TREE_RADIUS);
      target[i * 3] = targetP.x;
      target[i * 3 + 1] = targetP.y;
      target[i * 3 + 2] = targetP.z;

      // Chaos Shape
      const chaosP = getRandomSpherePoint(TREE_CONFIG.SPHERE_RADIUS * 1.5); // Wider scatter
      chaos[i * 3] = chaosP.x;
      chaos[i * 3 + 1] = chaosP.y;
      chaos[i * 3 + 2] = chaosP.z;

      rnd[i] = Math.random();
    }

    return { chaosPositions: chaos, targetPositions: target, randoms: rnd };
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      // Smooth lerp for the uniform
      materialRef.current.uniforms.uProgress.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uProgress.value,
        progress,
        0.05
      );
    }
  });

  return (
    <mesh>
      <instancedBufferGeometry instanceCount={TREE_CONFIG.FOLIAGE_COUNT}>
        {/* Actual needle geometry: Thin cone/cylinder */}
        <cylinderGeometry args={[0.01, 0.05, 0.6, 4]} />
        
        <instancedBufferAttribute
          attach="attributes-aTargetPos"
          args={[targetPositions, 3]}
        />
        <instancedBufferAttribute
          attach="attributes-aChaosPos"
          args={[chaosPositions, 3]}
        />
        <instancedBufferAttribute
          attach="attributes-aRandom"
          args={[randoms, 1]}
        />
      </instancedBufferGeometry>
      
      <shaderMaterial
        ref={materialRef}
        vertexShader={FOLIAGE_VERTEX_SHADER}
        fragmentShader={FOLIAGE_FRAGMENT_SHADER}
        uniforms={{
          uTime: { value: 0 },
          uProgress: { value: 0 },
        }}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

export default Foliage;