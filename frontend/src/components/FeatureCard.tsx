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

function getStatusBadgeClass(status?: string): string {
  if (status === 'Live') return 'badge-success';
  if (status === 'Coming Soon') return 'badge-warning';
  return 'badge-primary';
}

export function FeatureCard({ title, description, emoji, status }: FeatureCardProps) {
  const statusBadgeClass = getStatusBadgeClass(status);

  return (
    <div className="card p-8 group relative overflow-hidden">
      <div className="flex items-start justify-between mb-6">
        <div className="text-5xl transition-transform group-hover:scale-110" aria-hidden="true">
          {emoji}
        </div>
        {status && (
          <span
            className={`badge ${statusBadgeClass}`}
            aria-label={`Feature status: ${status}`}
          >
            {status}
          </span>
        )}
      </div>
      <h3 className="text-xl font-bold text-display mb-3">
        {title}
      </h3>
      <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}

export default FeatureCard;


