import { Campfire, Enemy, Player, SoulEmber, TreeObject, WoodDrop } from '../types';

/**
 * Pixel Art Procedural Canvas Renderer
 * Detailed pixel styling with cold Nordic palette and warm amber light sources.
 */

// Draw pixel rectangle helper
export function drawPixelRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
}

// Draw Ground Tiles & Environment Details
export function renderGround(
  ctx: CanvasRenderingContext2D,
  camX: number,
  camY: number,
  width: number,
  height: number,
  worldSize: number
) {
  // Deep cold dark ground background
  ctx.fillStyle = '#090d14';
  ctx.fillRect(0, 0, width, height);

  const startX = Math.floor(camX / 64) * 64;
  const startY = Math.floor(camY / 64) * 64;

  const tileSize = 64;
  const tilesX = Math.ceil(width / tileSize) + 2;
  const tilesY = Math.ceil(height / tileSize) + 2;

  for (let xIdx = -1; xIdx < tilesX; xIdx++) {
    for (let yIdx = -1; yIdx < tilesY; yIdx++) {
      const worldX = startX + xIdx * tileSize;
      const worldY = startY + yIdx * tileSize;

      if (worldX < 0 || worldX >= worldSize || worldY < 0 || worldY >= worldSize) {
        continue;
      }

      const screenX = worldX - camX;
      const screenY = worldY - camY;

      // Pseudo-random deterministic hash for soil details
      const hash = Math.sin(worldX * 12.9898 + worldY * 78.233) * 43758.5453;
      const rand = hash - Math.floor(hash);

      // Subtle grass / frozen soil texture
      if (rand > 0.7) {
        drawPixelRect(ctx, screenX + 12, screenY + 18, 4, 3, '#101721');
        drawPixelRect(ctx, screenX + 16, screenY + 20, 3, 2, '#141d2a');
      } else if (rand > 0.45) {
        drawPixelRect(ctx, screenX + 38, screenY + 44, 5, 3, '#0e141d');
        drawPixelRect(ctx, screenX + 40, screenY + 42, 2, 2, '#182433');
      }

      // Occasional frozen pebble or moss patch
      if (rand > 0.88) {
        drawPixelRect(ctx, screenX + 24, screenY + 30, 6, 4, '#1b2636');
        drawPixelRect(ctx, screenX + 26, screenY + 28, 3, 2, '#283b54');
      }

      // Subtle snow patch
      if (rand > 0.94) {
        drawPixelRect(ctx, screenX + 8, screenY + 8, 8, 4, '#202d3d');
        drawPixelRect(ctx, screenX + 10, screenY + 9, 5, 2, '#31445b');
      }
    }
  }

  // Draw ancient stone circle near campfire (world center)
  const centerScreenX = worldSize / 2 - camX;
  const centerScreenY = worldSize / 2 - camY;

  // Stone ring around fire base
  ctx.save();
  ctx.translate(centerScreenX, centerScreenY);
  const stoneCount = 10;
  for (let i = 0; i < stoneCount; i++) {
    const angle = (i / stoneCount) * Math.PI * 2;
    const stoneDist = 58;
    const sx = Math.cos(angle) * stoneDist;
    const sy = Math.sin(angle) * stoneDist * 0.75;
    
    // Stone pixel art
    drawPixelRect(ctx, sx - 8, sy - 6, 16, 12, '#171f2c');
    drawPixelRect(ctx, sx - 6, sy - 8, 12, 14, '#243245');
    drawPixelRect(ctx, sx - 4, sy - 6, 8, 4, '#384d6b'); // Highlight
  }

  // Ash patch in center
  ctx.fillStyle = '#06080d';
  ctx.beginPath();
  ctx.ellipse(0, 4, 38, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Draw the Player
export function renderPlayer(
  ctx: CanvasRenderingContext2D,
  player: Player,
  camX: number,
  camY: number,
  now: number
) {
  const sx = player.x - camX;
  const sy = player.y - camY;

  ctx.save();
  ctx.translate(sx, sy);

  // Damage Flash
  if (player.damageFlash > 0) {
    ctx.filter = 'brightness(2.2) drop-shadow(0 0 8px rgba(255, 60, 60, 0.9))';
  }

  // Shadow under player
  ctx.fillStyle = 'rgba(2, 4, 8, 0.65)';
  ctx.beginPath();
  ctx.ellipse(0, 14, 16, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  const isFlipped = Math.cos(player.facingAngle) < 0;
  if (isFlipped) {
    ctx.scale(-1, 1);
  }

  // Walking bob / step
  const walkBob = player.isMoving ? Math.sin(player.walkFrame * 8) * 3 : 0;
  const legOffset = player.isMoving ? Math.sin(player.walkFrame * 8) * 4 : 0;

  // Legs & Boots
  drawPixelRect(ctx, -6 + legOffset, 8, 4, 8, '#1e2430');
  drawPixelRect(ctx, 2 - legOffset, 8, 4, 8, '#161a22');
  drawPixelRect(ctx, -7 + legOffset, 14, 6, 4, '#0d1017');
  drawPixelRect(ctx, 1 - legOffset, 14, 6, 4, '#0d1017');

  // Wood Bundle on Back (if carrying wood)
  if (player.woodCarried > 0) {
    const logs = Math.min(player.woodCarried, 5);
    const ancientLogs = Math.min(player.ancientWoodCarried || 0, logs);
    for (let l = 0; l < logs; l++) {
      const isAncient = l >= (logs - ancientLogs);
      const logY = -4 - l * 5 + walkBob;

      if (isAncient) {
        // Ancient Runic Log
        drawPixelRect(ctx, -14, logY, 10, 6, '#3d1d03');
        drawPixelRect(ctx, -13, logY + 1, 8, 4, '#78350f');
        // Golden glowing end ring
        drawPixelRect(ctx, -16, logY + 1, 3, 4, '#d97706');
        drawPixelRect(ctx, -15, logY + 2, 1, 2, '#fde047');
        // Golden rune binding
        drawPixelRect(ctx, -10, logY - 1, 2, 8, '#f59e0b');
      } else {
        // Normal Log
        drawPixelRect(ctx, -14, logY, 10, 6, '#422c1d');
        drawPixelRect(ctx, -13, logY + 1, 8, 4, '#5e3e29');
        // End ring
        drawPixelRect(ctx, -16, logY + 1, 3, 4, '#8a6245');
        drawPixelRect(ctx, -15, logY + 2, 1, 2, '#422c1d');
        // Rope binding
        drawPixelRect(ctx, -10, logY - 1, 2, 8, '#9c8159');
      }
    }
  }

  // Body & Cloak (Warm dark wool / fur)
  const bodyY = -6 + walkBob;
  drawPixelRect(ctx, -7, bodyY, 14, 15, '#232c3d'); // Dark coat
  drawPixelRect(ctx, -5, bodyY + 2, 10, 11, '#334155'); // Inner tunic
  drawPixelRect(ctx, -2, bodyY + 3, 4, 8, '#64748b'); // Belt buckle / clasps
  drawPixelRect(ctx, -6, bodyY + 9, 12, 3, '#1e1b18'); // Leather belt

  // Head & Fur Hood
  const headY = -18 + walkBob;
  drawPixelRect(ctx, -6, headY, 12, 12, '#1e293b'); // Hood outer
  drawPixelRect(ctx, -4, headY + 3, 9, 7, '#d4af8c'); // Face skin
  drawPixelRect(ctx, 1, headY + 4, 2, 2, '#0f172a'); // Eye
  drawPixelRect(ctx, -7, headY - 1, 14, 4, '#475569'); // Fur lining of hood

  // Scarf / Mask
  drawPixelRect(ctx, -5, headY + 8, 11, 4, '#94a3b8');

  // Holding the Torch / Axe
  const armY = -3 + walkBob;

  if (player.isAttacking) {
    // Attack swing pose
    const swingProgress = player.attackProgress;
    const swingAngle = -1.2 + swingProgress * 2.4;
    ctx.save();
    ctx.translate(2, armY);
    ctx.rotate(swingAngle);

    // Arm
    drawPixelRect(ctx, 0, -3, 9, 4, '#334155');

    // Torch Stick / Axe Handle
    drawPixelRect(ctx, 7, -14, 3, 20, '#5e3e29');
    drawPixelRect(ctx, 6, -18, 5, 5, '#1e2430'); // Torch head / iron wrap

    // Torch Flame (if fuel > 0)
    if (player.torchFuel > 0) {
      const flicker = Math.sin(now * 0.02) * 2;
      drawPixelRect(ctx, 4, -26 + flicker, 9, 9, '#ea580c');
      drawPixelRect(ctx, 5, -28 + flicker, 7, 7, '#f59e0b');
      drawPixelRect(ctx, 6, -29 + flicker, 5, 5, '#fef08a');
    }

    ctx.restore();
  } else if (player.isChopping) {
    // Chopping animation
    const chopAngle = Math.sin(player.chopProgress * Math.PI * 4) * 0.9;
    ctx.save();
    ctx.translate(4, armY);
    ctx.rotate(chopAngle);
    drawPixelRect(ctx, 0, -2, 8, 4, '#334155');
    // Axe
    drawPixelRect(ctx, 6, -16, 3, 20, '#5e3e29');
    drawPixelRect(ctx, 3, -18, 9, 6, '#94a3b8');
    drawPixelRect(ctx, 8, -19, 3, 8, '#e2e8f0'); // Blade edge
    ctx.restore();
  } else {
    // Idle / Moving Torch hold
    ctx.save();
    ctx.translate(4, armY);
    // Arm
    drawPixelRect(ctx, 0, -2, 6, 4, '#334155');
    // Torch Shaft
    drawPixelRect(ctx, 4, -14, 3, 16, '#5e3e29');
    drawPixelRect(ctx, 3, -16, 5, 4, '#1e2430');

    // Torch Flame
    if (player.torchFuel > 0) {
      const flameHeight = Math.max(3, (player.torchFuel / player.maxTorchFuel) * 8);
      const flicker = Math.sin(now * 0.015) * 1.5;
      drawPixelRect(ctx, 2, -18 - flameHeight + flicker, 7, flameHeight + 2, '#ea580c');
      drawPixelRect(ctx, 3, -19 - flameHeight + flicker, 5, flameHeight, '#f59e0b');
      drawPixelRect(ctx, 4, -20 - flameHeight + flicker, 3, flameHeight * 0.7, '#fef08a');
    } else {
      // Dying ember smoke wisps
      drawPixelRect(ctx, 3, -17, 4, 3, '#78350f');
      drawPixelRect(ctx, 4, -20 + Math.sin(now * 0.01) * 2, 2, 2, '#475569');
    }
    ctx.restore();
  }

  ctx.restore();
}

// Directional Attack Slash Effect (Projects directly towards the Mouse Aim Direction)
export function renderAttackSlash(
  ctx: CanvasRenderingContext2D,
  player: Player,
  camX: number,
  camY: number,
  now: number
) {
  if (!player.isAttacking) return;

  const sx = player.x - camX;
  const sy = player.y - camY;
  const progress = player.attackProgress; // 0 -> 1
  const attackAngle = player.attackAngle;

  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(attackAngle);

  // Expanding slash radius
  const slashRadius = 26 + progress * 26;
  const alpha = Math.max(0, 1 - progress * 1.1);

  // Sweep angle range from -0.8 to +0.8 radians centered on mouse angle
  const startAngle = -0.85 + progress * 0.25;
  const endAngle = 0.85;

  const hasTorch = player.torchFuel > 0;

  // 1. Fiery / Steel Outer Slash Glow
  ctx.strokeStyle = hasTorch
    ? `rgba(234, 88, 12, ${alpha * 0.5})`
    : `rgba(100, 116, 139, ${alpha * 0.4})`;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.arc(0, 0, slashRadius + 4, startAngle, endAngle, false);
  ctx.stroke();

  // 2. Main Sharp Crescent Slash Arc
  ctx.strokeStyle = hasTorch
    ? `rgba(245, 158, 11, ${alpha * 0.9})`
    : `rgba(203, 213, 225, ${alpha * 0.85})`;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, slashRadius, startAngle, endAngle, false);
  ctx.stroke();

  // 3. Hot Core Blade Light (Golden white / Pure white)
  ctx.strokeStyle = hasTorch
    ? `rgba(254, 240, 138, ${alpha})`
    : `rgba(255, 255, 255, ${alpha * 0.95})`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, slashRadius - 2, startAngle + 0.1, endAngle - 0.1, false);
  ctx.stroke();

  // 4. Directional Spark Pixels along the crescent edge pointing at mouse
  const sparkSteps = 4;
  for (let i = 0; i < sparkSteps; i++) {
    const stepAngle = startAngle + (endAngle - startAngle) * (i / (sparkSteps - 1));
    const sparkDist = slashRadius + (Math.sin(now * 0.05 + i) * 3);
    const px = Math.cos(stepAngle) * sparkDist;
    const py = Math.sin(stepAngle) * sparkDist;

    drawPixelRect(
      ctx,
      px - 2,
      py - 2,
      3,
      3,
      hasTorch ? (i % 2 === 0 ? '#fef08a' : '#f59e0b') : '#e2e8f0'
    );
  }

  // 5. Forward slash tip trail towards cursor
  const tipX = Math.cos(0) * (slashRadius + 6);
  const tipY = Math.sin(0) * (slashRadius + 6);
  drawPixelRect(ctx, tipX, tipY - 2, 4, 4, hasTorch ? '#fde047' : '#ffffff');

  ctx.restore();
}

// Draw the Central Campfire (A Fogueira)
export function renderCampfire(
  ctx: CanvasRenderingContext2D,
  campfire: Campfire,
  camX: number,
  camY: number,
  now: number
) {
  const sx = campfire.x - camX;
  const sy = campfire.y - camY;

  ctx.save();
  ctx.translate(sx, sy);

  // Stack of burning logs
  // Cross logs base
  drawPixelRect(ctx, -22, -4, 44, 8, '#2b1a10');
  drawPixelRect(ctx, -18, -10, 36, 7, '#3d2516');
  drawPixelRect(ctx, -12, -15, 24, 6, '#52331f');
  // Glowing burning embers in logs
  drawPixelRect(ctx, -14, -7, 28, 4, '#b45309');
  drawPixelRect(ctx, -8, -6, 16, 3, '#f59e0b');
  drawPixelRect(ctx, -4, -5, 8, 2, '#fef08a');

  // Multi-layered animated flames (height scales with fuel)
  if (campfire.fuel > 0 && !campfire.isExtinguished) {
    const fuelRatio = Math.min(1.2, campfire.fuel / 100);
    const flameH = 20 + fuelRatio * 45;
    const flameW = 16 + fuelRatio * 24;

    const flickerA = Math.sin(now * 0.018) * 3;
    const flickerB = Math.cos(now * 0.024 + 1) * 4;

    // Layer 1: Dark Red / Orange outer flame
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(-flameW * 0.6, -6);
    ctx.quadraticCurveTo(-flameW * 0.4 + flickerA, -flameH * 0.6, 0 + flickerB, -flameH - 6);
    ctx.quadraticCurveTo(flameW * 0.4 - flickerA, -flameH * 0.6, flameW * 0.6, -6);
    ctx.closePath();
    ctx.fill();

    // Layer 2: Radiant Orange-Amber Mid flame
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(-flameW * 0.45, -6);
    ctx.quadraticCurveTo(-flameW * 0.3 - flickerB, -flameH * 0.5, 0 + flickerA, -flameH * 0.85 - 4);
    ctx.quadraticCurveTo(flameW * 0.3 + flickerB, -flameH * 0.5, flameW * 0.45, -6);
    ctx.closePath();
    ctx.fill();

    // Layer 3: Brilliant Yellow Core
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(-flameW * 0.3, -6);
    ctx.quadraticCurveTo(-flameW * 0.2 + flickerA, -flameH * 0.35, 0 - flickerB * 0.5, -flameH * 0.65);
    ctx.quadraticCurveTo(flameW * 0.2 - flickerA, -flameH * 0.35, flameW * 0.3, -6);
    ctx.closePath();
    ctx.fill();

    // Layer 4: White-Hot Center
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-flameW * 0.15, -6);
    ctx.quadraticCurveTo(0, -flameH * 0.25, 0 + flickerA * 0.3, -flameH * 0.4);
    ctx.quadraticCurveTo(0, -flameH * 0.25, flameW * 0.15, -6);
    ctx.closePath();
    ctx.fill();
  } else {
    // Extinguished ash pile
    drawPixelRect(ctx, -14, -8, 28, 6, '#18181b');
    drawPixelRect(ctx, -8, -12, 16, 4, '#27272a');
    // Cold smoke wisps
    drawPixelRect(ctx, -2, -18 + Math.sin(now * 0.005) * 4, 4, 8, '#3f3f46');
  }

  ctx.restore();
}

