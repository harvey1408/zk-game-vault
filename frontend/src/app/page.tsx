import Link from "next/link";
import { WalletConnect } from "@/components/WalletConnect";
import FeatureCard from "@/components/FeatureCard";
import ScrollReveal from "@/components/ScrollReveal";

export default function Home() {
  return (
    <div className="min-h-screen bg-black relative">
      <div className="bg-gradient-radial fixed inset-0 pointer-events-none" />

      <div className="relative z-10">
        <header className="header">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-display text-gradient">
              ZKGameVault
            </h1>
            <WalletConnect />
          </div>
        </header>

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-16 md:mb-24">
                <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-display mb-6 leading-tight">
                  Privacy-Preserving Gaming<br/>
                  <span className="text-gradient">with Zero-Knowledge Proofs</span>
                </h2>
                <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
                  Prove your eligibility without revealing your identity. Play games on Starknet with complete privacy.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delayMs={100}>
              <div className="flex gap-4 justify-center mb-20 md:mb-32 flex-wrap">
                <Link href="/identity" className="btn btn-primary text-base md:text-lg px-8 py-4">
                  Create Identity
                </Link>
                <Link href="/games" className="btn btn-secondary text-base md:text-lg px-8 py-4">
                  Play Games
                </Link>
              </div>
            </ScrollReveal>

            <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-20 md:mb-32">
              <ScrollReveal>
                <FeatureCard
                  title="Selective Disclosure"
                  description="Verify age, location, or scores without exposing your data through advanced ZK-STARK circuits"
                  emoji="🔒"
                  status="Live"
                  accent="blue"
                />
              </ScrollReveal>
              <ScrollReveal delayMs={100}>
                <FeatureCard
                  title="Dojo Gaming"
                  description="Portable profiles across on-chain games powered by Dojo engine with seamless state sync"
                  emoji="🎮"
                  status="Live"
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

            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              <ScrollReveal>
                <div className="card text-center p-8">
                  <div className="text-5xl md:text-6xl font-bold text-display mb-3 text-gradient">
                    100%
                  </div>
                  <div className="text-[var(--text-secondary)] font-medium text-lg">
                    Privacy Preserved
                  </div>
                  <div className="mt-3 text-sm text-[var(--text-tertiary)]">
                    Zero data leaks guaranteed
                  </div>
                </div>
              </ScrollReveal>
              <ScrollReveal delayMs={100}>
                <div className="card text-center p-8">
                  <div className="text-5xl md:text-6xl font-bold text-display mb-3 text-gradient">
                    0
                  </div>
                  <div className="text-[var(--text-secondary)] font-medium text-lg">
                    Data Exposed
                  </div>
                  <div className="mt-3 text-sm text-[var(--text-tertiary)]">
                    Complete anonymity
                  </div>
                </div>
              </ScrollReveal>
              <ScrollReveal delayMs={200}>
                <div className="card text-center p-8">
                  <div className="text-5xl md:text-6xl font-bold text-display mb-3" style={{color: 'var(--accent-secondary)'}}>
                    ∞
                  </div>
                  <div className="text-[var(--text-secondary)] font-medium text-lg">
                    Portable Profile
                  </div>
                  <div className="mt-3 text-sm text-[var(--text-tertiary)]">
                    Cross-game identity
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </main>

        <footer className="border-t border-[var(--border-secondary)] mt-32">
          <div className="container mx-auto px-4 py-12 text-center text-[var(--text-secondary)]">
            <p className="text-sm">Built with ❤️ at Starknet {'{'}Re{'}'}Solve Hackathon.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
