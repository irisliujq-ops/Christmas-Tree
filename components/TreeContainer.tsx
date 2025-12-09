import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Foliage from './Foliage';
import Ornaments from './Ornaments';
import { TREE_CONFIG, LUXURY_COLORS } from '../types';

interface TreeContainerProps {
  progress: number;
}

const TreeContainer: React.FC<TreeContainerProps> = ({ progress }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Physics state
  const angularVelocity = useRef(0);
  const lastPointerX = useRef(0);
  const isDragging = useRef(false);

  // Generate Star Geometry
  const starGeometry = useMemo(() => {
    const starShape = new THREE.Shape();
    const points = 5;
    const outerRadius = 0.9;
    const innerRadius = 0.45;
    
    // Start at top point
    for(let i = 0; i < points * 2; i++){
        // Rotate so top point is straight up (-PI/2)
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if(i===0) starShape.moveTo(x, y);
        else starShape.lineTo(x, y);
    }
    starShape.closePath();

    const extrudeSettings = { 
        depth: 0.2, 
        bevelEnabled: true, 
        bevelThickness: 0.1, 
        bevelSize: 0.05, 
        bevelSegments: 2 
    };
    return new THREE.ExtrudeGeometry(starShape, extrudeSettings);
  }, []);

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    isDragging.current = true;
    lastPointerX.current = e.clientX;
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const handlePointerMove = (e: any) => {
    if (isDragging.current) {
      const deltaX = e.clientX - lastPointerX.current;
      angularVelocity.current += deltaX * 0.0005; 
      lastPointerX.current = e.clientX;
    }
  };

  useFrame(() => {
    if (groupRef.current) {
      // Apply rotation
      groupRef.current.rotation.y += angularVelocity.current;
      
      // Auto-rotation (slow idle spin) if not moving fast
      if (!isDragging.current && Math.abs(angularVelocity.current) < 0.001) {
          groupRef.current.rotation.y += 0.001; 
      }

      // Apply Friction (decay)
      angularVelocity.current *= 0.95;
    }
  });

  return (
    <group 
      ref={groupRef} 
      position={[0, -2, 0]} // Center tree vertically
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerMove={handlePointerMove}
    >
        {/* Invisible hit box for easier swiping */}
        <mesh visible={false} scale={[15, 20, 15]}>
            <cylinderGeometry args={[1, 1, 1]} />
            <meshBasicMaterial transparent opacity={0} />
        </mesh>

        <Foliage progress={progress} />
        <Ornaments progress={progress} />
        
        {/* Base / Pot - Simple Luxury Cylinder */}
        <mesh position={[0, -TREE_CONFIG.TREE_HEIGHT/2 - 1, 0]} receiveShadow>
             <cylinderGeometry args={[1.5, 2, 2.5, 32]} />
             <meshStandardMaterial 
                color={LUXURY_COLORS.RED_RIBBON} 
                roughness={0.2} 
                metalness={0.6}
             />
        </mesh>

        {/* Tree Topper: Glowing Star with Halo */}
        <group position={[0, TREE_CONFIG.TREE_HEIGHT / 2 + 0.2, 0]}>
          {/* The Star */}
          <mesh geometry={starGeometry} position={[0, 0, 0]}>
            <meshStandardMaterial 
              color={LUXURY_COLORS.GOLD_LIGHT} 
              emissive={LUXURY_COLORS.GOLD_LIGHT}
              emissiveIntensity={2}
              toneMapped={false}
              roughness={0.2}
              metalness={1}
            />
          </mesh>
          
          {/* The Halo Ring */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
             <torusGeometry args={[1.3, 0.03, 16, 64]} />
             <meshStandardMaterial 
               color={LUXURY_COLORS.GOLD_LIGHT}
               emissive={LUXURY_COLORS.GOLD_LIGHT}
               emissiveIntensity={4}
               toneMapped={false}
             />
          </mesh>

          {/* Light source for the topper */}
          <pointLight distance={15} intensity={5} color={LUXURY_COLORS.GOLD_LIGHT} />
        </group>
    </group>
  );
};

export default TreeContainer;