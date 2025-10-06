"use client";

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
import { saveWalletToUserMapping, saveUserName } from "@/lib/playerNames";

export default function IdentityPage() {
  const { isConnected, account } = useAccount() as any;
  const [txStatus, setTxStatus] = useState<string>("");
  const [lastUserId, setLastUserId] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [age, setAge] = useState<number>(21);
  const [country, setCountry] = useState<string>("1");
  const [hasIdentity, setHasIdentity] = useState<boolean>(false);
  const [proofData, setProofData] = useState<{ age: number; salt: string } | null>(null);

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
    <div className="min-h-screen bg-black relative">
      <div className="bg-gradient-radial fixed inset-0 pointer-events-none" />

      <div className="relative z-10">
        <header className="header">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-display text-gradient">
              ZKGameVault
            </Link>
            <WalletConnect />
          </div>
        </header>

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="max-w-5xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-12">
                <h1 className="text-3xl md:text-5xl font-bold text-display mb-3">
                  Create Your Identity
                </h1>
                <p className="text-[var(--text-secondary)] text-base md:text-lg max-w-2xl mx-auto">
                  Generate a privacy-preserving profile. Prove facts (like age range) without revealing your data.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid lg:grid-cols-3 gap-6">
              <ScrollReveal>
                <div className="card-elevated p-6 lg:col-span-2">
                  <h2 className="text-xl font-bold text-display mb-6">Identity Details</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-sm text-[var(--text-tertiary)] uppercase tracking-wide mb-2 block">Display Name</span>
                      <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="input" placeholder="e.g., vault_player" />
                    </label>
                    <label className="block">
                      <span className="text-sm text-[var(--text-tertiary)] uppercase tracking-wide mb-2 block">Your Age</span>
                      <input type="number" min={0} value={age} onChange={(e) => setAge(Number(e.target.value || 0))} className="input" placeholder="Enter your age (kept local)" />
                    </label>
                    <label className="block">
                      <span className="text-sm text-[var(--text-tertiary)] uppercase tracking-wide mb-2 block">Country (optional)</span>
                      <input value={country} onChange={(e) => setCountry(e.target.value)} className="input" placeholder="e.g., US" />
                    </label>
                    <label className="block md:col-span-2">
                      <span className="text-sm text-[var(--text-tertiary)] uppercase tracking-wide mb-2 block">Optional Bio</span>
                      <textarea className="input" rows={4} placeholder="Tell others about your play style (kept local)"></textarea>
                    </label>
                  </div>

                  <div className="flex items-center gap-4 mt-8 flex-wrap">
                    <button className="btn btn-primary"
                      disabled={!isConnected || hasIdentity}
                      onClick={async (e) => {
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

                          const userId = Date.now().toString();

                          const identityData = prepareIdentityCreation(userId, age, country);

                          setTxStatus("📝 Submitting to blockchain...");

                          const tx = await contract.invoke("create_identity", [
                            identityData.userId,
                            displayName,
                            identityData.ageCommitment,
                            identityData.country,
                          ]);

                          setTxStatus("⏳ Waiting for confirmation...");

                          // @ts-ignore
                          await account.waitForTransaction(tx.transaction_hash || tx.hash);

                          setTxStatus("✅ Identity created successfully!");
                          setHasIdentity(true);
                          setProofData(identityData.metadata);

                          try {
                            localStorage.setItem('zkgv_user_id', userId);
                            setLastUserId(userId);
                            const walletAddress = String(account?.address || '');
                            saveWalletToUserMapping(walletAddress, userId);
                            saveUserName(userId, displayName);
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
                      <div className="px-4 py-3 text-sm text-[var(--text-secondary)] w-full bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-secondary)]">
                        {txStatus}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delayMs={100}>
                <aside className="card-elevated p-6">
                  <h3 className="text-lg font-semibold text-display mb-4">Privacy Notes</h3>
                  <ul className="list-disc list-inside text-[var(--text-secondary)] text-sm space-y-2">
                    <li>Proofs reveal only what you choose (e.g., age ≥ 18).</li>
                    <li>Your raw data never leaves your device.</li>
                    <li>Portable profile to use across Dojo games.</li>
                  </ul>
                  {lastUserId && (
                    <div className="mt-6 pt-6 border-t border-[var(--border-secondary)]">
                      <h4 className="text-sm font-semibold text-display mb-3 uppercase tracking-wide">Your Identity</h4>
                      <div className="text-xs text-[var(--text-secondary)] space-y-2">
                        <div>User ID: <span className="font-mono text-[var(--accent-primary)]">{lastUserId}</span></div>
                        {proofData && (
                          <>
                            <div>Age (local): <span className="font-mono text-[var(--accent-warm)]">{proofData.age}</span></div>
                            <div className="text-[10px] break-all text-[var(--text-tertiary)]">Salt: {proofData.salt.substring(0, 20)}...</div>
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
                <div className="mt-12 card-elevated p-8">
                  <h2 className="text-2xl font-bold text-display mb-2">What's Next?</h2>
                  <p className="text-[var(--text-secondary)] text-sm mb-6">
                    Your identity is ready! Age verification happens automatically when you join a game.
                  </p>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="card p-6">
                      <div className="text-4xl mb-3">🎮</div>
                      <h3 className="text-lg font-semibold text-display mb-2">Play Games</h3>
                      <p className="text-sm text-[var(--text-secondary)] mb-4">
                        Join privacy-gated games. Your age will be verified with ZK proofs automatically.
                      </p>
                      <Link href="/games" className="btn btn-primary inline-block">
                        Browse Games →
                      </Link>
                    </div>

                    <div className="card p-6">
                      <div className="text-4xl mb-3">🔐</div>
                      <h3 className="text-lg font-semibold text-display mb-2">Privacy Guaranteed</h3>
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


