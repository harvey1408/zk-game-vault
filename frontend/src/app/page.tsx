import Link from "next/link";
import { WalletConnect } from "@/components/WalletConnect";
import { ParticleBackground } from "@/components/ParticleBackground";
import FeatureCard from "@/components/FeatureCard";
import ScrollReveal from "@/components/ScrollReveal";

export default function Home() {
  return (
    <div className="min-h-screen bg-black relative circuit-pattern">
      {/* Particle Background */}
      <ParticleBackground />

      {/* Circuit Background Pattern */}
      <div className="fixed inset-0 circuit-bg pointer-events-none z-0" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="holographic-border border-b backdrop-void">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-5 flex justify-between items-center flex-wrap gap-4">
            <h1 className="text-3xl md:text-4xl font-black text-header gradient-text-holographic animate-neon-pulse tracking-tight">
              ZKGameVault
            </h1>
            <WalletConnect />
          </div>
        </header>

        {/* Hero Section */}
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-6xl mx-auto text-center">
            <ScrollReveal>
              <h2 className="text-5xl md:text-7xl font-black text-header mb-6 gradient-text-holographic leading-tight">
                Privacy-Preserving Gaming
              </h2>
            </ScrollReveal>
            <ScrollReveal delayMs={100}>
              <p className="text-xl md:text-2xl text-[var(--text-secondary)] mb-4 font-light text-body">
                Prove your eligibility without revealing your identity
              </p>
            </ScrollReveal>
            <ScrollReveal delayMs={200}>
              <p className="text-lg md:text-xl neon-text mb-16 font-medium text-body">
                Play games with zero-knowledge proofs on Starknet
              </p>
            </ScrollReveal>

          {/* Feature Cards - Asymmetric Layout */}
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 mt-12 md:mt-20">
            <ScrollReveal>
              <FeatureCard
                title="Selective Disclosure"
                description="Verify age, location, or scores without exposing your data through advanced ZK-STARK circuits"
                emoji="🔒"
                status="In Progress"
                accent="blue"
              />
            </ScrollReveal>
            <ScrollReveal delayMs={100}>
              <FeatureCard
                title="Dojo Gaming"
                description="Portable profiles across on-chain games powered by Dojo engine with seamless state sync"
                emoji="🎮"
                status="Coming Soon"
                accent="purple"
              />
            </ScrollReveal>
            <ScrollReveal delayMs={200}>
              <FeatureCard
                title="ZK-STARK Proofs"
                description="Trustless verification powered by Starknet's native ZK proofs with sub-cent fees"
                emoji="⚡"
                status="Live"
                accent="cyan"
              />
            </ScrollReveal>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-4 md:gap-8 justify-center mt-12 md:mt-20 flex-wrap">
            <ScrollReveal>
              <Link
                href="/identity"
                className="group relative px-8 md:px-12 py-4 md:py-5 bg-[var(--cyber-blue)] hover:bg-[var(--cyber-blue)]/90 text-black font-bold rounded-xl transition-all duration-300 text-header text-base md:text-lg overflow-hidden interactive-glow"
              >
                <span className="relative z-10">Create Identity</span>
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--cyber-blue)] via-[var(--neon-cyan)] to-[var(--cyber-purple)] opacity-0 group-hover:opacity-100 animate-gradient-shift" />
              </Link>
            </ScrollReveal>
            <ScrollReveal delayMs={100}>
              <Link
                href="/games"
                className="group relative px-8 md:px-12 py-4 md:py-5 backdrop-void holographic-border hover:glow-purple text-white font-bold rounded-xl transition-all duration-300 text-header text-base md:text-lg interactive-glow"
              >
                <span className="relative z-10 gradient-text-holographic">Play Games</span>
              </Link>
            </ScrollReveal>
          </div>

          {/* Stats Section - Premium Design */}
          <div className="max-w-5xl mx-auto mt-16 md:mt-32 grid md:grid-cols-3 gap-6 md:gap-10">
            <ScrollReveal>
              <div className="holographic-card rounded-2xl p-6 md:p-8 text-center group hover:scale-105 transition-all duration-300 interactive-glow">
              <div className="text-6xl font-black text-header mb-4 gradient-text-holographic animate-neon-pulse">
                100%
              </div>
              <div className="text-[var(--text-secondary)] font-medium text-lg text-body">
                Privacy Preserved
              </div>
              <div className="mt-4 text-xs text-[var(--cyber-blue)] font-light">
                Zero data leaks guaranteed
              </div>
              </div>
            </ScrollReveal>
            <ScrollReveal delayMs={100}>
              <div className="holographic-card rounded-2xl p-6 md:p-8 text-center group hover:scale-105 transition-all duration-300 interactive-glow">
              <div className="text-6xl font-black text-header mb-4 neon-text-purple">
                0
              </div>
              <div className="text-[var(--text-secondary)] font-medium text-lg text-body">
                Data Exposed
              </div>
              <div className="mt-4 text-xs text-[var(--cyber-purple)] font-light">
                Complete anonymity
              </div>
              </div>
            </ScrollReveal>
            <ScrollReveal delayMs={200}>
              <div className="holographic-card rounded-2xl p-6 md:p-8 text-center group hover:scale-105 transition-all duration-300 interactive-glow">
              <div className="text-6xl font-black text-header mb-4 neon-text">
                ∞
              </div>
              <div className="text-[var(--text-secondary)] font-medium text-lg text-body">
                Portable Profile
              </div>
              <div className="mt-4 text-xs text-[var(--neon-cyan)] font-light">
                Cross-game identity
              </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </main>

        {/* Footer */}
        <footer className="holographic-border border-t mt-32 backdrop-void">
          <div className="container mx-auto px-4 py-10 text-center text-[var(--text-secondary)]">
            <p className="font-light text-body">Built with Cairo, Dojo, and ZK-STARKs on Starknet</p>
            <p className="mt-2 text-sm gradient-text">Starknet Resolve Hackathon 2025</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
