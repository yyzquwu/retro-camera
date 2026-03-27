import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Camera.css';

interface CameraProps {
  onCapture: (imageSrc: string) => void;
}

const Camera: React.FC<CameraProps> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const enableCamera = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 640 },
          audio: false
        });
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch (err) {
        console.error("Camera error:", err);
      }
    };

    enableCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setFlash(true);
    setTimeout(() => setFlash(false), 150);

    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    const size = Math.min(videoRef.current.videoWidth, videoRef.current.videoHeight);
    canvasRef.current.width = 800;
    canvasRef.current.height = 800;

    // Flip horizontally for selfie feel
    context.translate(800, 0);
    context.scale(-1, 1);
    
    context.drawImage(
      videoRef.current,
      (videoRef.current.videoWidth - size) / 2,
      (videoRef.current.videoHeight - size) / 2,
      size,
      size,
      0,
      0,
      800,
      800
    );

    const imageData = canvasRef.current.toDataURL('image/jpeg', 0.9);
    onCapture(imageData);

    // Sound effect
    const audio = new Audio('https://www.bubbbly.com/assets/retro-camera/polaroid-camera.mp3');
    audio.volume = 0.4;
    audio.play().catch(() => {});
  };

  return (
    <div className="camera-outer">
      <div className="camera-body">
        {/* Top Section */}
        <div className="camera-top">
          <div className="camera-viewfinder"></div>
          <div className="camera-flash-unit"></div>
        </div>

        {/* Main Section */}
        <div className="camera-main">
          <div className="camera-lens-outer">
            <div className="camera-lens-inner">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="camera-video-feed"
              />
              <div className="camera-lens-reflection"></div>
            </div>
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={takePhoto}
            className="camera-shutter-button"
          >
            <div className="shutter-inner"></div>
          </motion.button>
        </div>

        {/* Brand/Decor */}
        <div className="camera-stripe">
          <div className="stripe-r"></div>
          <div className="stripe-o"></div>
          <div className="stripe-y"></div>
          <div className="stripe-g"></div>
          <div className="stripe-b"></div>
        </div>
        
        <div className="camera-brand">RETRO <span>600</span></div>
      </div>

      <AnimatePresence>
        {flash && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="camera-flash-overlay"
          />
        )}
      </AnimatePresence>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default Camera;
