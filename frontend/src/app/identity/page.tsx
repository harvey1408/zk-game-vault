"use client";

import { ParticleBackground } from "@/components/ParticleBackground";
import { WalletConnect } from "@/components/WalletConnect";
import ScrollReveal from "@/components/ScrollReveal";
import { useAccount } from "@starknet-react/core";
import { getPublicProvider } from "@/lib/starknet";
import { getIdentityContract } from "@/lib/contracts";
import { useState } from "react";
import Link from "next/link";

export default function IdentityPage() {
  const { isConnected, account } = useAccount() as any;
  const [txStatus, setTxStatus] = useState<string>("");
  const [lastUserId, setLastUserId] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [age, setAge] = useState<number>(21);
  const [country, setCountry] = useState<string>("");
  const [proof, setProof] = useState<string>("");
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
                      disabled={!isConnected}
                      onClick={async (e) => {
                        const container = (e.currentTarget.closest('.encryption-overlay') as HTMLElement) || undefined;
                        if (container) {
                          container.classList.add('active');
                          setTimeout(() => container.classList.remove('active'), 2100);
                        }
                        setTxStatus("");
                        try {
                          const client = account ?? getPublicProvider();
                          const contract = getIdentityContract(client);
                          if (!contract) {
                            setTxStatus("Identity contract not configured from manifest.");
                            return;
                          }
                          if (!account) {
                            setTxStatus("Wallet not connected.");
                            return;
                          }
                          // ZK proof (stub): compute a client-side placeholder proof string
                          const proofStub = `zkp-age-${age}-${Date.now()}`;
                          setProof(proofStub);
                          // Prepare calldata: user_id, age, country (felt placeholder 0)
                          const userId = BigInt(Date.now());
                          const countryFelt = 0;
                          const tx = await contract.invoke("create_identity", [userId, age, countryFelt]);
                          // @ts-ignore
                          await account.waitForTransaction(tx.transaction_hash || tx.hash);
                          setTxStatus("Identity creation transaction submitted");
                          try { localStorage.setItem('zkgv_user_id', userId.toString()); setLastUserId(userId.toString()); } catch {}
                        } catch (err: any) {
                          setTxStatus(err?.message || "Failed to submit transaction");
                        }
                      }}
                    >
                      <span className="relative z-10">Generate ZK Proof</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-[var(--cyber-blue)] via-[var(--neon-cyan)] to-[var(--cyber-purple)] opacity-0 group-hover:opacity-100 animate-gradient-shift" />
                    </button>

                    <button className="px-8 md:px-12 py-4 md:py-5 backdrop-void holographic-border hover:glow-purple text-white font-bold rounded-xl transition-all duration-300 text-header text-base md:text-lg interactive-glow"
                      onClick={() => setTxStatus("Identity saved locally (stub)")}
                    >
                      Save Identity (Local)
                    </button>
                    {txStatus && (
                      <div className="px-4 py-2 text-sm text-[var(--text-secondary)]">
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
                  {(txStatus || lastUserId || proof) && (
                    <div className="mt-4 text-xs text-[var(--text-secondary)]">
                      {lastUserId && (<div>Your user_id: <span className="font-mono">{lastUserId}</span></div>)}
                      {proof && (<div>Proof (stub): <span className="font-mono">{proof}</span></div>)}
                      {txStatus && (<div>Status: {txStatus}</div>)}
                    </div>
                  )}
                </aside>
              </ScrollReveal>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


