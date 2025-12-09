import * as THREE from 'three';
import { TREE_CONFIG, PositionData, LUXURY_COLORS } from './types';

// Helper to generate a random point inside a sphere (Chaos state)
export const getRandomSpherePoint = (radius: number): THREE.Vector3 => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi);
  
  return new THREE.Vector3(x, y, z);
};

// Helper to generate a point inside a cone (Tree state)
export const getTreeConePoint = (height: number, radiusBase: number, yOffset: number = -height/2): THREE.Vector3 => {
  const y = Math.random() * height; // Height from base
  // Radius at this height (linear interpolation)
  // At y=0 (base), r = radiusBase. At y=height (tip), r = 0.
  const rAtHeight = radiusBase * (1 - y / height);
  
  const angle = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * rAtHeight; // Uniform distribution in circle
  
  const x = r * Math.cos(angle);
  const z = r * Math.sin(angle);
  
  return new THREE.Vector3(x, y + yOffset, z);
};

// Generate data for Ornaments
export const generateOrnamentsData = (count: number): PositionData[] => {
  const data: PositionData[] = [];
  // Added LUXURY_COLORS.EMERALD to the palette for Green Small Balls
  const palette = [LUXURY_COLORS.GOLD, LUXURY_COLORS.RED_RIBBON, LUXURY_COLORS.SILVER, LUXURY_COLORS.GOLD_LIGHT, LUXURY_COLORS.EMERALD];

  for (let i = 0; i < count; i++) {
    // Chaos Position
    const chaos = getRandomSpherePoint(TREE_CONFIG.SPHERE_RADIUS);
    
    // Target Position (Surface of cone mostly, with some depth)
    const y = Math.random() * TREE_CONFIG.TREE_HEIGHT;
    const rAtHeight = TREE_CONFIG.TREE_RADIUS * (1 - y / TREE_CONFIG.TREE_HEIGHT);
    const angle = Math.random() * Math.PI * 2;
    // Push them slightly towards the surface for visibility
    const r = rAtHeight * (0.8 + Math.random() * 0.2); 
    
    const x = r * Math.cos(angle);
    const z = r * Math.sin(angle);
    const target = new THREE.Vector3(x, y - TREE_CONFIG.TREE_HEIGHT / 2, z);

    // Type determination
    const randType = Math.random();
    let type: 'box' | 'ball' | 'light' = 'ball';
    let scale = 1;
    let colorHex = palette[Math.floor(Math.random() * palette.length)];

    if (randType > 0.9) {
        type = 'box'; // Heavy
        scale = 0.4 + Math.random() * 0.3;
        colorHex = LUXURY_COLORS.RED_RIBBON;
    } else if (randType > 0.4) {
        type = 'ball'; // Medium
        scale = 0.3 + Math.random() * 0.3;
    } else {
        type = 'light'; // Light/Small
        scale = 0.15 + Math.random() * 0.1;
        colorHex = LUXURY_COLORS.GOLD_LIGHT;
    }

    data.push({
      chaos,
      target,
      color: new THREE.Color(colorHex),
      scale,
      type
    });
  }
  return data;
};

// --- MESH-BASED SHADERS FOR NEEDLES ---

export const FOLIAGE_VERTEX_SHADER = `
  uniform float uTime;
  uniform float uProgress;
  
  attribute vec3 aChaosPos;
  attribute vec3 aTargetPos;
  attribute float aRandom;
  
  varying vec3 vColor;
  varying vec3 vNormal;

  // Cubic Ease Out function
  float easeOutCubic(float x) {
    return 1.0 - pow(1.0 - x, 3.0);
  }

  // Rotation Matrix from Axis and Angle
  mat4 rotationMatrix(vec3 axis, float angle) {
      axis = normalize(axis);
      float s = sin(angle);
      float c = cos(angle);
      float oc = 1.0 - c;
      
      return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                  oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                  oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                  0.0,                                0.0,                                0.0,                                1.0);
  }

  void main() {
    float easedProgress = easeOutCubic(uProgress);
    
    // 1. Interpolate Position
    vec3 instancePos = mix(aChaosPos, aTargetPos, easedProgress);
    
    // Add wind movement
    float wind = sin(uTime * 2.0 + instancePos.x * 0.5 + instancePos.y * 0.3) * 0.1;
    if(uProgress > 0.8) {
       instancePos.x += wind * (instancePos.y / 10.0);
    }

    // 2. Compute Orientation/Rotation
    // Default needle points UP (0,1,0). We want to rotate it to face a direction.
    
    // Target Direction: Outwards from the tree center (Y-axis)
    // We assume the tree center is at x=0, z=0.
    vec3 targetDir = normalize(vec3(aTargetPos.x, aTargetPos.y * 0.5, aTargetPos.z)); // Slightly upward and outward
    
    // Chaos Direction: Random based on position
    vec3 chaosDir = normalize(aChaosPos);
    
    // Mix directions
    vec3 finalDir = normalize(mix(chaosDir, targetDir, easedProgress));
    
    // Add some random fluff variation to the direction
    finalDir.x += (aRandom - 0.5) * 0.5;
    finalDir.y += (aRandom - 0.5) * 0.5;
    finalDir.z += (aRandom - 0.5) * 0.5;
    finalDir = normalize(finalDir);

    // Create rotation from UP vector to Final Direction
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 axis = cross(up, finalDir);
    float angle = acos(dot(up, finalDir));
    mat4 rotMat = rotationMatrix(axis, angle);

    // 3. Transform Local Vertex
    vec3 transformedPos = (rotMat * vec4(position, 1.0)).xyz;
    
    // Final World Position
    vec4 worldPosition = modelMatrix * vec4(instancePos + transformedPos, 1.0);
    vec4 mvPosition = viewMatrix * worldPosition;
    gl_Position = projectionMatrix * mvPosition;

    // Normals for lighting
    vNormal = (modelMatrix * rotMat * vec4(normal, 0.0)).xyz;
    
    // Color: Deep Emeralds
    vec3 deepEmerald = vec3(0.0, 0.22, 0.12); 
    vec3 lightGreen = vec3(0.05, 0.35, 0.18);
    vColor = mix(deepEmerald, lightGreen, aRandom);
  }
`;

export const FOLIAGE_FRAGMENT_SHADER = `
  varying vec3 vColor;
  varying vec3 vNormal;
  
  void main() {
    // Simple directional lighting simulation
    vec3 lightDir = normalize(vec3(0.5, 1.0, 0.5));
    float diff = max(dot(normalize(vNormal), lightDir), 0.2); // Ambient baseline
    
    vec3 lighting = vColor * (diff + 0.3); // +0.3 for ambient
    
    gl_FragColor = vec4(lighting, 1.0);
  }
`;