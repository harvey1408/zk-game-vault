"use client";

import { ParticleBackground } from "@/components/ParticleBackground";
import { WalletConnect } from "@/components/WalletConnect";
import ScrollReveal from "@/components/ScrollReveal";
import { useAccount } from "@starknet-react/core";
import { getPublicProvider } from "@/lib/starknet";
import { getIdentityContract } from "@/lib/contracts";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  prepareIdentityCreation,
  retrieveAgeProof,
  clearAgeProof,
} from "@/lib/zkProofs";

export default function IdentityPage() {
  const { isConnected, account } = useAccount() as any;
  const [txStatus, setTxStatus] = useState<string>("");
  const [lastUserId, setLastUserId] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [age, setAge] = useState<number>(21);
  const [country, setCountry] = useState<string>("1");
  const [hasIdentity, setHasIdentity] = useState<boolean>(false);
  const [proofData, setProofData] = useState<{ age: number; salt: string } | null>(null);

  // Check for existing identity on mount
  useEffect(() => {
    try {
      const savedUserId = localStorage.getItem('zkgv_user_id');
      if (savedUserId) {
        setLastUserId(savedUserId);
        const proof = retrieveAgeProof(savedUserId);
        if (proof) {
          setHasIdentity(true);
          setProofData(proof);
        }
      }
    } catch {}
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
          <div className="max-w-4xl mx-auto">
            <ScrollReveal>
              <h1 className="text-4xl md:text-6xl font-black text-header mb-4 gradient-text-holographic leading-tight">
                Create Your Identity
              </h1>
            </ScrollReveal>
            <ScrollReveal delayMs={100}>
              <p className="text-[var(--text-secondary)] text-lg md:text-xl text-body mb-10">
                Generate a privacy-preserving profile. Prove facts (like age range) without revealing your data.
              </p>
            </ScrollReveal>

            <div className="grid lg:grid-cols-3 gap-8">
              <ScrollReveal>
                <div className="holographic-card rounded-2xl p-6 lg:col-span-2 encryption-overlay">
                  <h2 className="text-2xl font-bold text-header mb-4">Identity Details</h2>
                  <div className="grid md:grid-cols-2 gap-5">
                    <label className="block">
                      <span className="text-sm text-[var(--text-secondary)]">Display Name</span>
                      <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-2 w-full rounded-xl px-4 py-3 backdrop-void holographic-border outline-none text-body" placeholder="e.g., vault_player" />
                    </label>
                    <label className="block">
                      <span className="text-sm text-[var(--text-secondary)]">Your Age</span>
                      <input type="number" min={0} value={age} onChange={(e) => setAge(Number(e.target.value || 0))} className="mt-2 w-full rounded-xl px-4 py-3 backdrop-void holographic-border outline-none text-body" placeholder="Enter your age (kept local)" />
                    </label>
                    <label className="block">
                      <span className="text-sm text-[var(--text-secondary)]">Country (optional)</span>
                      <input value={country} onChange={(e) => setCountry(e.target.value)} className="mt-2 w-full rounded-xl px-4 py-3 backdrop-void holographic-border outline-none text-body" placeholder="e.g., US" />
                    </label>
                    <label className="block md:col-span-2">
                      <span className="text-sm text-[var(--text-secondary)]">Optional Bio</span>
                      <textarea className="mt-2 w-full rounded-xl px-4 py-3 backdrop-void holographic-border outline-none text-body" rows={4} placeholder="Tell others about your play style (kept local)"></textarea>
                    </label>
                  </div>

                  <div className="flex items-center gap-4 mt-8 flex-wrap">
                    <button className="group relative px-8 md:px-12 py-4 md:py-5 bg-[var(--cyber-blue)] hover:bg-[var(--cyber-blue)]/90 text-black font-bold rounded-xl transition-all duration-300 text-header text-base md:text-lg overflow-hidden interactive-glow disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={!isConnected || hasIdentity}
                      onClick={async (e) => {
                        const container = (e.currentTarget.closest('.encryption-overlay') as HTMLElement) || undefined;
                        if (container) {
                          container.classList.add('active');
                          setTimeout(() => container.classList.remove('active'), 2100);
                        }
                        setTxStatus("Generating ZK proof...");
                        try {
                          const client = account ?? getPublicProvider();
                          const contract = getIdentityContract(client);
                          if (!contract) {
                            setTxStatus("❌ Identity contract not configured from manifest.");
                            return;
                          }
                          if (!account) {
                            setTxStatus("❌ Wallet not connected.");
                            return;
                          }

                          // Generate user ID
                          const userId = Date.now().toString();

                          // Prepare ZK proof identity data
                          const identityData = prepareIdentityCreation(userId, age, country);

                          setTxStatus("📝 Submitting to blockchain...");

                          // Call create_identity with new signature: (user_id, age_commitment, country)
                          const tx = await contract.invoke("create_identity", [
                            identityData.userId,
                            identityData.ageCommitment,
                            identityData.country,
                          ]);

                          setTxStatus("⏳ Waiting for confirmation...");

                          // @ts-ignore
                          await account.waitForTransaction(tx.transaction_hash || tx.hash);

                          setTxStatus("✅ Identity created successfully!");
                          setHasIdentity(true);
                          setProofData(identityData.metadata);

                          // Save user ID
                          try {
                            localStorage.setItem('zkgv_user_id', userId);
                            setLastUserId(userId);
                          } catch {}
                        } catch (err: any) {
                          setTxStatus(`❌ ${err?.message || "Failed to submit transaction"}`);
                        }
                      }}
                    >
                      <span className="relative z-10">
                        {hasIdentity ? "Identity Already Created" : "Create ZK Identity"}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-[var(--cyber-blue)] via-[var(--neon-cyan)] to-[var(--cyber-purple)] opacity-0 group-hover:opacity-100 animate-gradient-shift" />
                    </button>

                    {hasIdentity && (
                      <button
                        className="px-8 md:px-12 py-4 md:py-5 backdrop-void holographic-border hover:glow-red text-white font-bold rounded-xl transition-all duration-300 text-header text-base md:text-lg interactive-glow"
                        onClick={() => {
                          if (confirm("Are you sure you want to clear your local identity? This cannot be undone.")) {
                            if (lastUserId) {
                              clearAgeProof(lastUserId);
                            }
                            localStorage.removeItem('zkgv_user_id');
                            setHasIdentity(false);
                            setProofData(null);
                            setLastUserId("");
                            setTxStatus("🗑️ Identity cleared from local storage");
                          }
                        }}
                      >
                        Clear Identity
                      </button>
                    )}
                    {txStatus && (
                      <div className="px-4 py-2 text-sm text-[var(--text-secondary)] w-full">
                        {txStatus}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delayMs={100}>
                <aside className="holographic-card rounded-2xl p-6">
                  <h3 className="text-xl font-semibold text-header mb-3">Privacy Notes</h3>
                  <ul className="list-disc list-inside text-[var(--text-secondary)] text-sm leading-7">
                    <li>Proofs reveal only what you choose (e.g., age ≥ 18).</li>
                    <li>Your raw data never leaves your device.</li>
                    <li>Portable profile to use across Dojo games.</li>
                  </ul>
                  {lastUserId && (
                    <div className="mt-6 pt-6 border-t border-[var(--cyber-purple)]/30">
                      <h4 className="text-sm font-semibold text-header mb-2">Your Identity</h4>
                      <div className="text-xs text-[var(--text-secondary)] space-y-1">
                        <div>User ID: <span className="font-mono text-[var(--cyber-blue)]">{lastUserId}</span></div>
                        {proofData && (
                          <>
                            <div>Age (local): <span className="font-mono text-[var(--neon-cyan)]">{proofData.age}</span></div>
                            <div className="text-[10px] break-all">Salt: {proofData.salt.substring(0, 20)}...</div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </aside>
              </ScrollReveal>
            </div>

            {/* Next Steps Section */}
            {hasIdentity && (
              <ScrollReveal delayMs={200}>
                <div className="mt-12 holographic-card rounded-2xl p-8">
                  <h2 className="text-3xl font-bold text-header mb-2 gradient-text-holographic">What's Next?</h2>
                  <p className="text-[var(--text-secondary)] mb-6">
                    Your identity is ready! Age verification happens automatically when you join a game.
                  </p>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="backdrop-void holographic-border rounded-xl p-6">
                      <div className="text-4xl mb-3">🎮</div>
                      <h3 className="text-xl font-semibold text-header mb-2">Play Games</h3>
                      <p className="text-sm text-[var(--text-secondary)] mb-4">
                        Join privacy-gated games. Your age will be verified with ZK proofs automatically.
                      </p>
                      <Link
                        href="/games"
                        className="inline-block px-6 py-3 bg-[var(--cyber-blue)] hover:bg-[var(--cyber-blue)]/90 text-black font-bold rounded-xl transition-all text-sm"
                      >
                        Browse Games →
                      </Link>
                    </div>

                    <div className="backdrop-void holographic-border rounded-xl p-6">
                      <div className="text-4xl mb-3">🔐</div>
                      <h3 className="text-xl font-semibold text-header mb-2">Privacy Guaranteed</h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        Your exact age is never revealed on-chain. Only proof that you meet requirements.
                      </p>
                      <ul className="mt-4 text-xs text-[var(--text-secondary)] space-y-1">
                        <li>✓ Age stored as Pedersen commitment</li>
                        <li>✓ Selective disclosure proofs</li>
                        <li>✓ No age data in blockchain state</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}


