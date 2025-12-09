import * as THREE from 'three';

export enum AppState {
  CHAOS = 'CHAOS',
  FORMED = 'FORMED',
}

export const LUXURY_COLORS = {
  EMERALD: '#004225', // Deep rich green
  GOLD: '#D4AF37',    // Metallic gold
  GOLD_LIGHT: '#FEDC56', // Bright gold for highlights
  SILVER: '#C0C0C0',  // Silver for contrast
  RED_RIBBON: '#800020', // Burgundy
  GLOW: '#ffaa00',
};

export interface PositionData {
  chaos: THREE.Vector3;
  target: THREE.Vector3;
  color: THREE.Color;
  scale: number;
  type: 'box' | 'ball' | 'light';
}

// Configuration for tree generation
export const TREE_CONFIG = {
  FOLIAGE_COUNT: 15000,
  ORNAMENT_COUNT: 400,
  TREE_HEIGHT: 14,
  TREE_RADIUS: 5,
  SPHERE_RADIUS: 15, // Chaos radius
};