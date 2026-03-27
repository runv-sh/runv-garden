import React from 'react';
import type {PlantComposition} from '../types';

interface Props {
  composition: PlantComposition;
  highlighted?: boolean;
}

export const PlantSprite: React.FC<Props> = ({composition, highlighted = false}) => {
  return (
    <div
      className="relative pointer-events-none"
      style={{
        width: 220,
        height: 260,
        transform: `scale(${composition.scale})`,
        transformOrigin: 'bottom center',
      }}
    >
      <div
        className="absolute left-1/2 bottom-0 -translate-x-1/2 rounded-full"
        style={{
          width: composition.shadow.width,
          height: composition.shadow.height,
          opacity: composition.shadow.opacity,
          filter: `blur(${composition.shadow.blur}px)`,
          background:
            'radial-gradient(circle, rgba(9, 28, 10, 0.55) 0%, rgba(9, 28, 10, 0.18) 48%, rgba(9, 28, 10, 0) 78%)',
        }}
      />

      {composition.glow ? (
        <div
          className="absolute left-1/2 bottom-4 -translate-x-1/2 rounded-full"
          style={{
            width: 120,
            height: 120,
            background: composition.glow,
            opacity: highlighted ? 1 : 0.72,
            filter: 'blur(12px)',
          }}
        />
      ) : null}

      {composition.layers.map((layer, index) => (
        <img
          key={`${layer.src}-${index}`}
          src={layer.src}
          alt=""
          draggable={false}
          className="absolute bottom-0 left-1/2 block max-w-none select-none"
          style={{
            opacity: layer.opacity ?? 1,
            zIndex: layer.zIndex ?? index + 1,
            imageRendering: 'pixelated',
            transform: `translate(${layer.offsetX ?? 0}px, ${layer.offsetY ?? 0}px) translateX(-50%) scale(${layer.flipX ? -1 : 1}, 1) scale(${layer.scale ?? 1})`,
            transformOrigin: 'bottom center',
            filter: `${layer.filter ?? ''}${highlighted ? ' brightness(1.08)' : ''}`.trim(),
          }}
        />
      ))}
    </div>
  );
};
