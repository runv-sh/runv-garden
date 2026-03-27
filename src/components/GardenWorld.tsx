import React, {useEffect, useMemo, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {loadGardenWorld, WORLD_SIZE} from '../data/gardenWorld';
import type {PlantInstance} from '../types';
import {PlantSprite} from './PlantSprite';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const getTooltipAnchorBottom = (plant: PlantInstance) => {
  const scale = plant.composition.scale;

  if (plant.tributeText) {
    return 150 * scale;
  }

  switch (plant.composition.category) {
    case 'tree':
      return 155 * scale;
    case 'flower':
      return 44 * scale;
    case 'cactus':
      return 82 * scale;
    case 'bush':
      return 92 * scale;
    case 'mushroom':
      return 56 * scale;
    case 'special':
      return 108 * scale;
    default:
      return 86 * scale;
  }
};

export const GardenWorld: React.FC = () => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({x: 0, y: 0});
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPointer, setDragPointer] = useState({x: 0, y: 0});
  const [hoveredPlant, setHoveredPlant] = useState<PlantInstance | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<PlantInstance | null>(null);
  const [plants, setPlants] = useState<PlantInstance[]>([]);
  const [worldSize, setWorldSize] = useState(WORLD_SIZE);
  const heroPlant = plants.find((plant) => plant.id === 'hero-auroramurad') ?? null;
  const scaledWorldSize = worldSize * zoom;

  const decorativePatches = useMemo(
    () =>
      Array.from({length: 26}, (_, index) => ({
        id: `patch-${index}`,
        x: 140 + ((index * 173) % (worldSize - 280)),
        y: 140 + ((index * 241) % (worldSize - 280)),
        width: 120 + ((index * 33) % 160),
        height: 72 + ((index * 27) % 110),
        rotation: (index * 19) % 360,
        opacity: 0.12 + (index % 4) * 0.03,
      })),
    [worldSize],
  );

  const grassPatches = useMemo(
    () => [
      {id: 'grass-a', src: '/assets/plants/ground/grass-tile-a.png', x: heroPlant ? heroPlant.x - 180 : 1780, y: heroPlant ? heroPlant.y + 40 : 2240, scale: 1},
      {id: 'grass-b', src: '/assets/plants/ground/grass-tile-b.png', x: heroPlant ? heroPlant.x + 60 : 2140, y: heroPlant ? heroPlant.y + 70 : 2270, scale: 0.94},
      {id: 'grass-c', src: '/assets/plants/ground/grass-tile-a.png', x: heroPlant ? heroPlant.x - 10 : 2060, y: heroPlant ? heroPlant.y - 170 : 2030, scale: 0.82},
      {id: 'grass-d', src: '/assets/plants/ground/grass-tile-b.png', x: heroPlant ? heroPlant.x - 280 : 1620, y: heroPlant ? heroPlant.y - 80 : 2120, scale: 0.76},
    ],
    [heroPlant],
  );

  const clampOffset = (nextX: number, nextY: number) => {
    const viewportWidth = viewportRef.current?.clientWidth ?? window.innerWidth;
    const viewportHeight = viewportRef.current?.clientHeight ?? window.innerHeight;

    return {
      x: clamp(nextX, viewportWidth - scaledWorldSize - 140, 140),
      y: clamp(nextY, viewportHeight - scaledWorldSize - 140, 140),
    };
  };

  const focusOnPoint = (focusX: number, focusY: number, nextZoom: number) => {
    const viewportWidth = viewportRef.current?.clientWidth ?? window.innerWidth;
    const viewportHeight = viewportRef.current?.clientHeight ?? window.innerHeight;
    const nextScaledWorldSize = worldSize * nextZoom;

    return {
      x: clamp(viewportWidth / 2 - focusX * nextZoom, viewportWidth - nextScaledWorldSize - 140, 140),
      y: clamp(viewportHeight / 2 - focusY * nextZoom + 130, viewportHeight - nextScaledWorldSize - 140, 140),
    };
  };

  useEffect(() => {
    let alive = true;
    loadGardenWorld()
      .then((world) => {
        if (!alive) return;
        setPlants(world.plants);
        setWorldSize(world.worldSize);
      })
      .catch(() => {
        if (!alive) return;
        setPlants([]);
        setWorldSize(WORLD_SIZE);
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const centerWorld = () => {
      const viewportWidth = viewportRef.current?.clientWidth ?? window.innerWidth;
      const viewportHeight = viewportRef.current?.clientHeight ?? window.innerHeight;
      const focusX = heroPlant?.x ?? worldSize / 2;
      const focusY = heroPlant?.y ?? worldSize / 2;

      setOffset(focusOnPoint(focusX, focusY, zoom));
    };

    centerWorld();
    window.addEventListener('resize', centerWorld);
    return () => window.removeEventListener('resize', centerWorld);
  }, [heroPlant, worldSize, zoom]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    setDragPointer({
      x: event.clientX - offset.x,
      y: event.clientY - offset.y,
    });
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setOffset(clampOffset(event.clientX - dragPointer.x, event.clientY - dragPointer.y));
  };

  const endDrag = () => {
    setIsDragging(false);
  };

  const updateZoom = (delta: number) => {
    const nextZoom = clamp(Number((zoom + delta).toFixed(2)), 0.7, 1.8);
    setZoom(nextZoom);
    if (heroPlant) {
      setOffset(focusOnPoint(heroPlant.x, heroPlant.y, nextZoom));
    }
  };

  return (
    <div
      ref={viewportRef}
      className={`relative h-full w-full overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      onClick={() => setSelectedPlant(null)}
      onWheel={(event) => {
        event.preventDefault();
        updateZoom(event.deltaY > 0 ? -0.08 : 0.08);
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={endDrag}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,247,214,0.55),_transparent_34%),linear-gradient(180deg,_#dfe8bd_0%,_#a5bb69_18%,_#6e8f42_55%,_#4d6a35_100%)]" />
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_30%,_rgba(255,255,255,0.36),_transparent_22%),radial-gradient(circle_at_78%_18%,_rgba(246,255,214,0.28),_transparent_18%),radial-gradient(circle_at_68%_78%,_rgba(27,59,24,0.18),_transparent_28%)]" />

      <motion.div
        className="absolute"
        style={{
          width: worldSize,
          height: worldSize,
          left: offset.x,
          top: offset.y,
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(45, 77, 31, 0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(45, 77, 31, 0.7) 1px, transparent 1px)',
            backgroundSize: '84px 84px',
          }}
        />

        {decorativePatches.map((patch) => (
          <div
            key={patch.id}
            className="absolute rounded-[999px]"
            style={{
              left: patch.x,
              top: patch.y,
              width: patch.width,
              height: patch.height,
              opacity: patch.opacity,
              transform: `rotate(${patch.rotation}deg)`,
              filter: 'blur(22px)',
              background:
                'radial-gradient(circle, rgba(46, 86, 41, 0.85) 0%, rgba(96, 134, 67, 0.45) 52%, rgba(96, 134, 67, 0) 82%)',
            }}
          />
        ))}

        {grassPatches.map((patch) => (
          <img
            key={patch.id}
            src={patch.src}
            alt=""
            draggable={false}
            className="absolute pointer-events-none select-none"
            style={{
              left: patch.x,
              top: patch.y,
              opacity: 0.32,
              imageRendering: 'pixelated',
              transform: `translate(-50%, -50%) scale(${patch.scale})`,
              filter: 'saturate(0.92) brightness(1.02)',
            }}
          />
        ))}

        {plants.map((plant) => {
          const isHovered = hoveredPlant?.id === plant.id || selectedPlant?.id === plant.id;
          const tooltipBottom = getTooltipAnchorBottom(plant);
          return (
            <div
              key={plant.id}
              className="absolute"
              style={{
                left: plant.x,
                top: plant.y,
                zIndex: Math.floor(plant.y),
                transform: 'translate(-50%, -100%)',
              }}
              onClick={(event) => {
                event.stopPropagation();
                setSelectedPlant((current) => (current?.id === plant.id ? null : plant));
              }}
              onPointerEnter={() => setHoveredPlant(plant)}
              onPointerLeave={() => setHoveredPlant((current) => (current?.id === plant.id ? null : current))}
            >
              <motion.div
                animate={{
                  rotate: [0, plant.composition.swayAmplitude, 0, -plant.composition.swayAmplitude * 0.8, 0],
                  y: [0, -1.5, 0],
                  scale: isHovered ? 1.08 : 1,
                }}
                transition={{
                  rotate: {
                    duration: plant.composition.swayDuration,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  },
                  y: {
                    duration: plant.composition.swayDuration * 0.72,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  },
                  scale: {duration: 0.18},
                }}
                className="relative"
              >
                <PlantSprite composition={plant.composition} highlighted={isHovered} />
              </motion.div>

              <AnimatePresence>
                {isHovered ? (
                  <motion.div
                    initial={{opacity: 0, scale: 0.92, y: 8}}
                    animate={{opacity: 1, scale: 1, y: 0}}
                    exit={{opacity: 0, scale: 0.92, y: 8}}
                    className="absolute left-1/2 z-[9999] -translate-x-1/2 pointer-events-none"
                    style={{bottom: tooltipBottom}}
                  >
                    <div
                      className={`max-w-[240px] rounded-3xl px-4 py-3 text-[11px] font-semibold text-[#f7fbe9] shadow-2xl backdrop-blur ${
                        plant.tributeText
                          ? 'border border-[#f8e9b0]/80 bg-[#2b3b1c]/92 tracking-[0.03em]'
                          : 'border border-[#eef6d6]/70 bg-[#20331f]/90 uppercase tracking-[0.12em]'
                      }`}
                    >
                      {plant.tributeText ? (
                        <div className="leading-relaxed">{plant.tributeText}</div>
                      ) : (
                        <div>{`Criado por ${plant.creator}`}</div>
                      )}
                      {plant.phrase ? (
                        <div className="mt-2 text-[10px] font-medium tracking-[0.02em] text-[#d8e7c7] normal-case">
                          {plant.phrase}
                        </div>
                      ) : null}
                      {plant.message ? (
                        <div className="mt-2 text-[10px] italic font-medium tracking-[0.01em] text-[#f1e9cf] normal-case">
                          "{plant.message}"
                        </div>
                      ) : null}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}

        {plants.length === 0 ? (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#eef6d6]/50 bg-[#20331f]/80 px-5 py-3 text-xs font-semibold tracking-[0.08em] text-[#f7fbe9] shadow-xl backdrop-blur">
            A preparar o jardim...
          </div>
        ) : null}
      </motion.div>

      <div className="pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2 rounded-full border border-white/20 bg-[#f4f6e5]/12 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.28em] text-[#f6fae7] backdrop-blur-md">
        Arraste para explorar · roda do mouse para zoom
      </div>

      <div className="absolute right-4 top-1/2 z-[10001] flex -translate-y-1/2 flex-col gap-2">
        <button
          type="button"
          onClick={() => updateZoom(0.12)}
          className="rounded-full border border-[#f3f2dc]/60 bg-[#23361f]/80 px-4 py-2 text-sm font-bold text-[#f8f5dc] shadow-xl backdrop-blur"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => updateZoom(-0.12)}
          className="rounded-full border border-[#f3f2dc]/60 bg-[#23361f]/80 px-4 py-2 text-sm font-bold text-[#f8f5dc] shadow-xl backdrop-blur"
        >
          -
        </button>
      </div>
    </div>
  );
};
