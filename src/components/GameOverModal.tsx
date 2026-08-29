import React, { useEffect, useState } from 'react';
import { DeathReason, GameStats } from '../types';
import { Flame, RefreshCw, Skull, Trophy, Award } from 'lucide-react';

interface GameOverModalProps {
  stats: GameStats;
  reason: DeathReason | null;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  reason,
  onRestart,
}) => {
  const [bestTime, setBestTime] = useState<number>(0);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem('la_fogueira_best_time');
    const prevBest = saved ? parseFloat(saved) : 0;

    if (stats.timeSurvived > prevBest) {
      localStorage.setItem('la_fogueira_best_time', stats.timeSurvived.toString());
      setBestTime(stats.timeSurvived);
      setIsNewRecord(true);
    } else {
      setBestTime(prevBest);
    }
  }, [stats.timeSurvived]);

  // Format time
  const formatTime = (timeInSec: number) => {
    const min = Math.floor(timeInSec / 60);
    const sec = Math.floor(timeInSec % 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Lore description by death reason
  let reasonTitle = 'A Escuridão Venceu';
  let reasonDescription = 'O frio eterno consumiu a última fagulha do mundo.';

  if (reason === 'campfire_extinguished') {
    reasonTitle = 'A Fogueira Apagou';
    reasonDescription =
      'O fogo central se extinguiu na escuridão profunda. Sem a fogueira, a noite eterna devorou tudo.';
  } else if (reason === 'slain_by_shadows') {
    reasonTitle = 'Dilacerado pelas Sombras';
    reasonDescription =
      'As criaturas que espreitam no breu alcançaram você e silenciaram seus passos.';
  } else if (reason === 'consumed_by_darkness') {
    reasonTitle = 'Consumido pelo Frio da Escuridão';
    reasonDescription =
      'Sua tocha apagou longe da fogueira e o horror da escuridão congelou seu coração.';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-md rounded-3xl bg-stone-950 border-2 border-stone-800 p-6 sm:p-8 shadow-2xl text-center flex flex-col items-center">
        {/* Glow halo */}
        <div className="absolute -top-12 w-24 h-24 rounded-full bg-red-950/80 border border-red-800/80 flex items-center justify-center shadow-[0_0_50px_rgba(220,38,38,0.4)]">
          <Skull className="w-12 h-12 text-red-500 animate-pulse" />
        </div>

        <div className="mt-8">
          <span className="font-cinzel text-xs font-bold uppercase tracking-widest text-red-400">
            Fim da Sobrevivência
          </span>
          <h2 className="font-cinzel text-2xl sm:text-3xl font-black text-stone-100 mt-1">
            {reasonTitle}
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-2 italic font-serif max-w-xs mx-auto">
            "{reasonDescription}"
          </p>
        </div>

        {/* New record badge */}
        {isNewRecord && (
          <div className="mt-4 flex items-center gap-1.5 rounded-full bg-amber-950/80 border border-amber-600/70 px-3 py-1 text-xs font-bold text-amber-300 animate-bounce">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Novo Recorde de Sobrevivência!</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="w-full mt-6 grid grid-cols-2 gap-2.5 text-left">
          <div className="rounded-xl bg-stone-900/90 border border-stone-800 p-3">
            <span className="text-[10px] text-stone-400 font-cinzel uppercase block">
              Tempo Sobrevivido
            </span>
            <span className="font-mono text-lg font-bold text-amber-300">
              {formatTime(stats.timeSurvived)}
            </span>
          </div>

          <div className="rounded-xl bg-stone-900/90 border border-stone-800 p-3">
            <span className="text-[10px] text-stone-400 font-cinzel uppercase block">
              Noites Sobrevividas
            </span>
            <span className="font-mono text-lg font-bold text-blue-300">
              {stats.nightsSurvived} Noites
            </span>
          </div>

          <div className="rounded-xl bg-stone-900/90 border border-stone-800 p-3">
            <span className="text-[10px] text-stone-400 font-cinzel uppercase block">
              Madeira na Fogueira
            </span>
            <span className="font-mono text-lg font-bold text-orange-400">
              {stats.woodFedToFire} Troncos
            </span>
          </div>

          <div className="rounded-xl bg-stone-900/90 border border-stone-800 p-3">
            <span className="text-[10px] text-stone-400 font-cinzel uppercase block">
              Criaturas Banidas
            </span>
            <span className="font-mono text-lg font-bold text-purple-400">
              {stats.enemiesBanished}
            </span>
          </div>
        </div>

        {/* Best Record */}
        <div className="mt-4 flex items-center justify-between w-full px-3 py-2 rounded-xl bg-stone-900/50 border border-stone-800/80 text-xs">
          <div className="flex items-center gap-1.5 text-stone-400">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Melhor Tempo:</span>
          </div>
          <span className="font-mono font-bold text-amber-300">{formatTime(bestTime)}</span>
        </div>

        {/* Restart Button */}
        <button
          onClick={onRestart}
          className="mt-6 w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 py-3.5 px-6 font-cinzel font-bold text-stone-950 tracking-wider shadow-xl transition active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-5 h-5 text-stone-950" />
          <span>Reacender a Fogueira</span>
        </button>
      </div>
    </div>
  );
};
