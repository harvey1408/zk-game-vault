"use client";

import { WalletConnect } from "@/components/WalletConnect";
import ScrollReveal from "@/components/ScrollReveal";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getPublicProvider } from "@/lib/starknet";
import { useAccount } from "@starknet-react/core";
import { getTicTacToeContract, getIdentityContract, getStarkVerifierContract } from "@/lib/contracts";
import { retrieveAgeProof } from "@/lib/zkProofs";
import { generateSignedProof, formatSignedProofForContract } from "@/lib/proverClient";

export default function GamesPage() {
  const [chainId, setChainId] = useState<string>("");
  const [blockNumber, setBlockNumber] = useState<number | null>(null);
  const { isConnected, account } = useAccount() as any;
  const [joinStatus, setJoinStatus] = useState<string>("");
  const [createStatus, setCreateStatus] = useState<string>("");
  const [minAge, setMinAge] = useState<number>(18);
  const [showCreateGame, setShowCreateGame] = useState<boolean>(false);
  const [gameIdToJoin, setGameIdToJoin] = useState<string>("");

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
          <div className="max-w-6xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-12">
                <h1 className="text-3xl md:text-5xl font-bold text-display mb-3">
                  Play Games
                </h1>
                <p className="text-[var(--text-secondary)] text-base md:text-lg">
                  Join privacy-gated games with your portable Dojo profile.
                </p>
              </div>
            </ScrollReveal>

            {/* Create Game Section */}
            <ScrollReveal>
              <div className="card-elevated p-6 md:p-8 mb-6">
                <h2 className="text-2xl font-bold text-display mb-2">Create New Game</h2>
                <p className="text-[var(--text-secondary)] text-sm mb-6">
                  Start a privacy-gated Tic-Tac-Toe game with age verification
                </p>

                <div className="mb-6">
                  <label className="block">
                    <span className="text-sm text-[var(--text-tertiary)] uppercase tracking-wide mb-2 block">Minimum Age Requirement</span>
                    <input
                      type="number"
                      min={0}
                      value={minAge}
                      onChange={(e) => setMinAge(Number(e.target.value || 0))}
                      className="input"
                      placeholder="e.g., 18"
                    />
                  </label>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <button
                    className="btn btn-primary"
                    disabled={!isConnected}
                    onClick={async (e) => {
                      setCreateStatus("Creating game...");
                      try {
                        if (!account) {
                          setCreateStatus("❌ Wallet not connected.");
                          return;
                        }
                        const contract = getTicTacToeContract(account);
                        if (!contract) {
                          setCreateStatus("❌ TicTacToe contract not configured.");
                          return;
                        }

                        // Load user identity
                        let userIdStr = "";
                        try { userIdStr = localStorage.getItem("zkgv_user_id") || ""; } catch {}
                        if (!userIdStr) {
                          setCreateStatus("❌ No identity found. Create an identity first.");
                          return;
                        }

                        // Retrieve local proof data to check creator's own age
                        const localProof = retrieveAgeProof(userIdStr);
                        if (!localProof) {
                          setCreateStatus("❌ Missing local proof data. Create identity first.");
                          return;
                        }
                        if (typeof localProof.age === 'number' && localProof.age < minAge) {
                          setCreateStatus("❌ Minimum age exceeds your age.");
                          return;
                        }

                        // Ensure on-chain proof exists for chosen minAge
                        const starkVerifier = getStarkVerifierContract(account);
                        if (!starkVerifier) {
                          setCreateStatus("❌ STARK verifier contract not configured.");
                          return;
                        }

                        const identityContract = getIdentityContract(account);
                        if (!identityContract) {
                          setCreateStatus("❌ Identity contract not configured.");
                          return;
                        }

                        const hasValidForMin = await starkVerifier.call("has_valid_proof", [userIdStr, minAge]);
                        if (!hasValidForMin) {
                          setCreateStatus("🔐 Generating ZK-STARK proof for selected age requirement...");

                          const identityRes: any = await identityContract.call("get_identity", [userIdStr]);
                          const ageCommitment = (identityRes && typeof identityRes === 'object' && 'age_commitment' in identityRes)
                            ? (identityRes as any).age_commitment
                            : (Array.isArray(identityRes)
                                ? identityRes[2]
                                : (identityRes as any)?.result?.[2]);

                          const proof = await generateSignedProof({
                            age: localProof.age,
                            salt: localProof.salt,
                            minimum_age: minAge,
                            age_commitment: ageCommitment,
                            user_id: userIdStr,
                          });

                          if (!proof.success || proof.is_valid !== 1) {
                            throw new Error('Proof generation failed or invalid');
                          }

                          const calldata = formatSignedProofForContract(
                            userIdStr,
                            minAge,
                            ageCommitment,
                            proof
                          );
                          const regTx = await starkVerifier.invoke("register_proof", calldata);
                          setCreateStatus("⏳ Waiting for proof confirmation...");
                          // @ts-ignore
                          await account.waitForTransaction(regTx.transaction_hash || regTx.hash);
                          setCreateStatus("✅ Proof registered. Creating game...");
                        } else {
                          setCreateStatus("✅ Valid proof found. Creating game...");
                        }

                        // Generate game ID
                        const gameId = Date.now();

                        setCreateStatus("📝 Submitting to blockchain...");

                        // Call create_game with: (game_id, minimum_age, user_id)
                        const tx = await contract.invoke("create_game", [gameId, minAge, userIdStr]);

                        setCreateStatus("⏳ Waiting for confirmation...");

                        // @ts-ignore
                        await account.waitForTransaction(tx.transaction_hash || tx.hash);

                        setCreateStatus(`✅ Game created! Game ID: ${gameId}`);
                        setGameIdToJoin(gameId.toString());

                        // Redirect to game page after short delay
                        setTimeout(() => {
                          window.location.href = `/games/${gameId}`;
                        }, 1500);
                      } catch (err: any) {
                        setCreateStatus(`❌ ${err?.message || "Failed to create game"}`);
                      }
                    }}
                  >
                    Create Game
                  </button>

                  {createStatus && (
                    <div className="px-4 py-3 text-sm text-[var(--text-secondary)] w-full bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-secondary)]">
                      {createStatus}
                    </div>
                  )}
                </div>
              </div>
            </ScrollReveal>

            {/* Join Game Section */}
            <ScrollReveal delayMs={100}>
              <div className="card-elevated p-6 md:p-8 mb-8">
                <h2 className="text-2xl font-bold text-display mb-2">Join Existing Game</h2>
                <p className="text-[var(--text-secondary)] text-sm mb-6">
                  Join a game and prove your age with zero-knowledge proof
                </p>

                <div className="mb-6">
                  <label className="block">
                    <span className="text-sm text-[var(--text-tertiary)] uppercase tracking-wide mb-2 block">Game ID</span>
                    <input
                      value={gameIdToJoin}
                      onChange={(e) => setGameIdToJoin(e.target.value)}
                      className="input"
                      placeholder="Enter game ID to join"
                    />
                  </label>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <button
                    className="btn btn-primary"
                    disabled={!isConnected || !gameIdToJoin}
                    onClick={async (e) => {
                      setJoinStatus("Preparing to join...");
                      try {
                        if (!account) {
                          setJoinStatus("❌ Wallet not connected.");
                          return;
                        }

                        const contract = getTicTacToeContract(account);
                        if (!contract) {
                          setJoinStatus("❌ TicTacToe contract not configured.");
                          return;
                        }

                        // Get user ID from storage
                        let userIdStr = "";
                        try {
                          userIdStr = localStorage.getItem("zkgv_user_id") || "";
                        } catch {}

                        if (!userIdStr) {
                          setJoinStatus("❌ No identity found. Create an identity first.");
                          return;
                        }

                        setJoinStatus("🔍 Checking game and age verification...");

                        // Contracts
                        const starkVerifier = getStarkVerifierContract(account);
                        if (!starkVerifier) {
                          setJoinStatus("❌ STARK verifier contract not configured.");
                          return;
                        }
                        const identityContract = getIdentityContract(account);
                        if (!identityContract) {
                          setJoinStatus("❌ Identity contract not configured.");
                          return;
                        }

                        // Fetch game to get dynamic min_age_requirement
                        const gameData: any = await contract.call("get_game", [gameIdToJoin]);
                        const minReq = Number((gameData as any)?.min_age_requirement ?? (gameData as any)?.minAgeRequirement ?? 18);

                        const hasValidProof = await starkVerifier.call("has_valid_proof", [userIdStr, minReq]);

                        if (!hasValidProof) {
                          setJoinStatus("🔐 Generating ZK-STARK proof (age stays private)...");

                          // Retrieve age and salt from local storage
                          const proofData = retrieveAgeProof(userIdStr);
                          if (!proofData) {
                            setJoinStatus("❌ No proof data found. Create an identity first.");
                            return;
                          }

                          const identityRes: any = await identityContract.call("get_identity", [userIdStr]);
                          const ageCommitment = (identityRes && typeof identityRes === 'object' && 'age_commitment' in identityRes)
                            ? (identityRes as any).age_commitment
                            : (Array.isArray(identityRes)
                                ? identityRes[2]
                                : (identityRes as any)?.result?.[2]);

                          setJoinStatus("⚡ Generating cryptographic proof with trusted prover...");

                          // Call prover service with private inputs
                          const proof = await generateSignedProof({
                            age: proofData.age,        // PRIVATE - sent to trusted prover
                            salt: proofData.salt,       // PRIVATE - sent to trusted prover
                            minimum_age: minReq,        // minimum_age (public)
                            age_commitment: ageCommitment, // commitment (public)
                            user_id: userIdStr,
                          });

                          if (!proof.success || proof.is_valid !== 1) {
                            throw new Error('Proof generation failed or invalid');
                          }

                          setJoinStatus("📝 Registering signed proof on-chain (no age revealed)...");

                          // Register proof on-chain with signature (age NOT included!)
                          const calldata = formatSignedProofForContract(
                            userIdStr,
                            minReq,
                            ageCommitment,
                            proof
                          );
                          const proofTx = await starkVerifier.invoke("register_proof", calldata);

                          setJoinStatus("⏳ Waiting for proof confirmation...");

                          // @ts-ignore
                          await account.waitForTransaction(proofTx.transaction_hash || proofTx.hash);

                          setJoinStatus("✅ ZK proof verified! Age remains private.");
                        } else {
                          setJoinStatus("✅ Valid proof token found!");
                        }

                        setJoinStatus("📝 Joining game...");

                        // Join the game
                        const tx = await contract.invoke("join_game", [gameIdToJoin, userIdStr]);

                        setJoinStatus("⏳ Waiting for confirmation...");

                        // @ts-ignore
                        await account.waitForTransaction(tx.transaction_hash || tx.hash);

                        setJoinStatus("✅ Successfully joined game!");

                        // Redirect to game page
                        setTimeout(() => {
                          window.location.href = `/games/${gameIdToJoin}`;
                        }, 1500);
                      } catch (err: any) {
                        setJoinStatus(`❌ ${err?.message || "Failed to join game"}`);
                      }
                    }}
                  >
                    Join Game
                  </button>

                  <Link href="/identity" className="btn btn-secondary">
                    Create Identity
                  </Link>

                  {joinStatus && (
                    <div className="px-4 py-3 text-sm text-[var(--text-secondary)] w-full bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-secondary)]">
                      {joinStatus}
                    </div>
                  )}
                </div>
              </div>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ScrollReveal>
                <div className="card p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-display mb-2">Tic-Tac-Toe</h3>
                      <p className="text-[var(--text-secondary)] text-sm">
                        On-chain, privacy-gated entry with ZK proofs.
                      </p>
                    </div>
                    <div className="text-3xl" aria-hidden="true">🎯</div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge badge-primary">
                      Requires Identity
                    </span>
                    <span className="badge badge-success">
                      Live
                    </span>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delayMs={100}>
                <div className="card p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-display mb-2">Dojo Arena</h3>
                      <p className="text-[var(--text-secondary)] text-sm">
                        Multiplayer arena built on Dojo engine.
                      </p>
                    </div>
                    <div className="text-3xl" aria-hidden="true">🛡️</div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge badge-warning">
                      Coming Soon
                    </span>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delayMs={200}>
                <div className="card p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-display mb-2">Private Leaderboard</h3>
                      <p className="text-[var(--text-secondary)] text-sm">
                        ZK-verified scores without exposing players.
                      </p>
                    </div>
                    <div className="text-3xl" aria-hidden="true">🏆</div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge badge-primary">
                      Prototype
                    </span>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {chainId && (
              <div className="mt-12 text-center text-sm text-[var(--text-tertiary)]">
                Connected to: {chainId} {typeof blockNumber === 'number' ? `(block #${blockNumber})` : ''}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
