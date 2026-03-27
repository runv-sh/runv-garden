import React from 'react';
import { motion } from 'motion/react';
import { GardenWorld } from './components/GardenWorld';

export default function App() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* HEADER */}
      <header className="fixed top-0 left-0 w-full z-[10000] p-6 md:p-10 pointer-events-none">
        <div className="max-w-2xl bg-white/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-white/50 shadow-2xl pointer-events-auto">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl md:text-4xl font-bold tracking-tighter text-[#1a241a] mb-2"
          >
            RUNV Garden
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-[#388e3c] font-semibold mb-3"
          >
            Um jardim comunitário onde cada planta nasce de um gesto da comunidade.
          </motion.p>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-[#6b806b] leading-relaxed max-w-lg"
          >
            Árvores, flores, cactos e pequenas raridades crescem em um mundo vivo cultivado por quem passa pelo <span className="font-bold text-[#2d3a2d]">runv.club</span>. Explore o mapa e descubra quem está ajudando a florescer este ecossistema.
          </motion.p>
        </div>
      </header>

      {/* MAIN GARDEN WORLD */}
      <main className="flex-grow">
        <GardenWorld />
      </main>

      {/* FOOTER */}
      <footer className="fixed bottom-0 left-0 w-full z-[10000] p-6 pointer-events-none flex justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl px-6 py-3 rounded-full border border-white/50 shadow-xl pointer-events-auto"
        >
          <p className="text-[10px] md:text-xs text-[#4a5d4a] font-bold uppercase tracking-[0.2em]">
            © {currentYear} RUNV Garden · Cultivado com carinho pela comunidade
          </p>
        </motion.div>
      </footer>
    </div>
  );
}
