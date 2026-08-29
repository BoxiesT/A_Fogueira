import React from 'react';
import { Play, RotateCcw, BookOpen, Volume2, VolumeX, Flame } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenTutorial: () => void;
  isMuted: boolean;
  onToggleSound: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onOpenTutorial,
  isMuted,
  onToggleSound,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl border-2 border-stone-800 bg-stone-950/95 p-6 text-center shadow-2xl shadow-black">
        {/* Header Flame Icon */}
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-950/50 border border-amber-600/40 shadow-inner">
          <Flame className="w-7 h-7 text-amber-400" />
        </div>

        <h2 className="font-cinzel text-2xl font-black text-stone-100 tracking-wider">
          JOGO PAUSADO
        </h2>
        <p className="text-xs text-stone-400 mt-1 mb-6">
          A chama aguarda o seu retorno
        </p>

        <div className="space-y-3">
          {/* Resume */}
          <button
            onClick={onResume}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 py-3 px-5 font-cinzel font-bold text-stone-950 text-sm shadow-lg shadow-amber-950/50 transition active:scale-95 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-stone-950" />
            <span>Continuar</span>
          </button>

          {/* Tutorial / Help */}
          <button
            onClick={onOpenTutorial}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-stone-900/90 hover:bg-stone-800 py-2.5 px-4 font-cinzel text-xs font-semibold text-stone-300 border border-stone-800 transition active:scale-95 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Manual & Controles</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-stone-900/90 hover:bg-stone-800 py-2.5 px-4 font-cinzel text-xs font-semibold text-stone-300 border border-stone-800 transition active:scale-95 cursor-pointer"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-red-400" />
                <span>Som: Desativado</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>Som: Ativado</span>
              </>
            )}
          </button>

          {/* Restart Game */}
          <button
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-950/40 hover:bg-red-900/50 py-2.5 px-4 font-cinzel text-xs font-bold text-red-300 border border-red-800/40 transition active:scale-95 cursor-pointer mt-2"
          >
            <RotateCcw className="w-4 h-4 text-red-400" />
            <span>Reiniciar Partida</span>
          </button>
        </div>

        <div className="mt-5 text-[11px] font-mono text-stone-500">
          Pressione ESC para fechar a pausa
        </div>
      </div>
    </div>
  );
};
