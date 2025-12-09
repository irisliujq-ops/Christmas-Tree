import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './components/Scene';
import HandController from './components/HandController';
import { AppState, LUXURY_COLORS } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.FORMED);
  const [progress, setProgress] = useState(1); // 0 = Chaos, 1 = Formed
  const [handRotation, setHandRotation] = useState({ x: 0, y: 0 });

  // Transition Logic
  useEffect(() => {
    let animationFrameId: number;
    
    const animate = () => {
      setProgress((prev) => {
        const target = appState === AppState.FORMED ? 1 : 0;
        const diff = target - prev;
        
        if (Math.abs(diff) < 0.005) return target;
        return prev + diff * 0.03; // Smooth transition speed
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, [appState]);

  const toggleState = () => {
    setAppState(prev => prev === AppState.FORMED ? AppState.CHAOS : AppState.FORMED);
  };

  return (
    <div className="relative w-full h-full bg-[#050a05] text-white overflow-hidden">
      {/* 3D Canvas */}
      <div className="absolute inset-0 z-0">
        <Canvas shadows dpr={[1, 2]}>
           <Scene progress={progress} handRotation={handRotation} />
        </Canvas>
      </div>

      {/* Hand Gesture Controller */}
      <HandController setAppState={setAppState} setHandRotation={setHandRotation} />

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-8 md:p-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="luxury-text text-3xl md:text-5xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-[#ffd700] to-[#b8860b] drop-shadow-lg">
            MERRY CHRISTMAS
          </h1>
        </div>

        {/* Footer / Controls (Manual Override) */}
        <div className="flex flex-col items-center gap-6 pointer-events-auto">
          <div className="body-text text-xs text-[#d4af37] tracking-widest uppercase opacity-70 mb-2">
             Open Hand to Unleash &bull; Close Fist to Restore
          </div>
          
          <button
            onClick={toggleState}
            className="group relative px-8 py-3 bg-[#004225] border border-[#d4af37] overflow-hidden transition-all duration-300 hover:bg-[#005c35] active:scale-95 shadow-[0_0_15px_rgba(212,175,55,0.3)]"
          >
            {/* Inner border line */}
            <span className="absolute inset-[3px] border border-[#d4af37] opacity-30 group-hover:opacity-100 transition-opacity"></span>
            
            <span className="relative z-10 luxury-text font-bold text-[#d4af37] tracking-widest">
              {appState === AppState.FORMED ? 'UNLEASH CHAOS' : 'RESTORE ORDER'}
            </span>
          </button>
        </div>
      </div>
      
      {/* Decorative Corners (Golden Frame feel) */}
      <div className="absolute top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-[#d4af37] opacity-50 pointer-events-none" />
      <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-[#d4af37] opacity-50 pointer-events-none" />
      <div className="absolute bottom-4 left-4 w-16 h-16 border-b-2 border-l-2 border-[#d4af37] opacity-50 pointer-events-none" />
      <div className="absolute bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-[#d4af37] opacity-50 pointer-events-none" />

      {/* Signature */}
      <div className="absolute bottom-6 right-8 pointer-events-none opacity-60">
        <p className="body-text text-xs text-[#d4af37] tracking-widest">made by IL</p>
      </div>
    </div>
  );
};

export default App;