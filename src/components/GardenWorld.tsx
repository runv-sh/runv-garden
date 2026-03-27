import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlantInstance, USERS } from '../types';
import { PRESETS, BONUS_PLANTS } from '../data/plantData';
import { PlantRenderer } from './PlantRenderer';

export const GardenWorld: React.FC = () => {
  const worldRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredPlant, setHoveredPlant] = useState<string | null>(null);

  // Generate a clustered world of plants
  const plants = useMemo(() => {
    const worldSize = 3000;
    const count = 120;
    const instances: PlantInstance[] = [];
    const clusterRadius = 180; // Max distance from cluster center/previous plant

    let lastX = worldSize / 2;
    let lastY = worldSize / 2;

    for (let i = 0; i < count; i++) {
      const isBonus = Math.random() > 0.85;
      const bonusKeys = Object.keys(BONUS_PLANTS);
      const bonusType = bonusKeys[Math.floor(Math.random() * bonusKeys.length)] as any;
      
      const composition = isBonus 
        ? BONUS_PLANTS[bonusType] 
        : PRESETS[Math.floor(Math.random() * PRESETS.length)];

      // Clustered positioning logic
      // 10% chance to start a new cluster far away, otherwise stay near last plant
      if (i > 0 && Math.random() > 0.1) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 40 + Math.random() * clusterRadius;
        lastX = Math.max(100, Math.min(worldSize - 100, lastX + Math.cos(angle) * distance));
        lastY = Math.max(100, Math.min(worldSize - 100, lastY + Math.sin(angle) * distance));
      } else {
        lastX = 200 + Math.random() * (worldSize - 400);
        lastY = 200 + Math.random() * (worldSize - 400);
      }

      instances.push({
        id: `plant-${i}`,
        composition,
        creator: USERS[Math.floor(Math.random() * USERS.length)],
        x: lastX,
        y: lastY,
        bonusType: isBonus ? bonusType : undefined
      });
    }
    return instances.sort((a, b) => a.y - b.y);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Center on start
  useEffect(() => {
    if (worldRef.current) {
      setOffset({
        x: (window.innerWidth - 3000) / 2,
        y: (window.innerHeight - 3000) / 2
      });
    }
  }, []);

  return (
    <div 
      className={`w-full h-full overflow-hidden bg-[#88aa55] relative ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <motion.div 
        ref={worldRef}
        className="absolute"
        style={{ 
          width: 3000, 
          height: 3000,
          left: offset.x,
          top: offset.y,
        }}
      >
        {/* Grid Background */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{ 
            backgroundImage: `linear-gradient(#779944 1px, transparent 1px), linear-gradient(90deg, #779944 1px, transparent 1px)`,
            backgroundSize: '64px 64px'
          }}
        />

        {/* Decorative patches */}
        {[...Array(20)].map((_, i) => (
          <div 
            key={i}
            className="absolute bg-[#779944] rounded-full opacity-30"
            style={{
              width: 100 + Math.random() * 200,
              height: 60 + Math.random() * 100,
              left: Math.random() * 3000,
              top: Math.random() * 3000,
              filter: 'blur(20px)'
            }}
          />
        ))}

        {/* Plants */}
        {plants.map((plant) => (
          <div
            key={plant.id}
            className="absolute"
            style={{ 
              left: plant.x, 
              top: plant.y,
              zIndex: Math.floor(plant.y)
            }}
            onMouseEnter={() => setHoveredPlant(plant.id)}
            onMouseLeave={() => setHoveredPlant(null)}
          >
            <motion.div
              animate={{ 
                rotate: [0, 1, 0, -1, 0],
                scale: hoveredPlant === plant.id ? 1.1 : 1
              }}
              transition={{ 
                rotate: { duration: 5 + Math.random() * 5, repeat: Infinity, ease: "easeInOut" },
                scale: { duration: 0.2 }
              }}
              className="relative"
            >
              <PlantRenderer 
                composition={plant.composition} 
                className={plant.composition.category === 'tree' ? 'w-24 h-32' : 'w-12 h-16'}
              />
              
              {/* Bonus Indicator */}
              {plant.bonusType && (
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white animate-pulse" />
              )}
            </motion.div>

            {/* Tooltip */}
            <AnimatePresence>
              {hoveredPlant === plant.id && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 z-[9999] pointer-events-none"
                >
                  <div className="bg-[#2d3a2d] text-white px-4 py-2 rounded-lg text-xs font-medium shadow-2xl border-2 border-[#4a5d4a] whitespace-nowrap tooltip-pop">
                    Criado por {plant.creator}
                    {plant.bonusType && (
                      <div className="text-[8px] opacity-60 uppercase mt-1">Recompensa {plant.bonusType}</div>
                    )}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-6 border-l-transparent border-r-6 border-r-transparent border-t-6 border-t-[#2d3a2d]"></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </motion.div>

      {/* Navigation Hint */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/20 text-[10px] uppercase tracking-widest text-white font-bold pointer-events-none">
        Arraste para explorar o jardim
      </div>
    </div>
  );
};
