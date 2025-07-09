// src/components/Leaderboard.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { getContract } from '../lib/contract';
import { getChallenges } from '../lib/contract';

interface ScoreEntry {
  address: string;
  activeScore: string;
  inactiveScore: string;
  totalScore: string;
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
        const activeChallenges = await contract.getChallenges();
        const activeChallengeIds = activeChallenges.map((c: any) => Number(c.challengeId));
        const entries: ScoreEntry[] = [];
        for (let i = 0; i < addresses.length; i++) {
          const addr = addresses[i];
          let activeScore = 0;
          let inactiveScore = 0;
          // Calculate active score
          for (const ch of activeChallenges) {
            const solved = await contract.isChallengeSolved(addr, Number(ch.challengeId));
            if (solved) activeScore += Number(ch.reward);
          }
          // Inactive score = totalScore - activeScore
          const totalScore = Number(scoreValues[i]);
          inactiveScore = totalScore - activeScore;
          entries.push({
            address: addr,
            activeScore: activeScore.toString(),
            inactiveScore: inactiveScore.toString(),
            totalScore: totalScore.toString(),
          });
        }
        // Sort by activeScore descending
        entries.sort((a, b) => Number(b.activeScore) - Number(a.activeScore));
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
    return (
      <>
        <style jsx>{`
          .shimmer {
            position: relative;
            overflow: hidden;
          }
          .shimmer::after {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            z-index: 2;
            pointer-events: none;
            background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0) 100%);
            animation: shimmer 1.1s linear infinite;
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
        <div className="w-full">
          <div className="h-8 w-1/3 bg-gray-700 rounded mb-4 shimmer" />
          <div className="bg-gradient-to-br from-[#232946] to-[#181c2f] border border-[#2e335a] shadow-xl rounded-xl overflow-hidden">
            <div className="h-12 w-full bg-gray-800 shimmer" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 px-4 py-3 border-t border-[#2e335a]">
                <div className="h-6 w-8 bg-gray-700 rounded shimmer" />
                <div className="h-6 w-32 bg-gray-700 rounded shimmer" />
                <div className="h-6 w-20 bg-gray-800 rounded shimmer" />
                <div className="h-6 w-20 bg-gray-800 rounded shimmer" />
                <div className="h-6 w-20 bg-gray-800 rounded shimmer" />
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <section className="mt-14">
      <div className="overflow-x-auto">
        <table className="w-full text-left rounded-xl overflow-hidden bg-gradient-to-br from-[#232946] to-[#181c2f] border border-[#2e335a] shadow-xl">
          <thead>
            <tr className="bg-[#232946] text-blue-200">
              <th className="py-3 px-4 font-bold tracking-wide text-sm">Rank</th>
              <th className="py-3 px-4 font-bold tracking-wide text-sm">Address</th>
              <th className="py-3 px-4 font-bold tracking-wide text-sm">Active Score</th>
              <th className="py-3 px-4 font-bold tracking-wide text-sm">Inactive Score</th>
              <th className="py-3 px-4 font-bold tracking-wide text-sm">Total Score</th>
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
                  <td className="py-3 px-4 font-mono text-green-300 font-bold">{entry.activeScore}</td>
                  <td className="py-3 px-4 font-mono text-yellow-300 font-bold">{entry.inactiveScore}</td>
                  <td className="py-3 px-4 font-mono text-pink-300 font-bold">{entry.totalScore}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
