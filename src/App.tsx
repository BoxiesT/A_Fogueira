/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { GameEngine } from './game/GameEngine';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { GameOverModal } from './components/GameOverModal';
import { TutorialModal } from './components/TutorialModal';
import { UpgradesModal } from './components/UpgradesModal';
import { StartMenu } from './components/StartMenu';
import { PauseModal } from './components/PauseModal';
import { DebugPanel } from './components/DebugPanel';
import { DeathReason, GameStats } from './types';
import { sound } from './utils/audio';

export default function App() {
  const engine = useMemo(() => {
    const eng = new GameEngine();
    eng.disableDarknessMask = false;
    // Start in paused state waiting for the start menu
    eng.isPaused = true;
    return eng;
  }, []);

  // UI state for reactive updates
  const [, setTick] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [deathReason, setDeathReason] = useState<DeathReason | null>(null);
  const [gameOverStats, setGameOverStats] = useState<GameStats>(engine.stats);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showUpgrades, setShowUpgrades] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDarknessDisabled, setIsDarknessDisabled] = useState(false);

  // Global shortcut 'ç' / 'Ç' to toggle the Debug Panel
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'ç' ||
        e.key === 'Ç' ||
        e.key.toLowerCase() === 'ç' ||
        (e.code === 'Semicolon' && e.key === 'ç')
      ) {
        e.preventDefault();
        setShowDebugPanel((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleStartGame = useCallback(() => {
    sound.init();
    sound.resume();
    engine.isPaused = false;
    setHasStarted(true);
    setTick((prev) => prev + 1);
  }, [engine]);

  const handleTogglePause = useCallback(() => {
    engine.isPaused = !engine.isPaused;
    setTick((prev) => prev + 1);
  }, [engine]);

  const handleResume = useCallback(() => {
    engine.isPaused = false;
    setTick((prev) => prev + 1);
  }, [engine]);

  const handleToggleDarkness = useCallback(() => {
    engine.disableDarknessMask = !engine.disableDarknessMask;
    setIsDarknessDisabled(engine.disableDarknessMask);
    setTick((prev) => prev + 1);
  }, [engine]);

  const handleStateUpdate = useCallback(() => {
    setTick((prev) => (prev + 1) % 10000);
  }, []);

  const handleGameOver = useCallback((stats: GameStats, reason: DeathReason) => {
    setIsGameOver(true);
    setDeathReason(reason);
    setGameOverStats({ ...stats });
  }, []);

  const handleRestart = useCallback(() => {
    engine.reset();
    engine.isPaused = false;
    setIsGameOver(false);
    setDeathReason(null);
    setTick((prev) => prev + 1);
  }, [engine]);

  const handleOpenUpgrades = useCallback(() => {
    engine.isPaused = true;
    setShowUpgrades(true);
    setTick((prev) => prev + 1);
  }, [engine]);

  const handleCloseUpgrades = useCallback(() => {
    engine.isPaused = false;
    setShowUpgrades(false);
    setTick((prev) => prev + 1);
  }, [engine]);

  const handleOpenTutorial = useCallback(() => {
    engine.isPaused = true;
    setShowTutorial(true);
    setTick((prev) => prev + 1);
  }, [engine]);

  const handleCloseTutorial = useCallback(() => {
    if (hasStarted && !showUpgrades) {
      engine.isPaused = false;
    }
    setShowTutorial(false);
    setTick((prev) => prev + 1);
  }, [engine, hasStarted, showUpgrades]);

  const handleToggleSound = useCallback(() => {
    sound.init();
    sound.resume();
    const muted = sound.toggleMute();
    setIsMuted(muted);
  }, []);

  const handleApplyUpgrade = useCallback(
    (type: Parameters<GameEngine['applyUpgrade']>[0]) => {
      engine.applyUpgrade(type);
      setTick((prev) => prev + 1);
    },
    [engine]
  );

  const handleAttack = useCallback(() => {
    sound.init();
    sound.resume();
    engine.triggerAttack();
  }, [engine]);

  const handleChop = useCallback(() => {
    sound.init();
    sound.resume();
    engine.triggerChopTree();
  }, [engine]);

  const isPausedModalVisible =
    hasStarted &&
    engine.isPaused &&
    !showTutorial &&
    !showUpgrades &&
    !isGameOver;

  return (
    <main className="relative w-screen h-screen bg-[#05070c] overflow-hidden select-none font-sans text-stone-200">
      {/* Game Canvas Simulation & Pixel Render */}
      <GameCanvas
        engine={engine}
        onGameOver={handleGameOver}
        onStateUpdate={handleStateUpdate}
      />

      {/* Atmospheric Pixel HUD Overlay (Visible during play) */}
      {hasStarted && (
        <HUD
          player={engine.player}
          campfire={engine.campfire}
          stats={engine.stats}
          upgrades={engine.upgrades}
          isPaused={engine.isPaused}
          onTogglePause={handleTogglePause}
          onOpenUpgrades={handleOpenUpgrades}
          onAttack={handleAttack}
          onChop={handleChop}
        />
      )}

      {/* Debug Panel for Light Testing (Accessed via 'ç' key) */}
      <DebugPanel
        isOpen={showDebugPanel}
        onClose={() => setShowDebugPanel(false)}
        isDarknessDisabled={isDarknessDisabled}
        onToggleDarkness={handleToggleDarkness}
      />

      {/* Start HUD / Menu */}
      {!hasStarted && (
        <StartMenu
          onStart={handleStartGame}
          onOpenTutorial={handleOpenTutorial}
        />
      )}

      {/* In-Game Pause Modal */}
      {isPausedModalVisible && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onOpenTutorial={handleOpenTutorial}
          isMuted={isMuted}
          onToggleSound={handleToggleSound}
        />
      )}

      {/* Tutorial & Handbook Modal */}
      {showTutorial && (
        <TutorialModal onClose={handleCloseTutorial} />
      )}

      {/* Upgrades Offering Modal */}
      {showUpgrades && (
        <UpgradesModal
          embersCollected={engine.player.embersCollected}
          upgrades={engine.upgrades}
          onApplyUpgrade={handleApplyUpgrade}
          onClose={handleCloseUpgrades}
        />
      )}

      {/* Game Over Modal */}
      {isGameOver && (
        <GameOverModal
          stats={gameOverStats}
          reason={deathReason}
          onRestart={handleRestart}
        />
      )}
    </main>
  );
}

