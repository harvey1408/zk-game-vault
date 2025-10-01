'use client';

import React from 'react';

type Accent = 'blue' | 'purple' | 'cyan';

interface FeatureCardProps {
  title: string;
  description: string;
  emoji: string;
  status?: string;
  accent: Accent;
}

function getAccentBg(accent: Accent): string {
  if (accent === 'blue') return 'bg-[var(--cyber-blue)]';
  if (accent === 'purple') return 'bg-[var(--cyber-purple)]';
  return 'bg-[var(--neon-cyan)]';
}

function getStatusBorder(accent: Accent): string {
  if (accent === 'blue') return 'holographic-border';
  if (accent === 'purple') return 'cyber-border-purple';
  return 'cyber-border-cyan';
}

export function FeatureCard({ title, description, emoji, status, accent }: FeatureCardProps) {
  const accentBg = getAccentBg(accent);
  const statusBorder = getStatusBorder(accent);

  return (
    <div className="holographic-card rounded-xl p-10 interactive-glow group relative overflow-hidden">
      {status ? (
        <span
          className={`absolute top-4 left-4 z-20 px-3 py-1 text-xs font-semibold rounded-full bg-[var(--void-black-2)]/70 ${statusBorder} text-[var(--text-primary)]`}
          aria-label={`Feature status: ${status}`}
        >
          {status}
        </span>
      ) : null}
      <div className={`absolute top-0 right-0 w-32 h-32 ${accentBg} opacity-5 blur-3xl animate-cosmic-pulse`} />
      <div className="relative z-10">
        <div className="text-6xl mb-6 transition-transform group-hover:scale-110 group-hover:rotate-12" aria-hidden="true">{emoji}</div>
        <h3 className="text-2xl font-bold text-header mb-4 gradient-text-holographic">
          {title}
        </h3>
        <p className="text-[var(--text-secondary)] font-light text-body leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

export default FeatureCard;


