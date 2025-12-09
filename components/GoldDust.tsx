import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { LUXURY_COLORS } from '../types';

const COUNT = 300;
const BOUNDS = 25;

const GoldDust: React.FC = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { viewport, camera } = useThree();
  
  // Particle state management
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < COUNT; i++) {
      const x = (Math.random() - 0.5) * BOUNDS;
      const y = (Math.random() - 0.5) * BOUNDS;
      const z = (Math.random() - 0.5) * BOUNDS;
      temp.push({
        pos: new THREE.Vector3(x, y, z),
        vel: new THREE.Vector3(0, 0, 0),
        scale: Math.random() * 0.1 + 0.05,
        phase: Math.random() * Math.PI * 2
      });
    }
    return temp;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pointerPos = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    if (!meshRef.current) return;

    // Convert normalized pointer coordinates (-1 to 1) to world coordinates at a certain depth
    // Or simpler: unproject the camera.
    // Let's create a plane at z=0 for interaction or better, follow the camera direction
    
    // Simple 3D projection of mouse:
    pointerPos.set(state.pointer.x, state.pointer.y, 0.5);
    pointerPos.unproject(camera);
    const dir = pointerPos.sub(camera.position).normalize();
    const distance = -camera.position.z / dir.z; // Intersection with XY plane if needed, but let's just project roughly into the volume
    // Let's just project the pointer onto a sphere around origin 0,0,0 or a plane at z=0
    
    // Better Logic: Raycast to a virtual plane at z=0
    const vector = new THREE.Vector3(state.pointer.x, state.pointer.y, 0.5);
    vector.unproject(camera);
    const dir2 = vector.sub(camera.position).normalize();
    const distance2 = -camera.position.z / dir2.z;
    const target = camera.position.clone().add(dir2.multiplyScalar(distance2));

    particles.forEach((p, i) => {
      // 1. Gravity / Float logic
      p.vel.y -= 0.002; // Slight gravity
      p.vel.y += Math.sin(state.clock.elapsedTime + p.phase) * 0.003; // Floating turbulence

      // 2. Interaction: Attraction to cursor (Magical Gold Dust)
      const dist = p.pos.distanceTo(target);
      const attractionRadius = 8.0;
      
      if (dist < attractionRadius) {
        const force = target.clone().sub(p.pos).normalize().multiplyScalar(0.08); // Attraction force
        p.vel.add(force);
        // Add some swirl
        const swirl = new THREE.Vector3(-force.y, force.x, 0).multiplyScalar(0.1);
        p.vel.add(swirl);
      }

      // 3. Apply Velocity with friction
      p.vel.multiplyScalar(0.96); // Friction
      p.pos.add(p.vel);

      // 4. Bounds check (Reset if too low)
      if (p.pos.y < -10) {
        p.pos.y = 15;
        p.pos.x = (Math.random() - 0.5) * 20;
        p.pos.z = (Math.random() - 0.5) * 20;
        p.vel.set(0,0,0);
      }

      // Update Instance
      dummy.position.copy(p.pos);
      dummy.scale.setScalar(p.scale);
      dummy.rotation.set(state.clock.elapsedTime, state.clock.elapsedTime, 0);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial 
        color={LUXURY_COLORS.GOLD} 
        emissive={LUXURY_COLORS.GOLD_LIGHT}
        emissiveIntensity={2}
        toneMapped={false}
        roughness={0}
        metalness={1}
      />
    </instancedMesh>
  );
};

export default GoldDust;