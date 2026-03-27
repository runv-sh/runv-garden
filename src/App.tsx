import React from 'react';
import {motion} from 'motion/react';
import {GardenWorld} from './components/GardenWorld';

export default function App() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden">
      <header className="pointer-events-none fixed left-0 top-0 z-[10000] w-full px-4 pt-4 md:px-8 md:pt-7">
        <div className="pointer-events-auto max-w-3xl rounded-[2rem] border border-[#f8f8ea]/60 bg-[#f7f3de]/76 px-5 py-5 shadow-[0_28px_80px_rgba(31,51,22,0.2)] backdrop-blur-2xl md:px-8 md:py-7">
          <motion.h1
            initial={{opacity: 0, x: -24}}
            animate={{opacity: 1, x: 0}}
            className="text-3xl font-black tracking-[-0.06em] text-[#20321f] md:text-5xl"
          >
            RUNV Garden
          </motion.h1>
          <motion.p
            initial={{opacity: 0, x: -18}}
            animate={{opacity: 1, x: 0}}
            transition={{delay: 0.08}}
            className="mt-2 text-base font-semibold text-[#476538] md:text-xl"
          >
            Um jardim comunitário onde cada planta nasce de um gesto da comunidade.
          </motion.p>
          <motion.p
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            transition={{delay: 0.16}}
            className="mt-3 max-w-2xl text-sm leading-relaxed text-[#5d7352] md:text-base"
          >
            Árvores, flores, cactos e pequenas raridades crescem em um mundo vivo cultivado por quem passa pelo{' '}
            <span className="font-bold text-[#2d4329]">runv.club</span>.
          </motion.p>
        </div>
      </header>

      <main className="flex-1">
        <GardenWorld />
      </main>

      <footer className="pointer-events-none fixed bottom-0 left-0 z-[10000] flex w-full justify-center px-4 pb-4 md:pb-6">
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          className="pointer-events-auto rounded-full border border-[#f5f6e7]/55 bg-[#f5f1da]/75 px-5 py-2 shadow-[0_18px_45px_rgba(22,38,18,0.16)] backdrop-blur-xl"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#56694d] md:text-xs">
            © {currentYear} RUNV Garden · Cultivado com carinho pela comunidade
          </p>
        </motion.div>
      </footer>
    </div>
  );
}
