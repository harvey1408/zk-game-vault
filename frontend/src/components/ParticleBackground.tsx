'use client';

import { useEffect, useMemo, useRef } from 'react';

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      opacity: number;
    }> = [];

    const colors = ['#48cae4', '#6a4c93', '#90e0ef'];
    const particleCount = prefersReducedMotion ? 25 : 50;

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: Math.random() * 0.5 + 0.2,
      });
    }

    let animationId: number;
    let lastTime = 0;
    const targetFps = prefersReducedMotion ? 30 : 60;
    const frameInterval = 1000 / targetFps;

    function animate(timestamp: number) {
      if (!ctx || !canvas) return;

      // Throttle to target FPS
      if (timestamp - lastTime < frameInterval) {
        animationId = requestAnimationFrame(animate);
        return;
      }
      lastTime = timestamp;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.opacity;
        ctx.fill();

        // Draw glow
        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.size * 4
        );
        gradient.addColorStop(0, particle.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.globalAlpha = particle.opacity * 0.5;
        ctx.fill();
      });

      // Draw connections
      ctx.globalAlpha = 0.15;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = particles[i].color;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(animate);
    }

    animationId = requestAnimationFrame(animate);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 0.35 }}
    />
  );
}
