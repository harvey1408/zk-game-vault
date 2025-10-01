'use client';

import React, { useEffect, useRef } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}

export function ScrollReveal({ children, className, delayMs = 0 }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              el.classList.add('reveal-in');
            }, delayMs);
          }
        });
      },
      { threshold: 0.1 }
    );

    el.classList.add('reveal-init');
    obs.observe(el);
    return () => obs.disconnect();
  }, [delayMs]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

export default ScrollReveal;


