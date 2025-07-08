// src/components/Leaderboard.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { getContract } from '../lib/contract';

interface ScoreEntry {
  address: string;
  score: string;
}

interface LeaderboardProps {
  networkName: string | null;
  message: string | null;
  refresh?: number;
}

export default function Leaderboard({ networkName, message, refresh }: LeaderboardProps) {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (networkName?.toLowerCase() !== 'sepolia' || message) {
      setLoading(false);
      return;
    }
    async function loadScores() {
      try {
        const contract = await getContract();
        const [addresses, scoreValues] = await contract.getScores();
        const entries: ScoreEntry[] = addresses.map((addr: string, idx: number) => ({
          address: addr,
          score: scoreValues[idx].toString(),
        }));
        // Sort descending by score
        entries.sort((a, b) => Number(b.score) - Number(a.score));
        setScores(entries);
      } catch (err) {
        console.error('Error loading leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadScores();
  }, [networkName, message, refresh]);

  if (!mounted) return null;

  if (loading) {
    return <div className="flex items-center gap-3 text-lg text-blue-200 animate-pulse"><svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="4" className="opacity-25"/><path d="M4 12a8 8 0 018-8" strokeWidth="4" className="opacity-75"/></svg>Loading leaderboard…</div>;
  }

  return (
    <section className="mt-14">
      <div className="overflow-x-auto">
        <table className="w-full text-left rounded-xl overflow-hidden bg-gradient-to-br from-[#232946] to-[#181c2f] border border-[#2e335a] shadow-xl">
          <thead>
            <tr className="bg-[#232946] text-blue-200">
              <th className="py-3 px-4 font-bold tracking-wide text-sm">Rank</th>
              <th className="py-3 px-4 font-bold tracking-wide text-sm">Address</th>
              <th className="py-3 px-4 font-bold tracking-wide text-sm">Score</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((entry, idx) => {
              const short = `${entry.address.substring(0,6)}...${entry.address.substring(entry.address.length - 4)}`;
              return (
                <tr
                  key={entry.address}
                  className={`border-t border-[#2e335a] transition bg-[#181c2f] hover:bg-[#232946]/80 ${idx === 0 ? 'bg-gradient-to-r from-yellow-400/20 to-yellow-700/10' : ''}`}
                >
                  <td className="py-3 px-4 font-semibold text-purple-300">{idx + 1}</td>
                  <td className="py-3 px-4 font-mono text-gray-100">{short}</td>
                  <td className="py-3 px-4 font-mono text-pink-300 font-bold">{entry.score}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
