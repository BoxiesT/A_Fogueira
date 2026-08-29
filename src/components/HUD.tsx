import {
  Flame,
  Heart,
  Moon,
  Sparkles,
  Swords,
  Weight,
  Pause,
  Play,
} from 'lucide-react';
import React from 'react';
import { GameStats, Player, Campfire, Upgrades } from '../types';

interface HUDProps {
  player: Player;
  campfire: Campfire;
  stats: GameStats;
  upgrades: Upgrades;
  isPaused: boolean;
  onTogglePause: () => void;
  onOpenUpgrades: () => void;
  onAttack: () => void;
  onChop: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  player,
  campfire,
  stats,
  upgrades,
  isPaused,
  onTogglePause,
  onOpenUpgrades,
  onAttack,
  onChop,
}) => {
  // Format survival time
  const minutes = Math.floor(stats.timeSurvived / 60);
  const seconds = Math.floor(stats.timeSurvived % 60);
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;

  // Compass angle towards campfire
  const dx = campfire.x - player.x;
  const dy = campfire.y - player.y;
  const distToFire = Math.round(Math.hypot(dx, dy) / 10);
  const compassAngle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Weight penalty calculation
  const weightMitigation = upgrades.backpackStrength * 0.025;
  const slowPerLog = Math.max(0.06, 0.12 - weightMitigation);
  const speedSlowPercent = Math.round(player.woodCarried * slowPerLog * 100);

  const fireFuelPct = Math.max(0, Math.min(100, (campfire.fuel / campfire.maxFuel) * 100));
  const playerHpPct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
  const isFireDying = (campfire.fuel / campfire.maxFuel) <= 0.25;

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 sm:p-5 select-none z-10">
      {/* TOP BAR: Campfire Global HP, Night/Time, and Quick Controls */}
      <div className="flex items-start justify-between gap-3">
        {/* Campfire (Global HP) Bar */}
        <div className="pointer-events-auto flex flex-col gap-1 rounded-xl bg-black/75 p-3 backdrop-blur-md border border-amber-900/40 shadow-2xl min-w-[200px] sm:min-w-[280px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-lg ${
                  isFireDying
                    ? 'bg-red-950/80 text-red-500 animate-pulse'
                    : 'bg-amber-950/60 text-amber-400'
                }`}
              >
                <Flame className={`w-5 h-5 ${isFireDying ? 'animate-bounce' : ''}`} />
              </div>
              <div>
                <span className="font-cinzel text-xs font-bold tracking-wider text-amber-200">
                  A FOGUEIRA (VIDA GLOBAL)
                </span>
                <p className="text-[10px] text-amber-400/80 font-mono">
                  {Math.round(campfire.fuel)} / {campfire.maxFuel} Combustível
                </p>
              </div>
            </div>
            {isFireDying && (
              <span className="text-[10px] font-bold text-red-400 animate-pulse uppercase tracking-wider bg-red-950/80 px-1.5 py-0.5 rounded border border-red-800">
                Apagando!
              </span>
            )}
          </div>

          {/* Fire Fuel Bar */}
          <div className="h-3 w-full overflow-hidden rounded-full bg-stone-900/90 border border-amber-950 p-0.5">
            <div
              className={`h-full rounded-full transition-[width] duration-75 ease-out ${
                isFireDying
                  ? 'bg-gradient-to-r from-red-600 to-amber-600 animate-pulse'
                  : 'bg-gradient-to-r from-amber-600 via-orange-500 to-yellow-400'
              }`}
              style={{ width: `${fireFuelPct}%` }}
            />
          </div>
        </div>

        {/* Center: Night & Time Survived & Campfire Compass & Torch Out Warning */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="pointer-events-auto flex items-center gap-3 rounded-xl bg-black/75 px-4 py-2 backdrop-blur-md border border-stone-800 shadow-xl">
            <div className="flex items-center gap-1.5 text-blue-300">
              <Moon className="w-4 h-4 text-blue-400" />
              <span className="font-cinzel font-bold text-xs">
                Noite {stats.nightsSurvived + 1}
              </span>
            </div>
            <div className="h-3 w-[1px] bg-stone-700" />
            <div className="font-mono text-sm font-bold text-stone-200 tracking-wider">
              {timeFormatted}
            </div>
          </div>

          {/* Runic Compass pointing to campfire */}
          <div
            className="flex items-center gap-2 rounded-lg bg-black/60 px-2.5 py-1 text-[11px] font-mono text-amber-300/90 border border-amber-900/30 backdrop-blur-sm"
            title="Direção da Fogueira Central"
          >
            <div
              className="text-amber-400 transition-transform duration-100 font-bold"
              style={{ transform: `rotate(${compassAngle}deg)` }}
            >
              ➔
            </div>
            <span>Fogueira: {distToFire}m</span>
          </div>

          {/* Aviso na região superior quando a tocha apagar de vez */}
          {player.torchFuel <= 0 && (
            <div className="pointer-events-auto mt-1 flex items-center gap-2 rounded-xl bg-red-950/90 border border-red-600/80 px-4 py-1.5 shadow-2xl backdrop-blur-md animate-pulse">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="font-cinzel text-xs font-bold tracking-widest text-red-200 uppercase">
                Tocha Apagada
              </span>
            </div>
          )}
        </div>

        {/* Top Right: Buttons (Embers Upgrade, Pause Menu) */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Soul Embers Upgrade Button */}
          <button
            onClick={onOpenUpgrades}
            className="flex items-center gap-1.5 rounded-xl bg-amber-950/70 hover:bg-amber-900/80 px-3 py-2 text-xs font-bold text-amber-300 border border-amber-700/50 backdrop-blur-md shadow-lg transition active:scale-95 cursor-pointer"
            title="Melhorias com Brasas da Fogueira"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="font-mono">{player.embersCollected}</span>
            <span className="hidden sm:inline font-cinzel text-[11px]">Melhorias</span>
          </button>

          {/* Pause Button (Opens menu with Sound, Controls & Manual) */}
          <button
            onClick={onTogglePause}
            className={`rounded-xl p-2 border backdrop-blur-md shadow-lg transition active:scale-95 cursor-pointer ${
              isPaused
                ? 'bg-amber-500/20 text-amber-300 border-amber-500 animate-pulse'
                : 'bg-black/75 hover:bg-stone-900/90 text-stone-300 border-stone-800'
            }`}
            title={isPaused ? 'Continuar Jogo (ESC)' : 'Pausar Jogo & Opções (ESC)'}
          >
            {isPaused ? <Play className="w-4 h-4 text-amber-400" /> : <Pause className="w-4 h-4 text-stone-300" />}
          </button>
        </div>
      </div>

      {/* BOTTOM BAR: Player HP, Wood Encumbrance Backpack */}
      <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-3">
        {/* Player Status (HP + Wood Backpack) */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2 sm:gap-3 rounded-2xl bg-black/80 p-3 backdrop-blur-md border border-stone-800 shadow-2xl">
          {/* Player HP */}
          <div className="flex flex-col gap-1 min-w-[110px] sm:min-w-[130px]">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-red-400">
                <Heart className="w-3.5 h-3.5 fill-red-500" />
                <span className="font-cinzel font-bold text-[11px]">VIDA</span>
              </div>
              <span className="font-mono text-[10px] text-stone-300">
                {Math.round(player.hp)} / {player.maxHp}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-900 border border-stone-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-700 to-red-500 transition-[width] duration-75 ease-out"
                style={{ width: `${playerHpPct}%` }}
              />
            </div>
          </div>

          <div className="hidden sm:block h-8 w-[1px] bg-stone-800" />

          {/* Wood Weight (Peso da Madeira) */}
          <div
            className="flex items-center gap-2 rounded-xl bg-stone-900/80 px-2.5 py-1.5 border border-stone-800"
            title="Madeira coletada para alimentar a fogueira central"
          >
            <div className="p-1 rounded-lg bg-amber-950/50 text-amber-400">
              <Weight className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-cinzel text-[11px] font-bold text-stone-200">
                  Madeira: {player.woodCarried}/{player.maxWood}
                </span>
                {player.ancientWoodCarried > 0 && (
                  <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/90 border border-amber-600/60 px-1 rounded shadow-sm" title="Madeiras Ancestrais">
                    ✨ {player.ancientWoodCarried}
                  </span>
                )}
              </div>
              <span
                className={`text-[9px] font-mono ${
                  player.woodCarried > 0 ? 'text-orange-400' : 'text-stone-400'
                }`}
              >
                {player.woodCarried > 0
                  ? `-${speedSlowPercent}% Vel (${player.woodCarried} toras)`
                  : 'Sem carga'}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Action Buttons (Combat & Chop) */}
        <div className="pointer-events-auto flex items-center gap-2 sm:hidden">
          {/* Chop Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onChop();
            }}
            onClick={onChop}
            className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-amber-950/80 active:bg-amber-900 border-2 border-amber-700/60 shadow-2xl text-amber-200 active:scale-95 transition backdrop-blur-md"
          >
            <span className="text-lg">🪓</span>
            <span className="text-[9px] font-bold font-cinzel">Cortar</span>
          </button>

          {/* Attack Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onAttack();
            }}
            onClick={onAttack}
            className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-red-950/80 active:bg-red-900 border-2 border-red-600/70 shadow-2xl text-red-200 active:scale-95 transition backdrop-blur-md"
          >
            <Swords className="w-6 h-6 text-red-400" />
            <span className="text-[10px] font-bold font-cinzel">Atacar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
