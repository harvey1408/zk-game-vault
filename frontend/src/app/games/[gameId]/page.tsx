"use client";

import { ParticleBackground } from "@/components/ParticleBackground";
import { WalletConnect } from "@/components/WalletConnect";
import ScrollReveal from "@/components/ScrollReveal";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    const run = async () => {
      try {
        if (!account) return;
        const contract = getTicTacToeContract(account);
        if (!contract) return;
        const game: any = await contract.call("get_game", [gameId]);
        const b = [game?.board1, game?.board2, game?.board3, game?.board4, game?.board5, game?.board6, game?.board7, game?.board8, game?.board9].map((x: any) => Number(x ?? 0));
        setBoard(b);
        setCurrent(String(game?.current_player ?? ""));
      } catch {}
    };
    run();
  }, [account, gameId]);

  const play = async (pos: number) => {
    try {
      setStatus("");
      if (!account) { setStatus('Wallet not connected.'); return; }
      const contract = getTicTacToeContract(account);
      if (!contract) { setStatus('Contract not configured.'); return; }
      // Example user_id from storage
      let userIdStr = '';
      try { userIdStr = localStorage.getItem('zkgv_user_id') || ''; } catch {}
      if (!userIdStr) { setStatus('user_id missing. Create identity first.'); return; }
      const userId = BigInt(userIdStr);
      const tx: any = await contract.invoke("make_move", [gameId, pos + 1, userId]);
      await account.waitForTransaction(tx?.transaction_hash ?? tx?.hash);
      setStatus('Move submitted');
    } catch (e: any) {
      setStatus(e?.message || 'Failed to make move');
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
          <div className="max-w-xl mx-auto text-center">
            <ScrollReveal>
              <h1 className="text-3xl md:text-5xl font-black text-header mb-6 gradient-text-holographic leading-tight">
                Tic-Tac-Toe
              </h1>
            </ScrollReveal>
            <div className="grid grid-cols-3 gap-3 mx-auto w-full max-w-sm">
              {board.map((cell, idx) => (
                <button key={idx} onClick={() => play(idx)} className="h-24 md:h-28 rounded-xl holographic-border backdrop-void interactive-glow text-3xl font-black">
                  {cell === 1 ? 'X' : cell === 2 ? 'O' : ''}
                </button>
              ))}
            </div>
            {status && (<div className="mt-4 text-sm text-[var(--text-secondary)]">{status}</div>)}
            {current && (<div className="mt-1 text-xs text-[var(--text-secondary)]">Current player: <span className="font-mono">{current}</span></div>)}
          </div>
        </main>
      </div>
    </div>
  );
}


