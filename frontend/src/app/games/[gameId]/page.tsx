"use client";

import { ParticleBackground } from "@/components/ParticleBackground";
import { WalletConnect } from "@/components/WalletConnect";
import ScrollReveal from "@/components/ScrollReveal";
import Link from "next/link";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "@starknet-react/core";
import { getTicTacToeContract } from "@/lib/contracts";

export default function TicTacToeGamePage() {
  const params = useParams<{ gameId: string }>();
  const { isConnected, account } = useAccount() as any;
  const gameId = useMemo(() => {
    try { return BigInt(params?.gameId || "0"); } catch { return BigInt(0); }
  }, [params]);
  const [status, setStatus] = useState<string>("");
  const [board, setBoard] = useState<number[]>(Array(9).fill(0));
  const [current, setCurrent] = useState<string>("");
  const [player1, setPlayer1] = useState<string>("");
  const [player2, setPlayer2] = useState<string>("");
  const [winner, setWinner] = useState<string>("");
  const [gameState, setGameState] = useState<string>("waiting");
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [isDraw, setIsDraw] = useState<boolean>(false);
  const [myUserId, setMyUserId] = useState<string>("");
  const myAddress = useMemo(() => {
    try { return String((account as any)?.address || ""); } catch { return ""; }
  }, [account]);

  // Helpers to normalize on-chain address formats for safe comparison
  const toBigIntSafe = useCallback((value: any): bigint => {
    try {
      if (value === null || value === undefined) return BigInt(0);
      const str = String(value).trim();
      if (str === "" || str === "0" || str === "0x0") return BigInt(0);
      return BigInt(str);
    } catch {
      return BigInt(0);
    }
  }, []);
  const myAddrBI = useMemo(() => toBigIntSafe(myAddress), [myAddress, toBigIntSafe]);
  const toBoolSafe = useCallback((value: any): boolean => {
    try {
      if (typeof value === 'boolean') return value;
      const n = Number(String(value ?? 0));
      return !!n;
    } catch { return false; }
  }, []);

  // Load user ID from storage
  useEffect(() => {
    try {
      const userId = localStorage.getItem('zkgv_user_id') || '';
      setMyUserId(userId);
    } catch {}
  }, []);

  // Load game state
  const loadGameState = useCallback(async () => {
    try {
      if (!account) return;
      const contract = getTicTacToeContract(account);
      if (!contract) return;
      const game: any = await contract.call("get_game", [gameId]);
      const b = [game?.board1, game?.board2, game?.board3, game?.board4, game?.board5, game?.board6, game?.board7, game?.board8, game?.board9].map((x: any) => Number(x ?? 0));
      setBoard(b);

      // Use player_x and player_o (wallet addresses)
      const currentPlayerAddr = String((game as any)?.current_player ?? (game as any)?.currentPlayer ?? "");
      const playerXAddr = String((game as any)?.player_x ?? (game as any)?.playerX ?? "");
      const playerOAddr = String((game as any)?.player_o ?? (game as any)?.playerO ?? "");
      const winnerAddr = String((game as any)?.winner ?? "0");
      const finishedFlag = (game as any)?.is_finished ?? (game as any)?.isFinished ?? 0;
      const drawFlag = (game as any)?.is_draw ?? (game as any)?.isDraw ?? 0;

      setCurrent(currentPlayerAddr);
      setPlayer1(playerXAddr);
      setPlayer2(playerOAddr);
      setWinner(winnerAddr);
      const finished = toBoolSafe(finishedFlag);
      const draw = toBoolSafe(drawFlag);
      setIsFinished(finished);
      setIsDraw(draw);

      // Determine game state - check if player_o is set
      const zeroAddr = BigInt(0);
      const winnerBI = toBigIntSafe(winnerAddr);
      const playerOBI = toBigIntSafe(playerOAddr);
      if (finished) {
        setGameState("finished");
      } else if (playerOBI !== BigInt(0)) {
        setGameState("playing");
      } else {
        setGameState("waiting");
      }
    } catch {}
  }, [account, gameId]);

  useEffect(() => {
    loadGameState();

    // Poll for updates every 3 seconds
    const interval = setInterval(loadGameState, 3000);
    return () => clearInterval(interval);
  }, [loadGameState]);

  const play = async (pos: number) => {
    try {
      setStatus("Making move...");
      if (!account) {
        setStatus("❌ Wallet not connected.");
        return;
      }
      const contract = getTicTacToeContract(account);
      if (!contract) {
        setStatus("❌ Contract not configured.");
        return;
      }
      if (!myUserId) {
        setStatus("❌ user_id missing. Create identity first.");
        return;
      }

      // Compare wallet addresses for turn checking
      const myAddr = toBigIntSafe((account as any)?.address);
      if (toBigIntSafe(current) !== myAddr) {
        setStatus("❌ Not your turn!");
        return;
      }

      if (board[pos] !== 0) {
        setStatus("❌ Cell already occupied!");
        return;
      }

      const tx: any = await contract.invoke("make_move", [gameId, pos + 1, myUserId]);
      setStatus("⏳ Waiting for confirmation...");
      await account.waitForTransaction(tx?.transaction_hash ?? tx?.hash);
      setStatus("✅ Move submitted!");

      // Reload game state
      setTimeout(loadGameState, 1000);
    } catch (e: any) {
      setStatus(`❌ ${e?.message || "Failed to make move"}`);
    }
  };

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
              <h1 className="text-3xl md:text-5xl font-black text-header mb-2 gradient-text-holographic leading-tight text-center">
                Tic-Tac-Toe
              </h1>
              <p className="text-[var(--text-secondary)] text-center mb-8">
                Game ID: {gameId.toString()}
              </p>
            </ScrollReveal>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Game Board */}
              <ScrollReveal delayMs={100}>
                <div className="lg:col-span-2 holographic-card rounded-2xl p-8">
                  <div className="grid grid-cols-3 gap-4 mx-auto w-full max-w-md mb-6">
                    {board.map((cell, idx) => (
                      <button
                        key={idx}
                        onClick={() => play(idx)}
                        disabled={
                          gameState !== "playing" ||
                          toBigIntSafe(current) !== myAddrBI ||
                          cell !== 0
                        }
                        className={`
                          h-24 md:h-28 rounded-xl holographic-border backdrop-void interactive-glow text-4xl md:text-5xl font-black
                          transition-all duration-300
                          ${cell === 1 ? "text-[var(--cyber-blue)]" : ""}
                          ${cell === 2 ? "text-[var(--cyber-purple)]" : ""}
                          {toBigIntSafe(current) === myAddrBI && cell === 0 && gameState === "playing" ? "hover:glow-cyan cursor-pointer" : "cursor-not-allowed opacity-75"}
                        `}
                      >
                        {cell === 1 ? "X" : cell === 2 ? "O" : ""}
                      </button>
                    ))}
                  </div>

                  {status && (
                    <div className="text-center text-sm text-[var(--text-secondary)] mb-4">
                      {status}
                    </div>
                  )}

                  {gameState === "finished" && (
                    <div className="text-center">
                      {isDraw ? (
                        <div className="inline-block px-6 py-3 rounded-xl bg-[var(--text-secondary)] text-black font-bold text-lg">
                          🤝 Draw!
                        </div>
                      ) : (
                        <div className="inline-block px-6 py-3 rounded-xl bg-[var(--cyber-blue)] text-black font-bold text-lg">
                          🏆 Winner: {toBigIntSafe(winner) === myAddrBI ? "You!" : `Player ${winner}`}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ScrollReveal>

              {/* Game Info Sidebar */}
              <ScrollReveal delayMs={200}>
                <aside className="holographic-card rounded-2xl p-6">
                  <h3 className="text-xl font-semibold text-header mb-4">Game Status</h3>

                  <div className="space-y-4">
                    {/* Game State */}
                    <div>
                      <div className="text-xs text-[var(--text-secondary)] mb-1">State</div>
                      <div className={`
                        inline-block px-3 py-1 text-xs font-semibold rounded-full
                        ${gameState === "waiting" ? "bg-yellow-500/20 text-yellow-400" : ""}
                        ${gameState === "playing" ? "bg-green-500/20 text-green-400" : ""}
                        ${gameState === "finished" ? "bg-blue-500/20 text-blue-400" : ""}
                      `}>
                        {gameState === "waiting" && "⏳ Waiting for player 2"}
                        {gameState === "playing" && "▶️ In Progress"}
                        {gameState === "finished" && "✅ Finished"}
                      </div>
                    </div>

                    {/* Players */}
                    <div>
                      <div className="text-xs text-[var(--text-secondary)] mb-2">Players</div>
                      <div className="space-y-2">
                        {player1 && (
                          <div className="flex items-center gap-2">
                            <span className="text-[var(--cyber-blue)] font-bold">X</span>
                            <span className="text-xs font-mono truncate">
                              {toBigIntSafe(player1) === myAddrBI ? "You" : player1}
                            </span>
                            {toBigIntSafe(current) === toBigIntSafe(player1) && gameState === "playing" && (
                              <span className="text-xs text-[var(--cyber-blue)]">← Turn</span>
                            )}
                          </div>
                        )}
                        {player2 && player2 !== "0" ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[var(--cyber-purple)] font-bold">O</span>
                            <span className="text-xs font-mono truncate">
                              {toBigIntSafe(player2) === myAddrBI ? "You" : player2}
                            </span>
                            {toBigIntSafe(current) === toBigIntSafe(player2) && gameState === "playing" && (
                              <span className="text-xs text-[var(--cyber-purple)]">← Turn</span>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-[var(--text-secondary)]">
                            Waiting for player 2...
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Current Turn */}
                    {gameState === "playing" && (
                      <div>
                        <div className="text-xs text-[var(--text-secondary)] mb-1">Current Turn</div>
                        <div className={`text-sm font-semibold ${toBigIntSafe(current) === myAddrBI ? "text-[var(--neon-cyan)]" : "text-[var(--text-primary)]"}`}>
                          {toBigIntSafe(current) === myAddrBI ? "Your turn!" : "Opponent's turn"}
                        </div>
                      </div>
                    )}

                    {/* Share Game Link */}
                    {gameState === "waiting" && (
                      <div className="pt-4 border-t border-[var(--cyber-purple)]/30">
                        <div className="text-xs text-[var(--text-secondary)] mb-2">Share Game</div>
                        <button
                          onClick={() => {
                            const url = window.location.href;
                            navigator.clipboard.writeText(url);
                            setStatus("✅ Link copied to clipboard!");
                          }}
                          className="w-full px-4 py-2 bg-[var(--cyber-purple)] hover:bg-[var(--cyber-purple)]/90 text-white text-xs font-bold rounded-lg transition-all"
                        >
                          Copy Game Link
                        </button>
                      </div>
                    )}
                  </div>
                </aside>
              </ScrollReveal>
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/games"
                className="inline-block px-8 py-3 backdrop-void holographic-border hover:glow-purple text-white font-bold rounded-xl transition-all duration-300 text-header interactive-glow"
              >
                ← Back to Games
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


