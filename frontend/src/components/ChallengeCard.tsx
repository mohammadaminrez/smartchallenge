'use client';

import React, { useEffect, useState } from 'react';
import { getContract, getSigner, getChallenge } from '../lib/contract';
import { ethers } from 'ethers';

interface Challenge {
  challengeId: string;
  flagHash: string;
  reward: string;
  ipfsHash: string;
  difficulty: number;
}

interface ChallengeCardProps {
  challenge: Challenge;
  onSolved?: () => void;
  isOwner?: boolean;
  onDelete?: () => void;
  deleting?: boolean;
}

export default function ChallengeCard({ challenge, onSolved, isOwner, onDelete, deleting }: ChallengeCardProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [metadata, setMetadata] = useState<{ name:string; description:string; category:string }|null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [flag, setFlag] = useState('');
  const [msg, setMsg] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const [submissionFee, setSubmissionFee] = useState<string>('');

  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await fetch(`https://copper-left-cephalopod-174.mypinata.cloud/ipfs/${challenge.ipfsHash}`);
        const data = await res.json();
        setMetadata(data);
      } catch {
        setMetadata({ name:'Unavailable', description:'\u0014', category:'\u0014' });
      }
    }
    loadMeta();
    // Fetch per-challenge submission fee
    async function fetchFee() {
      const c = await getChallenge(Number(challenge.challengeId));
      setSubmissionFee(c.submissionFee.toString());
    }
    fetchFee();
  }, [challenge.ipfsHash, challenge.challengeId]);

  useEffect(() => {
    async function check() {
      const signer = await getSigner();
      const addr = await signer.getAddress();
      const c = await getContract();
      const sol = await c.isChallengeSolved(addr, Number(challenge.challengeId));
      setIsSolved(sol);
    }
    check();
  }, [challenge.challengeId]);

  const submit = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const signer = await getSigner();
      const c = await getContract(true);
      const tx = await c.submitFlag(Number(challenge.challengeId), flag, { value: submissionFee });
      await tx.wait();
      const sol = await c.isChallengeSolved(await signer.getAddress(), Number(challenge.challengeId));
      setIsSolved(sol);
      setMsg(sol ? '🎉 Correct! You solved the challenge.' : 'Incorrect flag. Please try again!');
      if (sol && onSolved) onSolved();
    } catch (e:any) {
      // Handle known errors
      let errorMsg = e.message;
      if (errorMsg.includes('Pausable: paused')) {
        errorMsg = 'The contract is currently paused. Please try again later.';
      } else if (errorMsg.includes('user rejected action') || errorMsg.includes('User denied transaction signature')) {
        errorMsg = 'You rejected the transaction. No changes were made.';
      } else if (errorMsg.includes('insufficient funds')) {
        errorMsg = 'You do not have enough wei in your wallet to pay for the transaction (gas and value).';
      } else if (errorMsg.includes('Already solved')) {
        errorMsg = 'You have already solved this challenge.';
      } else if (errorMsg.includes('Flag is empty')) {
        errorMsg = 'Please enter a flag before submitting.';
      } else if (errorMsg.includes('Insufficient fee')) {
        errorMsg = 'You need to pay the required fee to submit a flag.';
      } else if (
        e.code === 'CALL_EXCEPTION' ||
        errorMsg.includes('missing revert data') ||
        errorMsg.includes('execution reverted')
      ) {
        errorMsg = 'Contract does not have enough wei to pay the reward.';
      }
      setMsg(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;
  if (!metadata) return <div className="flex items-center justify-center h-40 text-blue-200 animate-pulse">Loading</div>;
  return (
    <div className="bg-gradient-to-br from-[#232946] to-[#181c2f] border border-[#2e335a] rounded-2xl shadow-xl p-6 flex flex-col min-h-[340px] relative overflow-hidden group transition-transform duration-200 hover:scale-[1.03]">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-bold text-lg text-blue-200 tracking-tight flex-1">{metadata.name}</h3>
        {isSolved && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-600/80 text-xs text-white rounded-full font-semibold shadow-lg animate-pulse">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            Solved
          </span>
        )}
        {isOwner && (
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-600/80 text-xs text-white rounded-full font-semibold shadow-lg hover:bg-red-700/80 transition ml-auto disabled:opacity-60"
            title="Delete Challenge"
            disabled={deleting}
          >
            {deleting ? (
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="4" className="opacity-25"/><path d="M4 12a8 8 0 018-8" strokeWidth="4" className="opacity-75"/></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            )}
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        )}
      </div>
      <p className="text-sm text-gray-200 mb-2 line-clamp-3">{metadata.description}</p>
      <p className="text-xs text-purple-300 mb-4">Category: {metadata.category}</p>
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-pink-300 font-semibold">Reward: <span className="font-mono">{challenge.reward} wei</span></span>
        <span className="text-yellow-300 font-semibold">Difficulty: {challenge.difficulty}</span>
      </div>
      {!isSolved ? (
        <div className="mt-auto">
          <input
            value={flag}
            onChange={e => setFlag(e.target.value)}
            placeholder="Enter flag"
            className="w-full mb-2 bg-[#181c2f] border border-[#2e335a] text-gray-100 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-60"
            disabled={loading}
          />
          <div className="text-xs text-blue-300 mb-2">Submission Fee: <span className="font-mono">{submissionFee} wei</span></div>
          <button
            onClick={submit}
            disabled={loading || !flag}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg font-semibold shadow hover:from-blue-500 hover:to-purple-500 transition disabled:opacity-50"
          >
            {loading ? '…' : 'Submit Flag'}
          </button>
          {msg && <p className={`mt-2 text-sm ${msg === 'Correct!' ? 'text-green-400' : 'text-red-400'}`}>{msg}</p>}
        </div>
      ) : (
        <div className="mt-auto text-green-400 font-bold text-center text-lg flex flex-col items-center gap-1">
          <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          Challenge Solved!
        </div>
      )}
    </div>
  );
}
