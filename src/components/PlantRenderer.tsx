import React from 'react';
import { PlantComposition, Category } from '../types';
import { PARTS } from '../data/plantData';

interface Props {
  composition: PlantComposition;
  className?: string;
}

export const PlantRenderer: React.FC<Props> = ({ composition, className = "" }) => {
  const { category, baseId, bodyId, detailId, colors, scale } = composition;

  const renderPart = (cat: Category, type: 'bases' | 'bodies' | 'details', id: string, color: string) => {
    const partList = (PARTS as any)[cat]?.[type];
    const part = partList?.find((p: any) => p.id === id);
    return part ? part.svg(color) : null;
  };

  return (
    <div 
      className={`relative flex items-end justify-center ${className}`}
      style={{ transform: `scale(${scale})`, transformOrigin: 'bottom center' }}
    >
      <svg 
        viewBox="0 0 16 20" 
        className="w-full h-full overflow-visible"
        style={{ filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.1))' }}
      >
        {/* Base / Trunk */}
        {renderPart(category, 'bases', baseId, colors.primary)}
        
        {/* Body / Canopy */}
        {renderPart(category, 'bodies', bodyId, colors.secondary)}
        
        {/* Detail */}
        {detailId && renderPart(category, 'details', detailId, colors.accent || colors.secondary)}
      </svg>
    </div>
  );
};
