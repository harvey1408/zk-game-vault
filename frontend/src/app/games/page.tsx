"use client";

import { ParticleBackground } from "@/components/ParticleBackground";
import { WalletConnect } from "@/components/WalletConnect";
import ScrollReveal from "@/components/ScrollReveal";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getPublicProvider } from "@/lib/starknet";
import { useAccount } from "@starknet-react/core";
import { getTicTacToeContract } from "@/lib/contracts";
import { getIdentityContract } from "@/lib/contracts";

export default function GamesPage() {
  const [chainId, setChainId] = useState<string>("");
  const [blockNumber, setBlockNumber] = useState<number | null>(null);
  const { isConnected, account } = useAccount() as any;
  const [joinStatus, setJoinStatus] = useState<string>("");

  useEffect(() => {
    const provider = getPublicProvider();
    provider.getChainId().then((id: any) => {
      setChainId(typeof id === 'string' ? id : JSON.stringify(id));
    }).catch(() => {});
    provider.getBlock('latest').then((block: any) => {
      const bn = block?.block_number ?? block?.blockNumber;
      if (typeof bn === 'number') setBlockNumber(bn);
    }).catch(() => {});
  }, []);
  return (
    <div className="min-h-screen bg-black relative circuit-pattern">
      <ParticleBackground />
      <div className="fixed inset-0 circuit-bg pointer-events-none z-0" />

      <div className="relative z-10">
        <header className="holographic-border border-b backdrop-void">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-5 flex justify-between items-center flex-wrap gap-4">
            <Link href="/" className="text-2xl md:text-3xl font-black text-header gradient-text-holographic tracking-tight">
              ZKGameVault
            </Link>
            <WalletConnect />
          </div>
        </header>

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal>
              <h1 className="text-4xl md:text-6xl font-black text-header mb-4 gradient-text-holographic leading-tight text-center">
                Play Games
              </h1>
            </ScrollReveal>
            <ScrollReveal delayMs={100}>
              <p className="text-[var(--text-secondary)] text-lg md:text-xl text-body mb-10 text-center">
                Join privacy-gated games with your portable Dojo profile.
              </p>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <ScrollReveal>
                <div className="holographic-card rounded-2xl p-6 interactive-glow">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-header mb-2">Tic-Tac-Toe</h3>
                      <p className="text-[var(--text-secondary)] text-sm">
                        On-chain, privacy-gated entry. Sync moves in real-time.
                      </p>
                    </div>
                    <div className="text-3xl" aria-hidden="true">🎯</div>
                  </div>
                  <div className="flex items-center gap-3 mt-6 flex-wrap">
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[var(--void-black-2)]/70 holographic-border text-[var(--text-primary)]">
                      Requires Identity
                    </span>
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[var(--void-black-2)]/70 cyber-border-cyan text-[var(--text-primary)]">
                      Live
                    </span>
                  </div>
                  <div className="flex gap-4 mt-6 flex-wrap">
                    <button className="group relative px-6 py-3 bg-[var(--cyber-blue)] hover:bg-[var(--cyber-blue)]/90 text-black font-bold rounded-xl transition-all duration-300 text-header text-sm overflow-hidden interactive-glow disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={!isConnected}
                      onClick={async () => {
                        try {
                          setJoinStatus("");
                          if (!account) { setJoinStatus('Wallet not connected.'); return; }
                          const contract = getTicTacToeContract(account);
                          if (!contract) { setJoinStatus('TicTacToe contract not configured from manifest.'); return; }
                          // Use stored user_id from identity page; prompt if missing
                          let userIdStr = '';
                          try { userIdStr = localStorage.getItem('zkgv_user_id') || ''; } catch {}
                          if (!userIdStr) {
                            const promptVal = prompt('Enter your user_id (from identity creation)');
                            if (!promptVal) return;
                            userIdStr = promptVal;
                          }
                          const userId = BigInt(userIdStr);
                          const gameId = BigInt(Date.now());
                          // Verify age on-chain before joining
                          try {
                            const identity = getIdentityContract(account);
                            if (identity) {
                              const minAge = 18; // basic requirement for demo
                              const verify = await identity.call("verify_age", [userId, minAge]);
                              const ok = Array.isArray(verify) ? Boolean(verify[0]) : Boolean((verify as any).success ?? verify);
                              if (!ok) { setJoinStatus('Age verification failed.'); return; }
                            }
                          } catch {
                            // proceed if call fails silently for now
                          }
                          setJoinStatus('Submitting join transaction...');
                          const tx = await contract.invoke("join_game", [gameId, userId]);
                          // @ts-ignore
                          await account.waitForTransaction(tx.transaction_hash || tx.hash);
                          setJoinStatus(`Joined game ${gameId.toString()} as user ${userId.toString()}`);
                          try { window.location.href = `/games/${gameId.toString()}`; } catch {}
                        } catch (e: any) {
                          setJoinStatus(e?.message || 'Failed to join game');
                        }
                      }}
                    >
                      <span className="relative z-10">Join Game</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-[var(--cyber-blue)] via-[var(--neon-cyan)] to-[var(--cyber-purple)] opacity-0 group-hover:opacity-100 animate-gradient-shift" />
                    </button>
                    <Link href="/identity" className="px-6 py-3 backdrop-void holographic-border hover:glow-purple text-white font-bold rounded-xl transition-all duration-300 text-header text-sm interactive-glow">
                      Create Identity
                    </Link>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delayMs={100}>
                <div className="holographic-card rounded-2xl p-6 interactive-glow">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-header mb-2">Dojo Arena (Soon)</h3>
                      <p className="text-[var(--text-secondary)] text-sm">
                        Multiplayer arena built on Dojo engine.
                      </p>
                    </div>
                    <div className="text-3xl" aria-hidden="true">🛡️</div>
                  </div>
                  <div className="flex items-center gap-3 mt-6 flex-wrap">
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[var(--void-black-2)]/70 cyber-border-purple text-[var(--text-primary)]">
                      Coming Soon
                    </span>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delayMs={200}>
                <div className="holographic-card rounded-2xl p-6 interactive-glow">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-header mb-2">Private Leaderboard</h3>
                      <p className="text-[var(--text-secondary)] text-sm">
                        ZK-verified scores without exposing players.
                      </p>
                    </div>
                    <div className="text-3xl" aria-hidden="true">🏆</div>
                  </div>
                  <div className="flex items-center gap-3 mt-6 flex-wrap">
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[var(--void-black-2)]/70 holographic-border text-[var(--text-primary)]">
                      Prototype
                    </span>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            <div className="max-w-3xl mx-auto mt-12 text-center text-sm text-[var(--text-secondary)]">
              {chainId && (
                <div>Connected to: {chainId} {typeof blockNumber === 'number' ? `(block #${blockNumber})` : ''}</div>
              )}
              {joinStatus && (
                <div className="mt-2">{joinStatus}</div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
