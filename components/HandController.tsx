import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';
import { AppState, LUXURY_COLORS } from '../types';

interface HandControllerProps {
  setAppState: (state: AppState) => void;
  setHandRotation: (rot: { x: number; y: number }) => void;
}

const HandController: React.FC<HandControllerProps> = ({ setAppState, setHandRotation }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const requestRef = useRef<number>(0);
  const [gestureName, setGestureName] = useState<string>("Initializing...");
  
  // Track mount state to avoid race conditions
  const isMounted = useRef(true);

  // Initialize MediaPipe Gesture Recognizer
  useEffect(() => {
    isMounted.current = true;

    const init = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );
        
        if (!isMounted.current) return;

        let recognizer: GestureRecognizer;

        try {
            // 1. Try to initialize with GPU for best performance
            recognizer = await GestureRecognizer.createFromOptions(vision, {
              baseOptions: {
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
                delegate: "GPU"
              },
              runningMode: "VIDEO",
              numHands: 1
            });
            console.log("MediaPipe: Initialized with GPU delegate.");
        } catch (gpuError) {
            console.warn("MediaPipe: GPU delegate failed. Falling back to CPU.", gpuError);
            
            // 2. Fallback to CPU if GPU fails
            if (!isMounted.current) return;
            
            recognizer = await GestureRecognizer.createFromOptions(vision, {
              baseOptions: {
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
                delegate: "CPU"
              },
              runningMode: "VIDEO",
              numHands: 1
            });
            console.log("MediaPipe: Initialized with CPU delegate.");
        }
        
        if (isMounted.current) {
             recognizerRef.current = recognizer;
             startWebcam();
        } else {
            recognizer.close();
        }
      } catch (error) {
        console.error("Error initializing MediaPipe:", error);
        if (isMounted.current) setGestureName("Init Error");
      }
    };
    init();

    return () => {
        isMounted.current = false;
        if (recognizerRef.current) {
            recognizerRef.current.close();
            recognizerRef.current = null;
        }
        cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const startWebcam = async () => {
    if (!isMounted.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current && isMounted.current) {
        videoRef.current.srcObject = stream;
        
        // Ensure video plays (some browsers block autoplay)
        videoRef.current.onloadeddata = () => {
            if (isMounted.current) {
                setLoaded(true);
                predict();
            }
        };
        videoRef.current.play().catch(e => console.error("Video play failed:", e));
      }
    } catch (err) {
      console.error("Webcam not found or permission denied", err);
      if (isMounted.current) setGestureName("No Camera");
    }
  };

  const predict = () => {
    // Only predict if the component is still mounted
    if (!isMounted.current) return;
    
    // Check if recognizer and video are ready
    if (!recognizerRef.current || !videoRef.current || videoRef.current.readyState < 2) {
       requestRef.current = requestAnimationFrame(predict);
       return;
    }

    try {
        const results = recognizerRef.current.recognizeForVideo(videoRef.current, Date.now());

        if (results.gestures.length > 0) {
            const gesture = results.gestures[0][0];
            const name = gesture.categoryName;
            const confidence = gesture.score;

            if (confidence > 0.5) {
                setGestureName(name);

                // Gesture Logic
                if (name === "Open_Palm") {
                    setAppState(AppState.CHAOS);
                } else if (name === "Closed_Fist") {
                    setAppState(AppState.FORMED);
                }
            }
        } else {
            setGestureName("No Hand");
        }

        // Movement Logic (Camera Rotation)
        if (results.landmarks.length > 0) {
            const landmarks = results.landmarks[0];
            // Use Middle Finger MCP (index 9) for stable tracking
            const point = landmarks[9]; 
            
            // MediaPipe coords: x (0 left - 1 right), y (0 top - 1 bottom)
            // We want -1 to 1 mapping. 
            // Invert X because webcam is usually mirrored for the user.
            const x = (1 - point.x) * 2 - 1; 
            const y = -(point.y * 2 - 1); 

            setHandRotation({ x, y });
        }
    } catch(e) {
        // Swallow transient errors during stream interruptions
        console.debug("Prediction frame skipped", e);
    }

    requestRef.current = requestAnimationFrame(predict);
  };

  return (
    <div className="absolute bottom-6 left-6 z-50 flex flex-col items-center pointer-events-auto">
        <div className="relative p-[2px] bg-gradient-to-tr from-[#D4AF37] to-[#FEDC56] shadow-[0_0_20px_rgba(212,175,55,0.4)]">
            <video 
                ref={videoRef} 
                playsInline 
                muted
                className="w-32 h-24 object-cover transform scale-x-[-1] bg-black" 
            />
            {!loaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-[#D4AF37] text-xs text-center p-2">
                    LOADING MAGIC...<br/>(Allow Camera)
                </div>
            )}
        </div>
        <div className="mt-2 px-3 py-1 bg-black/50 border border-[#D4AF37]/30 backdrop-blur-sm">
            <p className="luxury-text text-[10px] text-[#D4AF37] tracking-widest uppercase">
                {gestureName.replace('_', ' ')}
            </p>
        </div>
    </div>
  );
};

export default HandController;