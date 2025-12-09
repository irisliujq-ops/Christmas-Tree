import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COUNT = 1500;
const BOUNDS_X = 50;
const BOUNDS_Y = 40;
const BOUNDS_Z = 30;

const Snow: React.FC = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < COUNT; i++) {
      const x = (Math.random() - 0.5) * BOUNDS_X;
      const y = (Math.random() - 0.5) * BOUNDS_Y;
      // Position snow mostly around and behind, but some in front
      const z = (Math.random() - 0.5) * BOUNDS_Z; 
      
      temp.push({
        pos: new THREE.Vector3(x, y, z),
        velY: Math.random() * 0.04 + 0.01,
        scale: Math.random() * 0.05 + 0.02,
        phase: Math.random() * Math.PI * 2,
        swaySpeed: Math.random() * 0.5 + 0.5
      });
    }
    return temp;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    const t = state.clock.elapsedTime;

    particles.forEach((p, i) => {
      // Fall down
      p.pos.y -= p.velY;
      
      // Reset if below bottom
      if (p.pos.y < -20) {
        p.pos.y = 20;
        p.pos.x = (Math.random() - 0.5) * BOUNDS_X;
        p.pos.z = (Math.random() - 0.5) * BOUNDS_Z;
      }
      
      // Gentle Sway
      const sway = Math.sin(t * p.swaySpeed + p.phase) * 0.02;
      
      dummy.position.set(p.pos.x + sway, p.pos.y, p.pos.z);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
    </instancedMesh>
  );
};

export default Snow;