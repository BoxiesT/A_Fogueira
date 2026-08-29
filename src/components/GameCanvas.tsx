import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from '../game/GameEngine';
import { DeathReason, GameStats } from '../types';
import { sound } from '../utils/audio';

interface GameCanvasProps {
  engine: GameEngine;
  onGameOver: (stats: GameStats, reason: DeathReason) => void;
  onStateUpdate: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  engine,
  onGameOver,
  onStateUpdate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const mouseAngleRef = useRef<number>(0);

  // Resize handler
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Main game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    let lastTime = performance.now();
    let animationFrameId: number;

    engine.onGameOver = onGameOver;
    engine.onStateChange = onStateUpdate;

    const gameLoop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      // Update simulation
      engine.update(dt);
      onStateUpdate();

      // Render pixel frame
      engine.render(ctx, dimensions.width, dimensions.height);

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [engine, dimensions, onGameOver, onStateUpdate]);

  // Track mouse coordinates for directional aim
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const centerX = dimensions.width / 2;
      const centerY = dimensions.height / 2;
      mouseAngleRef.current = Math.atan2(mouseY - centerY, mouseX - centerX);
    },
    [dimensions]
  );

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      sound.init();
      sound.resume();

      engine.keys[e.code] = true;

      // Quick actions
      if (e.code === 'Escape') {
        e.preventDefault();
        engine.isPaused = !engine.isPaused;
        onStateUpdate();
      } else if (e.code === 'Space') {
        e.preventDefault();
        // Attack towards mouse aim angle
        engine.triggerAttack(mouseAngleRef.current);
      } else if (e.code === 'KeyE' || e.code === 'KeyF') {
        e.preventDefault();
        engine.triggerChopTree();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      engine.keys[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const centerX = dimensions.width / 2;
      const centerY = dimensions.height / 2;
      mouseAngleRef.current = Math.atan2(mouseY - centerY, mouseX - centerX);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleWindowMouseMove);
    };
  }, [engine, dimensions, onStateUpdate]);

  // Mouse controls
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      sound.init();
      sound.resume();

      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Aim direction relative to screen center
      const centerX = dimensions.width / 2;
      const centerY = dimensions.height / 2;
      const angle = Math.atan2(mouseY - centerY, mouseX - centerX);
      mouseAngleRef.current = angle;

      if (e.button === 0) {
        // Left click = attack in mouse direction
        engine.triggerAttack(angle);
      } else if (e.button === 2) {
        // Right click = chop tree
        e.preventDefault();
        engine.triggerChopTree();
      }
    },
    [engine, dimensions]
  );

  // Touch controls / Virtual Joystick
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      sound.init();
      sound.resume();

      if (e.touches.length > 0) {
        const touch = e.touches[0];
        // Only if touched on left 60% of screen for virtual joystick
        if (touch.clientX < dimensions.width * 0.6) {
          touchStartPos.current = { x: touch.clientX, y: touch.clientY };
          engine.virtualJoystick.active = true;
        }
      }
    },
    [engine, dimensions]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!touchStartPos.current || !engine.virtualJoystick.active) return;
      const touch = e.touches[0];
      const dx = touch.clientX - touchStartPos.current.x;
      const dy = touch.clientY - touchStartPos.current.y;
      const maxRadius = 45;
      const dist = Math.hypot(dx, dy);

      if (dist > 5) {
        engine.virtualJoystick.x = Math.max(-1, Math.min(1, dx / maxRadius));
        engine.virtualJoystick.y = Math.max(-1, Math.min(1, dy / maxRadius));
      } else {
        engine.virtualJoystick.x = 0;
        engine.virtualJoystick.y = 0;
      }
    },
    [engine]
  );

  const handleTouchEnd = useCallback(() => {
    touchStartPos.current = null;
    engine.virtualJoystick.active = false;
    engine.virtualJoystick.x = 0;
    engine.virtualJoystick.y = 0;
  }, [engine]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#05070c] overflow-hidden select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="block w-full h-full pixelated cursor-crosshair"
      />

      {/* Atmospheric Screen Vignette Overlay */}
      <div
        className={`absolute inset-0 pointer-events-none ${
          engine.player.torchFuel <= 0 ? 'vignette-danger' : 'vignette-overlay'
        }`}
      />
    </div>
  );
};
