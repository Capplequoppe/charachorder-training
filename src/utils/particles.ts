/**
 * Particle System
 *
 * Simple canvas-based particle effects for combo celebrations.
 * All spawn functions return a cancel function to stop animations
 * and free memory when components unmount.
 */

// ==================== Types ====================

/**
 * Function to cancel an ongoing particle animation.
 * Returns true if animation was active, false if already stopped.
 */
export type CancelAnimation = () => boolean;

export interface ParticleConfig {
  count: number;
  color: string;
  origin: 'center' | 'cursor' | { x: number; y: number };
  spread?: number;       // Spread angle in radians (default: full circle)
  minSpeed?: number;     // Minimum particle speed
  maxSpeed?: number;     // Maximum particle speed
  minSize?: number;      // Minimum particle size
  maxSize?: number;      // Maximum particle size
  gravity?: number;      // Gravity effect (default: 0.1)
  fadeSpeed?: number;    // How fast particles fade (default: 1)
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

// ==================== Particle Spawning ====================

/**
 * Spawn particles on a canvas element.
 * Returns a cancel function to stop the animation early.
 */
export function spawnParticles(
  canvas: HTMLCanvasElement,
  config: ParticleConfig
): CancelAnimation {
  const context = canvas.getContext('2d');
  if (!context) return () => false;
  const ctx = context; // Assign to const for closure capture

  // Ensure canvas is properly sized
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;

  const {
    count,
    color,
    origin,
    spread = Math.PI * 2,
    minSpeed = 2,
    maxSpeed = 10,
    minSize = 3,
    maxSize = 8,
    gravity = 0.1,
    fadeSpeed = 1,
  } = config;

  // Determine origin point
  let originX: number;
  let originY: number;

  if (origin === 'center') {
    originX = canvas.width / 2;
    originY = canvas.height / 2;
  } else if (origin === 'cursor') {
    // Would need to track mouse position - default to center
    originX = canvas.width / 2;
    originY = canvas.height / 2;
  } else {
    originX = origin.x;
    originY = origin.y;
  }

  // Create particles
  const particles: Particle[] = [];
  const baseAngle = -Math.PI / 2; // Start from top

  for (let i = 0; i < count; i++) {
    const angle = baseAngle + (Math.random() - 0.5) * spread;
    const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);

    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 0.5 + Math.random() * 0.5,
      size: minSize + Math.random() * (maxSize - minSize),
      color,
    });
  }

  // Track animation frame for cancellation
  let animationId: number | null = null;
  let isCancelled = false;

  // Animation loop
  function animate() {
    if (isCancelled) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let hasActiveParticles = false;

    particles.forEach(p => {
      if (p.life <= 0) return;

      // Update position
      p.x += p.vx;
      p.y += p.vy;
      p.vy += gravity;

      // Fade out
      p.life -= (0.016 * fadeSpeed) / p.maxLife;

      if (p.life > 0) {
        hasActiveParticles = true;

        // Draw particle
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    if (hasActiveParticles && !isCancelled) {
      animationId = requestAnimationFrame(animate);
    } else {
      // Clear canvas when done
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      animationId = null;
    }
  }

  animationId = requestAnimationFrame(animate);

  // Return cancel function
  return () => {
    if (isCancelled) return false;
    isCancelled = true;
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    // Clear particle array to free memory
    particles.length = 0;
    return true;
  };
}

/**
 * Spawn confetti-style particles.
 * Returns a cancel function to stop the animation early.
 */
export function spawnConfetti(
  canvas: HTMLCanvasElement,
  count: number = 50,
  colors: string[] = ['#3498db', '#2ecc71', '#f1c40f', '#e74c3c', '#9b59b6']
): CancelAnimation {
  const context = canvas.getContext('2d');
  if (!context) return () => false;
  const ctx = context; // Assign to const for closure capture

  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;

  interface ConfettiParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotation: number;
    rotationSpeed: number;
    width: number;
    height: number;
    color: string;
    life: number;
  }

  const particles: ConfettiParticle[] = [];

  for (let i = 0; i < count; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 100,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 15,
      vy: -10 - Math.random() * 10,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      width: 8 + Math.random() * 4,
      height: 4 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
    });
  }

  // Track animation frame for cancellation
  let animationId: number | null = null;
  let isCancelled = false;

  function animate() {
    if (isCancelled) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let hasActive = false;

    particles.forEach(p => {
      if (p.life <= 0) return;

      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.3; // Gravity
      p.vx *= 0.99; // Air resistance
      p.rotation += p.rotationSpeed;
      p.life -= 0.01;

      if (p.life > 0 && p.y < canvas.height + 50) {
        hasActive = true;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = Math.min(1, p.life * 2);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        ctx.restore();
      }
    });

    if (hasActive && !isCancelled) {
      animationId = requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      animationId = null;
    }
  }

  animationId = requestAnimationFrame(animate);

  // Return cancel function
  return () => {
    if (isCancelled) return false;
    isCancelled = true;
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    // Clear particle array to free memory
    particles.length = 0;
    return true;
  };
}

/**
 * Spawn a burst of stars.
 * Returns a cancel function to stop the animation early.
 */
export function spawnStars(
  canvas: HTMLCanvasElement,
  count: number = 20,
  color: string = '#ffd700'
): CancelAnimation {
  const context = canvas.getContext('2d');
  if (!context) return () => false;
  const ctx = context; // Assign to const for closure capture

  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;

  interface StarParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    rotation: number;
    rotationSpeed: number;
    life: number;
  }

  const particles: StarParticle[] = [];
  const originX = canvas.width / 2;
  const originY = canvas.height / 2;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const speed = 3 + Math.random() * 5;

    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 10 + Math.random() * 10,
      rotation: Math.random() * Math.PI,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      life: 1,
    });
  }

  function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number) {
    const spikes = 5;
    const outerRadius = size;
    const innerRadius = size / 2;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.beginPath();

    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;

      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }

    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Track animation frame for cancellation
  let animationId: number | null = null;
  let isCancelled = false;

  function animate() {
    if (isCancelled) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let hasActive = false;

    particles.forEach(p => {
      if (p.life <= 0) return;

      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.life -= 0.02;

      if (p.life > 0) {
        hasActive = true;
        ctx.globalAlpha = p.life;
        ctx.fillStyle = color;
        drawStar(ctx, p.x, p.y, p.size * p.life, p.rotation);
      }
    });

    if (hasActive && !isCancelled) {
      animationId = requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      animationId = null;
    }
  }

  animationId = requestAnimationFrame(animate);

  // Return cancel function
  return () => {
    if (isCancelled) return false;
    isCancelled = true;
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    // Clear particle array to free memory
    particles.length = 0;
    return true;
  };
}