// Draw Trees & Stumps
export function renderTree(
  ctx: CanvasRenderingContext2D,
  tree: TreeObject,
  camX: number,
  camY: number,
  now: number = performance.now()
) {
  const sx = tree.x - camX;
  const sy = tree.y - camY;

  ctx.save();
  ctx.translate(sx, sy);

  if (tree.shakeTime > 0) {
    const shake = Math.sin(tree.shakeTime * 20) * 3;
    ctx.translate(shake, 0);
  }

  const isAncient = tree.type === 'ancient';

  if (tree.isChopped) {
    // Stump
    ctx.fillStyle = isAncient ? 'rgba(245, 158, 11, 0.2)' : 'rgba(2, 4, 8, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 4, isAncient ? 18 : 14, isAncient ? 8 : 6, 0, 0, Math.PI * 2);
    ctx.fill();

    if (isAncient) {
      // Ancient Stump with glowing runes
      drawPixelRect(ctx, -13, -8, 26, 13, '#26150a');
      drawPixelRect(ctx, -11, -12, 22, 8, '#3d2110');
      drawPixelRect(ctx, -9, -14, 18, 6, '#b45309'); // Amber outer rings
      drawPixelRect(ctx, -6, -13, 12, 4, '#fbbf24'); // Golden glowing core
      drawPixelRect(ctx, -2, -12, 4, 2, '#451a03');
    } else {
      drawPixelRect(ctx, -10, -6, 20, 10, '#362214');
      drawPixelRect(ctx, -8, -10, 16, 6, '#4a301d');
      drawPixelRect(ctx, -6, -11, 12, 4, '#785333'); // Growth rings
      drawPixelRect(ctx, -2, -10, 4, 2, '#362214');
    }
  } else {
    // Standing Tree
    if (isAncient) {
      // --- ANCIENT RUNIC TREE (Majestic, deeply rooted trunk, boughs, runes, and lush connected foliage) ---
      // Mystic aura
      const pulse = Math.sin(now * 0.003) * 0.04;
      ctx.fillStyle = `rgba(245, 158, 11, ${0.1 + pulse})`;
      ctx.beginPath();
      ctx.ellipse(0, -45, 45, 75, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ground Shadow
      ctx.fillStyle = 'rgba(2, 4, 8, 0.7)';
      ctx.beginPath();
      ctx.ellipse(0, 12, 32, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // 1. Ancient Deep Roots spreading on ground
      drawPixelRect(ctx, -18, 6, 8, 6, '#180c04');
      drawPixelRect(ctx, 10, 6, 8, 6, '#180c04');
      drawPixelRect(ctx, -14, 2, 6, 6, '#281307');
      drawPixelRect(ctx, 8, 2, 6, 6, '#281307');

      // 2. Thick Ancient Trunk extending all the way up through canopy core (y: +10 down to -75)
      drawPixelRect(ctx, -10, -75, 20, 85, '#180c04'); // Base dark core
      drawPixelRect(ctx, -8, -72, 16, 80, '#2b1408');  // Mid wood
      drawPixelRect(ctx, -4, -68, 8, 74, '#451e0b');   // Wood grain highlight
      drawPixelRect(ctx, -1, -64, 3, 68, '#6a3314');   // Bright bark ridge

      // 3. Structural Heavy Boughs / Branches reaching into the canopy
      // Lower Left Branch
      drawPixelRect(ctx, -22, -26, 14, 6, '#180c04');
      drawPixelRect(ctx, -20, -28, 10, 4, '#2b1408');
      // Lower Right Branch
      drawPixelRect(ctx, 8, -32, 16, 6, '#180c04');
      drawPixelRect(ctx, 10, -34, 12, 4, '#2b1408');
      // Mid Left Branch
      drawPixelRect(ctx, -18, -48, 12, 5, '#180c04');
      drawPixelRect(ctx, -16, -50, 8, 3, '#2b1408');
      // Mid Right Branch
      drawPixelRect(ctx, 6, -56, 14, 5, '#180c04');
      drawPixelRect(ctx, 8, -58, 10, 3, '#2b1408');

      // 4. Glowing Ancient Runic Inscriptions on Trunk & Branches
      const runeAlpha = 0.65 + Math.sin(now * 0.004 + tree.x * 0.1) * 0.35;
      const runeBright = 0.5 + Math.cos(now * 0.005 + tree.y * 0.1) * 0.4;
      ctx.fillStyle = `rgba(251, 191, 36, ${runeAlpha})`;

      // Rune glyphs along lower and mid trunk
      drawPixelRect(ctx, -5, -8, 3, 8, '#f59e0b');
      drawPixelRect(ctx, -5, -4, 6, 2, '#fde047');
      drawPixelRect(ctx, 2, 0, 3, 7, '#d97706');

      drawPixelRect(ctx, -4, -24, 2, 9, '#f59e0b');
      drawPixelRect(ctx, -4, -20, 6, 2, '#fef08a');
      drawPixelRect(ctx, 1, -18, 3, 6, '#fbbf24');

      drawPixelRect(ctx, -3, -42, 2, 8, '#f59e0b');
      drawPixelRect(ctx, -3, -38, 5, 2, '#fde047');
      drawPixelRect(ctx, 0, -36, 3, 6, '#d97706');

      // Rune on branch
      drawPixelRect(ctx, 10, -32, 4, 2, '#f59e0b');
      drawPixelRect(ctx, -16, -26, 4, 2, '#fbbf24');

      // 5. Ancient Canopy Tiers (Seamlessly envelops trunk and branches without gaps)
      const ancientTiers = [
        { y: -16, w: 68, h: 32, color: '#301502', mid: '#652b09', tip: '#d97706' },
        { y: -38, w: 58, h: 30, color: '#3d1a03', mid: '#7c360b', tip: '#f59e0b' },
        { y: -58, w: 46, h: 28, color: '#2b1202', mid: '#9a430d', tip: '#fbbf24' },
        { y: -76, w: 34, h: 24, color: '#381703', mid: '#b45309', tip: '#fde047' },
        { y: -92, w: 20, h: 20, color: '#451a03', mid: '#d97706', tip: '#fef08a' },
      ];

      ancientTiers.forEach((tier) => {
        // Base dark amber-brown foliage mass
        ctx.fillStyle = tier.color;
        ctx.beginPath();
        ctx.moveTo(-tier.w / 2, tier.y);
        ctx.lineTo(0, tier.y - tier.h);
        ctx.lineTo(tier.w / 2, tier.y);
        ctx.closePath();
        ctx.fill();

        // Mid warm amber layer
        ctx.fillStyle = tier.mid;
        ctx.beginPath();
        ctx.moveTo(-tier.w * 0.38, tier.y - 2);
        ctx.lineTo(0, tier.y - tier.h + 3);
        ctx.lineTo(tier.w * 0.38, tier.y - 2);
        ctx.closePath();
        ctx.fill();

        // Inner glowing golden highlights
        ctx.fillStyle = tier.tip;
        ctx.beginPath();
        ctx.moveTo(-tier.w * 0.18, tier.y - 4);
        ctx.lineTo(0, tier.y - tier.h + 6);
        ctx.lineTo(tier.w * 0.18, tier.y - 4);
        ctx.closePath();
        ctx.fill();

        // Foliage tips and magical golden runes on branch edges
        drawPixelRect(ctx, -tier.w / 2, tier.y - 3, 7, 4, tier.tip);
        drawPixelRect(ctx, tier.w / 2 - 7, tier.y - 3, 7, 4, tier.tip);
        drawPixelRect(ctx, -3, tier.y - tier.h, 6, 4, '#fef08a');
      });

      // 6. Hanging Golden Runic Moss Tendrils
      const tendrilGlow = `rgba(251, 191, 36, ${0.4 + runeBright * 0.4})`;
      ctx.fillStyle = tendrilGlow;
      drawPixelRect(ctx, -24, -14, 2, 7, '#d97706');
      drawPixelRect(ctx, -24, -9, 2, 4, '#f59e0b');
      drawPixelRect(ctx, 22, -14, 2, 8, '#d97706');
      drawPixelRect(ctx, 22, -8, 2, 5, '#fbbf24');
      drawPixelRect(ctx, -16, -36, 2, 6, '#f59e0b');
      drawPixelRect(ctx, 16, -36, 2, 6, '#f59e0b');

      // Health bar if damaged (Ancient golden style)
      if (tree.health < tree.maxHealth) {
        const barW = 36;
        const pct = tree.health / tree.maxHealth;
        drawPixelRect(ctx, -barW / 2, 16, barW, 5, '#451a03');
        drawPixelRect(ctx, -barW / 2 + 1, 17, (barW - 2) * pct, 3, '#f59e0b');
      }
    } else {
      // --- NORMAL TREE (Nordic Pine) ---
      // Trunk shadow
      ctx.fillStyle = 'rgba(2, 4, 8, 0.6)';
      ctx.beginPath();
      ctx.ellipse(0, 10, 22, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Trunk
      drawPixelRect(ctx, -7, -22, 14, 32, '#21150c');
      drawPixelRect(ctx, -5, -20, 10, 28, '#362214');
      drawPixelRect(ctx, -2, -18, 4, 24, '#4a301d'); // Highlight

      // Canopy tiers (Dark moody pine needles with snow rim)
      const tiers = [
        { y: -30, w: 52, h: 26 },
        { y: -50, w: 44, h: 24 },
        { y: -68, w: 34, h: 22 },
        { y: -84, w: 22, h: 20 },
        { y: -96, w: 10, h: 14 },
      ];

      tiers.forEach((tier) => {
        // Base dark pine
        ctx.fillStyle = '#0f1f1d';
        ctx.beginPath();
        ctx.moveTo(-tier.w / 2, tier.y);
        ctx.lineTo(0, tier.y - tier.h);
        ctx.lineTo(tier.w / 2, tier.y);
        ctx.closePath();
        ctx.fill();

        // Mid highlight
        ctx.fillStyle = '#1b3330';
        ctx.beginPath();
        ctx.moveTo(-tier.w * 0.35, tier.y - 1);
        ctx.lineTo(0, tier.y - tier.h + 2);
        ctx.lineTo(tier.w * 0.35, tier.y - 1);
        ctx.closePath();
        ctx.fill();

        // Frost / Snow tips on branches
        ctx.fillStyle = '#425866';
        drawPixelRect(ctx, -tier.w / 2, tier.y - 2, 6, 3, '#425866');
        drawPixelRect(ctx, tier.w / 2 - 6, tier.y - 2, 6, 3, '#425866');
        drawPixelRect(ctx, -2, tier.y - tier.h, 4, 3, '#627d91');
      });

      // Health bar if damaged
      if (tree.health < tree.maxHealth) {
        const barW = 28;
        const pct = tree.health / tree.maxHealth;
        drawPixelRect(ctx, -barW / 2, 16, barW, 4, '#1c1917');
        drawPixelRect(ctx, -barW / 2 + 1, 17, (barW - 2) * pct, 2, '#84cc16');
      }
    }
  }

  ctx.restore();
}

// Draw Wood Logs & Collectible Drops
export function renderWoodDrop(
  ctx: CanvasRenderingContext2D,
  drop: WoodDrop,
  camX: number,
  camY: number,
  now: number
) {
  const sx = drop.x - camX;
  const sy = drop.y - camY + Math.sin(now * 0.006 + drop.bobbingOffset) * 3;

  ctx.save();
  ctx.translate(sx, sy);

  // Glow if special ancient wood
  if (drop.isSpecial) {
    ctx.fillStyle = 'rgba(251, 191, 36, 0.35)';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
  }

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(0, 8, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pixel Wood Log
  const barkColor = drop.isSpecial ? '#78350f' : '#3f2818';
  const innerColor = drop.isSpecial ? '#f59e0b' : '#6b4629';
  const ringColor = drop.isSpecial ? '#fef08a' : '#a37042';

  drawPixelRect(ctx, -10, -4, 20, 8, barkColor);
  drawPixelRect(ctx, -9, -3, 18, 6, innerColor);
  // Cut end face
  drawPixelRect(ctx, 7, -4, 4, 8, ringColor);
  drawPixelRect(ctx, 8, -2, 2, 4, barkColor);

  ctx.restore();
}

// Draw Soul Embers (Floating upgrades currency)
export function renderSoulEmber(
  ctx: CanvasRenderingContext2D,
  ember: SoulEmber,
  camX: number,
  camY: number,
  now: number
) {
  const sx = ember.x - camX;
  const sy = ember.y - camY + Math.sin(now * 0.008 + ember.bobbingOffset) * 4;

  ctx.save();
  ctx.translate(sx, sy);

  // Outer aura
  const pulse = Math.sin(now * 0.01) * 3;
  ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
  ctx.beginPath();
  ctx.arc(0, 0, 12 + pulse, 0, Math.PI * 2);
  ctx.fill();

  // Core Diamond
  drawPixelRect(ctx, -4, -4, 8, 8, '#ea580c');
  drawPixelRect(ctx, -3, -3, 6, 6, '#f59e0b');
  drawPixelRect(ctx, -1, -1, 3, 3, '#fef08a');

  ctx.restore();
}

// Draw Shadow Monsters
export function renderEnemy(
  ctx: CanvasRenderingContext2D,
  enemy: Enemy,
  camX: number,
  camY: number,
  now: number
) {
  const sx = enemy.x - camX;
  const sy = enemy.y - camY;

  ctx.save();
  ctx.translate(sx, sy);

  // Damage Flash
  if (enemy.damageFlash > 0) {
    ctx.filter = 'brightness(2.5) contrast(1.5)';
  }

  // Monster Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.beginPath();
  ctx.ellipse(0, enemy.radius * 0.8, enemy.radius, enemy.radius * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  const isFlipped = enemy.targetPos.x < enemy.x;
  if (isFlipped) {
    ctx.scale(-1, 1);
  }

  const animBob = Math.sin(now * 0.012 + enemy.animFrame) * 3;

  if (enemy.type === 'stalker') {
    // Sombra Rastejante: Beast-like shadow stalker
    // Body tendrils
    ctx.fillStyle = '#0a0914';
    drawPixelRect(ctx, -16, -10 + animBob, 32, 16, '#0f0e1c');
    drawPixelRect(ctx, -14, -8 + animBob, 28, 12, '#18172b');

    // Hunched spine
    drawPixelRect(ctx, -12, -16 + animBob, 20, 8, '#24223d');

    // Claws / Legs
    drawPixelRect(ctx, -14, 4 + animBob, 5, 8, '#08070f');
    drawPixelRect(ctx, 9, 4 + animBob, 5, 8, '#08070f');

    // Glowing menacing crimson/purple eyes
    drawPixelRect(ctx, 6, -11 + animBob, 4, 3, '#dc2626');
    drawPixelRect(ctx, 11, -11 + animBob, 3, 3, '#ef4444');
    drawPixelRect(ctx, 7, -10 + animBob, 2, 1, '#fecaca');

    // Wispy dark aura
    drawPixelRect(ctx, -18, -14 + Math.sin(now * 0.02) * 3, 4, 8, '#312e81');
  } else if (enemy.type === 'devourer') {
    // Devorador de Chamas: Hulking rock/shadow golem
    // Bulky body
    drawPixelRect(ctx, -20, -28 + animBob, 40, 34, '#090812');
    drawPixelRect(ctx, -17, -25 + animBob, 34, 28, '#141224');
    drawPixelRect(ctx, -13, -22 + animBob, 26, 22, '#201d38');

    // Stone shoulder plates
    drawPixelRect(ctx, -24, -26 + animBob, 10, 14, '#2d294d');
    drawPixelRect(ctx, 14, -26 + animBob, 10, 14, '#2d294d');

    // Glowing void runes in chest
    drawPixelRect(ctx, -6, -14 + animBob, 12, 10, '#4c1d95');
    drawPixelRect(ctx, -4, -12 + animBob, 8, 6, '#7c3aed');
    drawPixelRect(ctx, -2, -10 + animBob, 4, 3, '#c084fc');

    // Glowing Horns/Eyes
    drawPixelRect(ctx, 4, -24 + animBob, 6, 4, '#8b5cf6');
    drawPixelRect(ctx, 11, -24 + animBob, 5, 4, '#a855f7');
    drawPixelRect(ctx, 6, -23 + animBob, 2, 2, '#f3e8ff');
  } else if (enemy.type === 'wraith') {
    // Espectro Nebuloso: Floating spectral phantom
    const floatY = -18 + Math.sin(now * 0.008) * 6;

    // Spectral Hood & Cloak
    drawPixelRect(ctx, -12, floatY, 24, 28, '#0b131f');
    drawPixelRect(ctx, -9, floatY + 3, 18, 24, '#15253b');
    drawPixelRect(ctx, -6, floatY + 6, 12, 18, '#1e3a5f');

    // Trailing mist tails
    const mistWave = Math.sin(now * 0.015) * 4;
    drawPixelRect(ctx, -10 + mistWave, floatY + 26, 6, 8, '#0c1e33');
    drawPixelRect(ctx, 4 - mistWave, floatY + 26, 6, 10, '#0c1e33');

    // Piercing Cyan Spectral Eyes
    drawPixelRect(ctx, 2, floatY + 8, 4, 3, '#06b6d4');
    drawPixelRect(ctx, 7, floatY + 8, 4, 3, '#22d3ee');
    drawPixelRect(ctx, 4, floatY + 9, 2, 1, '#cffafe');
  }

  // Health Bar
  if (enemy.hp < enemy.maxHp) {
    const barW = enemy.radius * 1.8;
    const hpPct = enemy.hp / enemy.maxHp;
    drawPixelRect(ctx, -barW / 2, -enemy.radius - 12, barW, 4, '#18181b');
    drawPixelRect(ctx, -barW / 2 + 1, -enemy.radius - 11, (barW - 2) * hpPct, 2, '#ef4444');
  }

  ctx.restore();
}

// Dedicated Offscreen Lightmap Canvas to prevent destination-out erasing game sprites
let lightCanvas: HTMLCanvasElement | null = null;
let lightCtx: CanvasRenderingContext2D | null = null;

function getLightmapContext(width: number, height: number): CanvasRenderingContext2D | null {
  if (!lightCanvas) {
    lightCanvas = document.createElement('canvas');
  }
  if (lightCanvas.width !== width || lightCanvas.height !== height) {
    lightCanvas.width = width;
    lightCanvas.height = height;
    lightCtx = lightCanvas.getContext('2d');
  }
  if (!lightCtx) {
    lightCtx = lightCanvas.getContext('2d');
  }
  return lightCtx;
}

// Dynamic 2D Lighting & Fog of War System using dedicated Lightmap
export function renderLightingMask(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  player: Player,
  campfire: Campfire,
  camX: number,
  camY: number,
  now: number,
  disableDarknessMask: boolean = false
) {
  const fireScreenX = campfire.x - camX;
  const fireScreenY = campfire.y - camY;
  const playerScreenX = player.x - camX;
  const playerScreenY = player.y - camY;

  // 1. Draw Darkness Mask (Only if darkness is not toggled off for testing)
  if (!disableDarknessMask) {
    const lCtx = getLightmapContext(width, height);
    if (lCtx && lightCanvas) {
      // Clear lightmap
      lCtx.globalCompositeOperation = 'source-over';
      lCtx.clearRect(0, 0, width, height);

      // Fill with dark ambient atmosphere
      const ambientAlpha = 0.92;
      lCtx.fillStyle = `rgba(3, 6, 12, ${ambientAlpha})`;
      lCtx.fillRect(0, 0, width, height);

      // Cut light holes using destination-out
      lCtx.globalCompositeOperation = 'destination-out';

      // 1A. Campfire Light Hole
      if (campfire.fuel > 0 && !campfire.isExtinguished) {
        const fireRadius = campfire.currentRadius * 0.95;
        const fireFlicker = Math.sin(now * 0.015) * 5 + Math.cos(now * 0.02) * 3;
        const r = Math.max(35, fireRadius + fireFlicker);

        const grad = lCtx.createRadialGradient(
          fireScreenX,
          fireScreenY,
          r * 0.15,
          fireScreenX,
          fireScreenY,
          r
        );
        grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
        grad.addColorStop(0.45, 'rgba(0, 0, 0, 0.95)');
        grad.addColorStop(0.72, 'rgba(0, 0, 0, 0.65)');
        grad.addColorStop(0.9, 'rgba(0, 0, 0, 0.2)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        lCtx.fillStyle = grad;
        lCtx.beginPath();
        lCtx.arc(fireScreenX, fireScreenY, r, 0, Math.PI * 2);
        lCtx.fill();
      }

      // 1B. Player Torch Light Hole (Focused, dynamic survival radius that shrinks dramatically)
      if (player.torchFuel > 0) {
        const torchRatio = Math.max(0, Math.min(1, player.torchFuel / player.maxTorchFuel));
        // Raio varia de 24px (quase apagada) até 220px (totalmente acesa) com curva expressiva
        const baseTorchRadius = 24 + Math.pow(torchRatio, 1.25) * 196;
        const flickerMag = 2 + (1 - torchRatio) * 6;
        const torchFlicker = Math.sin(now * 0.028) * flickerMag + Math.cos(now * 0.042) * (flickerMag * 0.5);
        const tr = Math.max(18, baseTorchRadius + torchFlicker);

        const torchGrad = lCtx.createRadialGradient(
          playerScreenX,
          playerScreenY,
          tr * 0.05,
          playerScreenX,
          playerScreenY,
          tr
        );
        const innerAlpha = 0.85 + torchRatio * 0.15;
        torchGrad.addColorStop(0, `rgba(0, 0, 0, ${innerAlpha})`);
        torchGrad.addColorStop(0.35, `rgba(0, 0, 0, ${0.75 * innerAlpha})`);
        torchGrad.addColorStop(0.68, `rgba(0, 0, 0, ${0.5 * torchRatio})`);
        torchGrad.addColorStop(0.9, `rgba(0, 0, 0, ${0.15 * torchRatio})`);
        torchGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        lCtx.fillStyle = torchGrad;
        lCtx.beginPath();
        lCtx.arc(playerScreenX, playerScreenY, tr, 0, Math.PI * 2);
        lCtx.fill();
      } else {
        const silhouetteRadius = 24 + Math.sin(now * 0.01) * 2;
        const deadGrad = lCtx.createRadialGradient(
          playerScreenX,
          playerScreenY,
          0,
          playerScreenX,
          playerScreenY,
          silhouetteRadius
        );
        deadGrad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
        deadGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.35)');
        deadGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        lCtx.fillStyle = deadGrad;
        lCtx.beginPath();
        lCtx.arc(playerScreenX, playerScreenY, silhouetteRadius, 0, Math.PI * 2);
        lCtx.fill();
      }

      // Draw lightmap onto main canvas cleanly
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(lightCanvas, 0, 0);
      ctx.restore();
    }
  }

  // 2. Add Warm Golden Glow on top of lit areas (Screen blend mode)
  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  // Fire warm amber tint
  if (campfire.fuel > 0 && !campfire.isExtinguished) {
    const fireRadius = campfire.currentRadius * 0.75;
    const warmGrad = ctx.createRadialGradient(
      fireScreenX,
      fireScreenY,
      0,
      fireScreenX,
      fireScreenY,
      fireRadius
    );
    warmGrad.addColorStop(0, 'rgba(255, 170, 70, 0.35)');
    warmGrad.addColorStop(0.5, 'rgba(234, 88, 12, 0.14)');
    warmGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = warmGrad;
    ctx.beginPath();
    ctx.arc(fireScreenX, fireScreenY, fireRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Torch warm tint
  if (player.torchFuel > 0) {
    const torchRatio = Math.max(0, Math.min(1, player.torchFuel / player.maxTorchFuel));
    const torchRadius = (24 + Math.pow(torchRatio, 1.25) * 196) * 0.75;
    const warmAlpha = 0.08 + torchRatio * 0.22;
    const torchWarmGrad = ctx.createRadialGradient(
      playerScreenX,
      playerScreenY,
      0,
      playerScreenX,
      playerScreenY,
      torchRadius
    );
    torchWarmGrad.addColorStop(0, `rgba(255, 205, 110, ${warmAlpha})`);
    torchWarmGrad.addColorStop(0.55, `rgba(245, 158, 11, ${warmAlpha * 0.45})`);
    torchWarmGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = torchWarmGrad;
    ctx.beginPath();
    ctx.arc(playerScreenX, playerScreenY, torchRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
