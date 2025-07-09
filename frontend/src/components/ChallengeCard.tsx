'use client';

import React, { useEffect, useState, useRef } from 'react';
import { getContract, getSigner, getChallenge, updateChallenge, getPlayerAddresses } from '../lib/contract';
import { ethers } from 'ethers';
import { createPortal } from 'react-dom';
import Modal from './Modal';

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
  onUpdated?: () => void;
  onShowToast?: (toast: { message: string; type: 'success' | 'error' }) => void;
}

export default function ChallengeCard({ challenge, onSolved, isOwner, onDelete, deleting, onUpdated, onShowToast }: ChallengeCardProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [metadata, setMetadata] = useState<{ name: string; description: string; category: string; flagText?: string } | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [flag, setFlag] = useState('');
  const [loading, setLoading] = useState(false);
  const [submissionFee, setSubmissionFee] = useState<string>('');
  const [editing, setEditing] = useState(false);
  const [editFlag, setEditFlag] = useState('');
  const [editReward, setEditReward] = useState('');
  const [editIpfs, setEditIpfs] = useState('');
  const [editDifficulty, setEditDifficulty] = useState('');
  const [editSubmissionFee, setEditSubmissionFee] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [solvedCount, setSolvedCount] = useState<number | null>(null);

  // Place this at the top level inside your component, after state declarations
  async function fetchSolvedCount() {
    let cancelled = false;
    try {
      const addresses = await getPlayerAddresses();
      const contract = await getContract();
      let count = 0;
      await Promise.all(addresses.map(async (addr: string) => {
        const solved = await contract.isChallengeSolved(addr, Number(challenge.challengeId));
        if (solved) count++;
      }));
      if (!cancelled) setSolvedCount(count);
    } catch {
      if (!cancelled) setSolvedCount(null);
    }
  }

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

  useEffect(() => {
    if (editing && metadata) {
      setEditFlag(metadata.flagText || '');
      setEditReward(challenge.reward.toString());
      setEditIpfs(challenge.ipfsHash);
      setEditDifficulty(challenge.difficulty.toString());
      setEditSubmissionFee(submissionFee);
      setEditName(metadata.name);
      setEditDescription(metadata.description);
      setEditCategory(metadata.category);
    }
  }, [editing, challenge, submissionFee, metadata]);

  useEffect(() => {
    fetchSolvedCount();
  }, [challenge.challengeId]);

  const submit = async () => {
    setLoading(true);
    try {
      const signer = await getSigner();
      const c = await getContract(true);
      const tx = await c.submitFlag(Number(challenge.challengeId), flag, { value: submissionFee });
      await tx.wait();
      const sol = await c.isChallengeSolved(await signer.getAddress(), Number(challenge.challengeId));
      setIsSolved(sol);
      if (sol) {
        if (onShowToast) onShowToast({ message: '🎉 Correct! You solved the challenge.', type: 'success' });
        if (onSolved) onSolved();
        fetchSolvedCount();
      } else {
        if (onShowToast) onShowToast({ message: '❌ Incorrect flag. Please try again!', type: 'error' });
      }
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
      } else if (!errorMsg || typeof errorMsg !== 'string') {
        errorMsg = 'An unknown error occurred. Please try again or contact support.';
      }
      if (onShowToast) onShowToast({ message: errorMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setEditLoading(true);
    try {
      // Pin new metadata to IPFS
      const res = await fetch('/api/pinMetadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, description: editDescription, category: editCategory })
      });
      if (!res.ok) throw new Error('IPFS pin failed');
      const { cid } = await res.json();
      await updateChallenge(
        Number(challenge.challengeId),
        editFlag,
        editReward,
        cid,
        Number(editDifficulty),
        editSubmissionFee
      );
      setEditing(false);
      // Re-fetch metadata after update
      try {
        const metaRes = await fetch(`https://copper-left-cephalopod-174.mypinata.cloud/ipfs/${cid}`);
        const metaData = await metaRes.json();
        setMetadata(metaData);
      } catch {
        // fallback if fetch fails
        setMetadata({ name: 'Unavailable', description: '\u0014', category: '\u0014' });
      }
      if (onShowToast) onShowToast({ message: 'Challenge updated successfully', type: 'success' });
      if (onUpdated) onUpdated();
    } catch (err: any) {
      let errorMsg = err?.reason || err?.message || 'Update failed';
      if (onShowToast) onShowToast({ message: errorMsg, type: 'error' });
    } finally {
      setEditLoading(false);
    }
  };

  if (!mounted) return null;
  if (!metadata) return (
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
      <div className="flex flex-col gap-3 p-6 h-80">
        <div className="h-6 w-2/3 bg-gray-700 rounded shimmer" />
        <div className="h-4 w-full bg-gray-800 rounded shimmer" />
        <div className="h-4 w-1/2 bg-gray-800 rounded shimmer" />
        <div className="h-4 w-1/3 bg-gray-800 rounded shimmer" />
        <div className="h-8 w-full bg-gray-700 rounded mt-4 shimmer" />
        <div className="h-4 w-1/4 bg-gray-800 rounded mt-2 shimmer" />
        <div className="h-10 w-full bg-gray-700 rounded mt-4 shimmer" />
      </div>
    </>
  );
  return (
    <div className={`bg-gradient-to-br from-[#232946] to-[#181c2f] border border-[#2e335a] rounded-2xl shadow-xl p-6 flex flex-col min-h-[340px] relative overflow-hidden group transition-transform duration-200 hover:scale-[1.03] ${editing ? 'ring-4 ring-blue-400 border-blue-400 bg-[#1a2540]' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-bold text-lg text-blue-200 tracking-tight flex-1">{metadata.name}</h3>
        {isSolved && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-600/80 text-xs text-white rounded-full font-semibold shadow-lg animate-pulse">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            Solved
          </span>
        )}
        {isOwner && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-600/80 text-xs text-white rounded-full font-semibold shadow-lg hover:bg-blue-700/80 transition ml-auto disabled:opacity-60"
            title="Edit Challenge"
            disabled={deleting}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Edit
          </button>
        )}
        {isOwner && editing && (
          <button
            onClick={() => setEditing(false)}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-600/80 text-xs text-white rounded-full font-semibold shadow-lg hover:bg-gray-700/80 transition ml-auto"
            title="Cancel Edit"
          >
            Cancel
          </button>
        )}
        {isOwner && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
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
      <div className="flex items-center mb-2">
        <p className="text-sm text-gray-200 flex-1 line-clamp-3 mb-0">{metadata.description}</p>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-700/80 text-xs text-white rounded-full font-semibold shadow-lg ml-2" title="Number of users who solved this challenge">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-5a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          {solvedCount ?? 0} solved
        </span>
      </div>
      <p className="text-xs text-purple-300 mb-4">Category: {metadata.category}</p>
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-pink-300 font-semibold">Reward: <span className="font-mono">{challenge.reward} wei</span></span>
        <span className="text-yellow-300 font-semibold">Difficulty: {challenge.difficulty}</span>
      </div>
      <div className="text-xs text-blue-300 mb-2">Submission Fee: <span className="font-mono">{submissionFee} wei</span></div>
      {editing ? (
        <>
          <hr className="my-3 border-blue-700/40" />
          <div className="space-y-2 mb-2">
            <div>
              <label className="block text-xs text-blue-200">Name</label>
              <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-[#181c2f] border border-[#2e335a] text-gray-100 px-2 py-1 rounded" placeholder="Challenge name" />
            </div>
            <div>
              <label className="block text-xs text-blue-200">Description</label>
              <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} className="w-full bg-[#181c2f] border border-[#2e335a] text-gray-100 px-2 py-1 rounded" placeholder="Challenge description" />
            </div>
            <div>
              <label className="block text-xs text-blue-200">Category</label>
              <input value={editCategory} onChange={e => setEditCategory(e.target.value)} className="w-full bg-[#181c2f] border border-[#2e335a] text-gray-100 px-2 py-1 rounded" placeholder="Category" />
            </div>
            <div>
              <label className="block text-xs text-blue-200">Flag Text</label>
              <input value={editFlag} onChange={e => setEditFlag(e.target.value)} className="w-full bg-[#181c2f] border border-[#2e335a] text-gray-100 px-2 py-1 rounded" placeholder="Enter new flag text" disabled />
            </div>
            <div>
              <label className="block text-xs text-pink-200">Reward (wei)</label>
              <input type="number" value={editReward} onChange={e => setEditReward(e.target.value)} className="w-full bg-[#181c2f] border border-[#2e335a] text-gray-100 px-2 py-1 rounded" />
            </div>
            <div>
              <label className="block text-xs text-purple-200">Difficulty</label>
              <select value={editDifficulty} onChange={e => setEditDifficulty(e.target.value)} className="w-full bg-[#181c2f] border border-[#2e335a] text-gray-100 px-2 py-1 rounded">
                {[1,2,3,4,5].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-blue-300">Submission Fee (wei)</label>
              <input type="number" value={editSubmissionFee} onChange={e => setEditSubmissionFee(e.target.value)} className="w-full bg-[#181c2f] border border-[#2e335a] text-gray-100 px-2 py-1 rounded" />
            </div>
            <button onClick={handleSave} disabled={editLoading} className="w-full bg-green-600 text-white rounded py-2 font-bold mt-2 disabled:opacity-60">{editLoading ? 'Saving…' : 'Save'}</button>
          </div>
        </>
      ) : (
        <div className="mt-auto">
          <div className="relative">
            <input
              value={isSolved ? '' : flag}
              onChange={e => setFlag(e.target.value)}
              placeholder="Enter flag"
              className="w-full mb-2 bg-[#181c2f] border border-[#2e335a] text-gray-100 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-60 pr-10"
              disabled={loading || isSolved}
            />
          </div>
          <button
            onClick={submit}
            disabled={loading || !flag || isSolved}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg font-semibold shadow hover:from-blue-500 hover:to-purple-500 transition disabled:opacity-50"
          >
            {isSolved ? (
              <span className="inline-flex items-center justify-center gap-2">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                Solved
              </span>
            ) : loading ? '…' : 'Submit Flag'}
          </button>
        </div>
      )}
      {showDeleteConfirm && (
        <Modal open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
          <div className="flex flex-col items-center">
            <div className="mb-2 text-red-400">
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M12 9v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9Z" /><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /></svg>
            </div>
            <h2 className="text-lg font-bold text-red-400 mb-2">Are you sure?</h2>
            <p className="text-sm text-blue-100 mb-4">This action cannot be undone.</p>
            <div className="flex gap-2 justify-center w-full">
              <button
                className="flex-1 px-4 py-2 rounded bg-gray-600 text-white font-semibold hover:bg-gray-700 transition"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-60"
                onClick={() => { setShowDeleteConfirm(false); if (onDelete) onDelete(); }}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
