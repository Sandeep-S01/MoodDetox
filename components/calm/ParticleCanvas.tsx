'use client';

import { useEffect, useRef } from 'react';

const PARTICLE_COLORS = ['#14b8a6', '#0ea5e9', '#6366f1'];
const POINTER_RESET = -1000;

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseX: number;
  baseY: number;
  baseSize: number;
  currentSize: number;
  color: string;
  baseAlpha: number;
  currentAlpha: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.baseX = x;
    this.baseY = y;
    this.vx = 0;
    this.vy = 0;
    this.baseSize = Math.random() * 2 + 1;
    this.currentSize = this.baseSize;
    this.color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
    this.baseAlpha = 0.3;
    this.currentAlpha = this.baseAlpha;
  }

  update(mouseX: number, mouseY: number) {
    const dx = mouseX - this.x;
    const dy = mouseY - this.y;
    const distanceSq = dx * dx + dy * dy;
    const maxDistance = 150;
    const maxDistanceSq = maxDistance * maxDistance;
    
    // Default targets
    let targetSize = this.baseSize;
    let targetAlpha = this.baseAlpha;

    if (distanceSq < maxDistanceSq) {
      const distance = Math.sqrt(distanceSq) || 1;
      const force = (maxDistance - distance) / maxDistance;
      
      // Movement force
      this.vx -= (dx / distance) * force * 0.5;
      this.vy -= (dy / distance) * force * 0.5;

      // Visual force (closer = larger, brighter)
      targetSize = this.baseSize + force * 4; // Max increase of 4px
      targetAlpha = this.baseAlpha + force * 0.7; // Max increase to 1.0
    }

    // Smoothly transition size and alpha
    this.currentSize += (targetSize - this.currentSize) * 0.1;
    this.currentAlpha += (targetAlpha - this.currentAlpha) * 0.1;

    // Return to base
    this.x += (this.baseX - this.x) * 0.05;
    this.y += (this.baseY - this.y) * 0.05;

    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;

    // Friction
    this.vx *= 0.9;
    this.vy *= 0.9;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.currentSize, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = Math.min(1, Math.max(0, this.currentAlpha));
    ctx.fill();
  }
}

export function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    let animationFrameId: number;
    let resizeFrameId = 0;
    let mouseX = POINTER_RESET;
    let mouseY = POINTER_RESET;

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      particles = [];
      const spacing = window.matchMedia('(pointer: coarse)').matches ? 24 : 20;
      const cols = Math.floor(canvas.width / spacing);
      const rows = Math.floor(canvas.height / spacing);

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          // Add some randomness to initial positions
          const x = i * spacing + (Math.random() * 10 - 5);
          const y = j * spacing + (Math.random() * 10 - 5);
          particles.push(new Particle(x, y));
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i += 1) {
        const particle = particles[i];
        particle.update(mouseX, mouseY);
        particle.draw(ctx);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (e instanceof MouseEvent) {
        mouseX = e.clientX;
        mouseY = e.clientY;
      } else if (e.touches.length > 0) {
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
      }
    };

    const handleMouseLeave = () => {
      mouseX = POINTER_RESET;
      mouseY = POINTER_RESET;
    };

    const handleResize = () => {
      cancelAnimationFrame(resizeFrameId);
      resizeFrameId = requestAnimationFrame(init);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchend', handleMouseLeave);

    init();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchend', handleMouseLeave);
      cancelAnimationFrame(resizeFrameId);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full touch-none"
    />
  );
}
