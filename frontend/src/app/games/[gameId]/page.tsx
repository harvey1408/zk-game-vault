"use client";

import { ParticleBackground } from "@/components/ParticleBackground";
import { WalletConnect } from "@/components/WalletConnect";
import ScrollReveal from "@/components/ScrollReveal";
import Link from "next/link";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "@starknet-react/core";
import { getTicTacToeContract } from "@/lib/contracts";
import { getPlayerName } from "@/lib/playerNames";

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
  const [player1Name, setPlayer1Name] = useState<string>("");
  const [player2Name, setPlayer2Name] = useState<string>("");
  const myAddress = useMemo(() => {
    try { return String((account as any)?.address || ""); } catch { return ""; }
  }, [account]);

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

  // Fetch player names from wallet addresses
  const fetchPlayerNames = useCallback(async (playerXAddr: string, playerOAddr: string) => {
    if (!account) return;

    try {
      if (playerXAddr && playerXAddr !== "0x0") {
        const name1 = await getPlayerName(account, playerXAddr);
        setPlayer1Name(name1);
      }

      if (playerOAddr && playerOAddr !== "0x0") {
        const name2 = await getPlayerName(account, playerOAddr);
        setPlayer2Name(name2);
      }
    } catch (error) {
      console.error('Failed to fetch player names:', error);
    }
  }, [account]);

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

      await fetchPlayerNames(playerXAddr, playerOAddr);

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
  }, [account, gameId, fetchPlayerNames]);

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

  const cancelGame = async () => {
    try {
      setStatus("Cancelling game...");
      if (!account) {
        setStatus("❌ Wallet not connected.");
        return;
      }
      const contract = getTicTacToeContract(account);
      if (!contract) {
        setStatus("❌ Contract not configured.");
        return;
      }

      // Only game creator can cancel
      const myAddr = toBigIntSafe((account as any)?.address);
      const player1Addr = toBigIntSafe(player1);
      if (myAddr !== player1Addr) {
        setStatus("❌ Only game creator can cancel.");
        return;
      }

      const tx: any = await contract.invoke("cancel_game", [gameId]);
      setStatus("⏳ Cancelling game...");
      await account.waitForTransaction(tx?.transaction_hash ?? tx?.hash);
      setStatus("✅ Game cancelled!");

      setTimeout(loadGameState, 1000);
    } catch (e: any) {
      setStatus(`❌ ${e?.message || "Failed to cancel game"}`);
    }
  };

  const isGameCreator = toBigIntSafe(myAddress) === toBigIntSafe(player1);
  
  const showCancelButton = gameState === "waiting" && isGameCreator && !isFinished;

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
                  Tic-Tac-Toe
                </h1>
                <p className="text-[var(--text-secondary)] text-sm">
                  Game #{gameId.toString()}
                </p>
              </div>
            </ScrollReveal>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Game Board */}
              <ScrollReveal delayMs={100}>
                <div className="lg:col-span-2 card-elevated p-6 md:p-8">
                  <div className="grid grid-cols-3 gap-3 md:gap-4 mx-auto w-full max-w-md mb-6">
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
                          game-cell h-24 md:h-28 text-4xl md:text-5xl
                          ${cell === 1 ? "cell-x" : ""}
                          ${cell === 2 ? "cell-o" : ""}
                        `}
                      >
                        {cell === 1 ? "X" : cell === 2 ? "O" : ""}
                      </button>
                    ))}
                  </div>

                  {status && (
                    <div className="text-center text-sm text-[var(--text-secondary)] mb-4 p-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-secondary)]">
                      {status}
                    </div>
                  )}

                  {gameState === "finished" && (
                    <div className="text-center">
                      {isDraw ? (
                        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--text-secondary)]/10 border border-[var(--text-secondary)]/20 text-[var(--text-secondary)] font-semibold">
                          <span>🤝</span>
                          <span>Draw!</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 text-[var(--accent-primary)] font-semibold">
                          <span>🏆</span>
                          <span>
                            Winner: {toBigIntSafe(winner) === myAddrBI 
                              ? "You!" 
                              : (toBigIntSafe(winner) === toBigIntSafe(player1) 
                                  ? (player1Name || `${player1.slice(0, 6)}...${player1.slice(-4)}`) 
                                  : (player2Name || `${player2.slice(0, 6)}...${player2.slice(-4)}`)
                                )
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ScrollReveal>

              {/* Game Info Sidebar */}
              <ScrollReveal delayMs={200}>
                <aside className="card-elevated p-6">
                  <h3 className="text-lg font-semibold text-display mb-6">Game Status</h3>

                  <div className="space-y-6">
                    {/* Game State */}
                    <div>
                      <div className="text-xs text-[var(--text-tertiary)] mb-2 uppercase tracking-wide">State</div>
                      <div className={`badge ${
                        gameState === "waiting" ? "badge-warning" : 
                        gameState === "playing" ? "badge-success" : 
                        "badge-primary"
                      }`}>
                        {gameState === "waiting" && (
                          <>
                            <span className="status-dot status-warning"></span>
                            <span>Waiting for player 2</span>
                          </>
                        )}
                        {gameState === "playing" && (
                          <>
                            <span className="status-dot status-success"></span>
                            <span>In Progress</span>
                          </>
                        )}
                        {gameState === "finished" && (
                          <>
                            <span className="status-dot" style={{background: 'var(--accent-primary)'}}></span>
                            <span>Finished</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Players */}
                    <div>
                      <div className="text-xs text-[var(--text-tertiary)] mb-3 uppercase tracking-wide">Players</div>
                      <div className="space-y-3">
                        {player1 && (
                          <div className="flex items-center gap-3 p-2 rounded-lg bg-[var(--bg-tertiary)]">
                            <span className="flex items-center justify-center w-8 h-8 rounded-md bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-bold text-sm">X</span>
                            <span className="text-sm font-medium truncate flex-1">
                              {toBigIntSafe(player1) === myAddrBI ? "You" : player1Name || `${player1.slice(0, 6)}...${player1.slice(-4)}`}
                            </span>
                            {toBigIntSafe(current) === toBigIntSafe(player1) && gameState === "playing" && (
                              <span className="text-xs text-[var(--accent-primary)] font-medium">Turn</span>
                            )}
                          </div>
                        )}
                        {player2 && player2 !== "0" ? (
                          <div className="flex items-center gap-3 p-2 rounded-lg bg-[var(--bg-tertiary)]">
                            <span className="flex items-center justify-center w-8 h-8 rounded-md bg-[var(--accent-warm)]/10 text-[var(--accent-warm)] font-bold text-sm">O</span>
                            <span className="text-sm font-medium truncate flex-1">
                              {toBigIntSafe(player2) === myAddrBI ? "You" : player2Name || `${player2.slice(0, 6)}...${player2.slice(-4)}`}
                            </span>
                            {toBigIntSafe(current) === toBigIntSafe(player2) && gameState === "playing" && (
                              <span className="text-xs text-[var(--accent-warm)] font-medium">Turn</span>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-[var(--text-tertiary)] p-2">
                            Waiting for player 2...
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Current Turn */}
                    {gameState === "playing" && (
                      <div>
                        <div className="text-xs text-[var(--text-tertiary)] mb-2 uppercase tracking-wide">Current Turn</div>
                        <div className={`text-sm font-semibold ${toBigIntSafe(current) === myAddrBI ? "text-[var(--accent-primary)]" : "text-[var(--text-secondary)]"}`}>
                          {toBigIntSafe(current) === myAddrBI ? "Your turn!" : "Opponent's turn"}
                        </div>
                      </div>
                    )}

                    {/* Share Game Link */}
                    {gameState === "waiting" && (
                      <div className="pt-4 border-t border-[var(--border-secondary)]">
                        <div className="text-xs text-[var(--text-tertiary)] mb-3 uppercase tracking-wide">Share Game</div>
                        <button
                          onClick={() => {
                            const url = window.location.href;
                            navigator.clipboard.writeText(url);
                            setStatus("✅ Link copied to clipboard!");
                          }}
                          className="btn btn-primary w-full mb-2"
                        >
                          Copy Game Link
                        </button>
                        {showCancelButton && (
                          <button
                            onClick={cancelGame}
                            className="btn btn-secondary w-full"
                            style={{borderColor: 'var(--status-error)', color: 'var(--status-error)'}}
                          >
                            Cancel Game
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </aside>
              </ScrollReveal>
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/games"
                className="btn btn-secondary inline-flex items-center gap-2"
              >
                <span>←</span>
                <span>Back to Games</span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


