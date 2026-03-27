import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './Polaroid.css';

interface PolaroidProps {
  src: string;
  date: string;
  caption?: string;
  isDeveloping?: boolean;
  initialRotation?: number;
  onDragEnd?: (x: number, y: number) => void;
  style?: React.CSSProperties;
}

const Polaroid: React.FC<PolaroidProps> = ({ 
  src, 
  date, 
  caption = 'May I meet you', 
  isDeveloping = false,
  initialRotation = 0,
  onDragEnd,
  style
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(caption);

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ 
        scale: 0.9, 
        opacity: 0, 
        y: 40,
        rotate: initialRotation 
      }}
      animate={{ 
        scale: 1, 
        opacity: 1, 
        y: 0,
        rotate: initialRotation 
      }}
      whileHover={{ 
        scale: 1.04, 
        zIndex: 100,
        rotate: initialRotation * 0.8,
        transition: { type: 'spring', stiffness: 300, damping: 20 }
      }}
      whileDrag={{ 
        scale: 1.08, 
        zIndex: 200, 
        rotate: initialRotation * 0.5,
        transition: { duration: 0.1 }
      }}
      onDragEnd={(_, info) => onDragEnd?.(info.point.x, info.point.y)}
      className="polaroid-container"
      style={style}
    >
      <div className="polaroid-inner">
        <div className="polaroid-shell">
          <motion.div 
            className="polaroid-image-wrapper"
            animate={isDeveloping ? {
              filter: [
                'blur(15px) grayscale(0.8) brightness(0.6)',
                'blur(0px) grayscale(0) brightness(1) sepia(0.2) contrast(1.1) saturate(1.2)'
              ]
            } : {
              filter: 'sepia(0.15) contrast(1.1) saturate(1.1)'
            }}
            transition={{ duration: isDeveloping ? 5 : 0.6, ease: "easeInOut" }}
          >
            <img src={src} alt="Captured memory" draggable={false} />
            <div className="film-grain"></div>
          </motion.div>
          
          <div className="polaroid-footer">
            <div 
              className="polaroid-caption"
              onClick={() => setIsEditing(true)}
              onBlur={(e) => {
                setIsEditing(false);
                setText(e.currentTarget.textContent || '');
              }}
              contentEditable={isEditing}
              suppressContentEditableWarning
            >
              {text}
            </div>
            <div className="polaroid-date">{date}</div>
          </div>
        </div>
      </div>
      
      {/* Decorative Tape with dynamic styling */}
      <div className="polaroid-tape"></div>
    </motion.div>
  );
};

export default Polaroid;
