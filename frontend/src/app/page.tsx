'use client';

import { useEffect, useState } from 'react';
import { getContract, getProvider } from '../lib/contract';
import ConnectButton, { connectWallet } from '../components/ConnectButton';
import ChallengeCard from '../components/ChallengeCard';
import Leaderboard from '../components/Leaderboard';
import AdminPanel from '../components/AdminPanel';
import { ethers } from 'ethers';
import Header from '../components/Header';

interface RawChallenge {
  challengeId: string;
  flagHash: string;
  reward: string;
  ipfsHash: string;
  difficulty: number;
  category?: string;
  submissionFee?: string;
  name: string;
  description: string;
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [challenges, setChallenges] = useState<RawChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [networkName, setNetworkName] = useState<string | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [leaderboardRefresh, setLeaderboardRefresh] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  // Filter state
  const [filterCategory, setFilterCategory] = useState('');
  const [filterRewardMin, setFilterRewardMin] = useState('');
  const [filterRewardMax, setFilterRewardMax] = useState('');
  const [filterFeeMin, setFilterFeeMin] = useState('');
  const [filterFeeMax, setFilterFeeMax] = useState('');

  // Challenge loading logic as a reusable function
  const loadChallenges = async () => {
    setLoading(true);
    try {
      const contract = await getContract();
      const raw: any[] = await contract.getChallenges();
      // Fetch metadata for all challenges in parallel
      const challengesWithMeta = await Promise.all(
        raw.map(async (x: any) => {
          let meta = { name: '', description: '', category: '' };
          if (x.ipfsHash) {
            try {
              const res = await fetch(`https://copper-left-cephalopod-174.mypinata.cloud/ipfs/${x.ipfsHash}`);
              meta = await res.json();
            } catch {}
          }
          return {
            challengeId: x.challengeId.toString(),
            flagHash: x.flagHash,
            reward: x.reward.toString(),
            ipfsHash: x.ipfsHash,
            difficulty: Number(x.difficulty),
            submissionFee: x.submissionFee?.toString(),
            category: meta.category || '',
            name: meta.name || '',
            description: meta.description || '',
          };
        })
      );
      setChallenges(challengesWithMeta);
    } catch {
      setMessage('Failed to load challenges. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Add deleteChallenge function
  const deleteChallenge = async (challengeId: string) => {
    if (!window.confirm('Are you sure you want to delete this challenge?')) return;
    setDeletingId(challengeId);
    try {
      const contract = await getContract(true);
      const tx = await contract.deleteChallenge(challengeId);
      await tx.wait();
      setToast({ message: 'Challenge deleted successfully.', type: 'success' });
      await loadChallenges();
    } catch (err: any) {
      let errorMsg = err?.reason || err?.message || 'Delete failed';
      if (err?.error?.message) errorMsg = err.error.message;
      setToast({ message: errorMsg, type: 'error' });
    } finally {
      setDeletingId(null);
    }
  };

  // Check wallet connection on mount
  useEffect(() => {
    async function checkConnection() {
      try {
        const provider = getProvider();
        const accounts = await provider.send('eth_accounts', []);
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount(null);
        }
      } catch (err: any) {
        // Handle user rejection of wallet connection
        let errorMsg = err?.message || '';
        if (
          errorMsg.includes('user rejected action') ||
          errorMsg.includes('User rejected the request') ||
          errorMsg.includes('User denied account authorization')
        ) {
          setMessage('You rejected the wallet connection request. Please connect your wallet to use the app.');
        }
        setAccount(null);
      }
    }
    checkConnection();
  }, []);

  // Check owner status whenever account changes
  useEffect(() => {
    async function checkOwner() {
      if (!account) {
        setIsOwner(false);
        return;
      }
      const contract = await getContract();
      const ownerAddr = await contract.owner();
      setIsOwner(account.toLowerCase() === ownerAddr.toLowerCase());
    }
    checkOwner();
  }, [account]);

  // Network and challenge loading
  useEffect(() => {
    if (!account) return;
    async function init() {
      // 1) Check network
      try {
        const provider = getProvider();
        const { chainId, name } = await provider.getNetwork();
        setNetworkName(name);
        if (name.toLowerCase() !== 'sepolia') {
          setMessage(`Please switch your wallet network to Sepolia Testnet. (Current: ${name})`);
          setLoading(false);
          return;
        }
      } catch {
        setMessage('Unable to detect network. Make sure MetaMask is available.');
        setLoading(false);
        return;
      }
      await loadChallenges();
    }
    init();
  }, [account]);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Extract unique categories from challenges
  const categories = Array.from(new Set(challenges.map((ch) => ch.category).filter(Boolean)));

  // Filtering logic
  const filteredChallenges = challenges
    .filter((ch) => ch.reward !== '0' && ch.difficulty !== 0)
    .filter((ch) => {
      if (filterCategory && ch.category !== filterCategory) return false;
      if (filterRewardMin && Number(ch.reward) < Number(filterRewardMin)) return false;
      if (filterRewardMax && Number(ch.reward) > Number(filterRewardMax)) return false;
      if (filterFeeMin && Number(ch.submissionFee || 0) < Number(filterFeeMin)) return false;
      if (filterFeeMax && Number(ch.submissionFee || 0) > Number(filterFeeMax)) return false;
      return true;
    });

  // Show connect wallet page if not connected
  if (!mounted) return null;
  if (!account) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#181c2f] via-[#232946] to-[#121212] text-gray-100">
        <div className="bg-[#232946] border border-[#2e335a] rounded-2xl shadow-2xl p-10 flex flex-col items-center">
          <img src="/icon.png" alt="SmartChallenge Icon" className="w-32 h-32 rounded-full shadow-lg mb-6" />
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">SmartChallenge</h1>
          {message && (
            <div className="mb-4 px-4 py-2 rounded-lg font-semibold text-sm bg-red-700/80 text-red-200">
              {message}
            </div>
          )}
          <p className="mb-8 text-lg text-blue-200">Connect your wallet to get started</p>
          <button
            onClick={() => connectWallet(setAccount, setMessage)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow hover:from-blue-500 hover:to-purple-500 transition"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#181c2f] via-[#232946] to-[#121212] text-gray-100 font-sans">
      <Header account={account} setAccount={setAccount} isOwner={isOwner} />
      <main className="max-w-7xl mx-auto p-6">
        {/* Toast notification */}
        {toast && (
          <div
            className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg font-bold text-lg animate-fade-in ${toast.type === 'success' ? 'bg-green-700 text-green-100' : 'bg-red-700 text-red-100'}`}
          >
            {toast.message}
          </div>
        )}
        {/* Filter Controls */}
        <section className="mb-8 bg-[#232946] border border-[#2e335a] rounded-xl p-4 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-blue-200 mb-1">Category</label>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="bg-[#181c2f] border border-[#2e335a] text-gray-100 px-3 py-2 rounded-lg focus:outline-none"
            >
              <option value="">All</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-blue-200 mb-1">Reward Min (wei)</label>
            <input
              type="number"
              value={filterRewardMin}
              onChange={e => setFilterRewardMin(e.target.value)}
              className="bg-[#181c2f] border border-[#2e335a] text-gray-100 px-3 py-2 rounded-lg focus:outline-none w-32"
              min={0}
              placeholder="Min"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-blue-200 mb-1">Reward Max (wei)</label>
            <input
              type="number"
              value={filterRewardMax}
              onChange={e => setFilterRewardMax(e.target.value)}
              className="bg-[#181c2f] border border-[#2e335a] text-gray-100 px-3 py-2 rounded-lg focus:outline-none w-32"
              min={0}
              placeholder="Max"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-blue-200 mb-1">Fee Min (wei)</label>
            <input
              type="number"
              value={filterFeeMin}
              onChange={e => setFilterFeeMin(e.target.value)}
              className="bg-[#181c2f] border border-[#2e335a] text-gray-100 px-3 py-2 rounded-lg focus:outline-none w-32"
              min={0}
              placeholder="Min"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-blue-200 mb-1">Fee Max (wei)</label>
            <input
              type="number"
              value={filterFeeMax}
              onChange={e => setFilterFeeMax(e.target.value)}
              className="bg-[#181c2f] border border-[#2e335a] text-gray-100 px-3 py-2 rounded-lg focus:outline-none w-32"
              min={0}
              placeholder="Max"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setFilterCategory('');
              setFilterRewardMin('');
              setFilterRewardMax('');
              setFilterFeeMin('');
              setFilterFeeMax('');
            }}
            className="ml-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg font-semibold shadow"
          >
            Reset
          </button>
        </section>
        {/* Only show Available Challenges if there is no network error message */}
        {message ? (
          <div className="p-5 mb-6 bg-gradient-to-r from-yellow-500/20 to-yellow-700/20 text-yellow-200 border-l-4 border-yellow-400 rounded-lg shadow">
            {message}
          </div>
        ) : (
          <section>
            <h2 className="text-2xl font-bold mb-6 tracking-tight text-blue-300">Available Challenges</h2>
            {loading ? (
              <div className="flex items-center gap-3 text-lg text-blue-200 animate-pulse">
                <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="4" className="opacity-25"/><path d="M4 12a8 8 0 018-8" strokeWidth="4" className="opacity-75"/></svg>
                Loading challenges…
              </div>
            ) : challenges.length === 0 ? (
              <div className="text-center text-blue-200 text-lg py-10">No challenges available yet.</div>
            ) : (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {filteredChallenges.map((ch) => (
                  <div key={ch.challengeId} className="bg-[#232946] rounded-xl shadow-lg border border-[#2e335a] hover:scale-[1.03] transition-transform duration-200">
                    <ChallengeCard
                      challenge={ch}
                      onSolved={() => setLeaderboardRefresh(x => x + 1)}
                      isOwner={isOwner}
                      onDelete={() => deleteChallenge(ch.challengeId)}
                      deleting={deletingId === ch.challengeId}
                      onUpdated={loadChallenges}
                      onShowToast={setToast}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {!message && (
          <section id="leaderboard" className="mt-14">
            <h2 className="text-2xl font-bold mb-6 tracking-tight text-purple-300">Leaderboard</h2>
            <div className="bg-[#232946] rounded-xl shadow-lg border border-[#2e335a] p-6">
              <Leaderboard networkName={networkName} message={message} refresh={leaderboardRefresh} />
            </div>
          </section>
        )}
      </main>
      {/* Floating plus button for admin panel */}
      {/* {isOwner && (
        <button
          onClick={() => setAdminOpen(true)}
          className="fixed bottom-8 right-8 z-50 w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 to-blue-500 shadow-2xl flex items-center justify-center text-white text-4xl hover:scale-110 transition"
          aria-label="Add Challenge"
        >
          +
        </button>
      )} */}
      {/* AdminPanel pop-up */}
      {/* {adminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="relative w-full max-w-2xl mx-auto">
            <button
              onClick={() => setAdminOpen(false)}
              className="absolute top-4 right-4 text-2xl text-gray-300 hover:text-white z-10"
              aria-label="Close"
            >
              &times;
            </button>
            <AdminPanel onChallengeAdded={() => { setAdminOpen(false); loadChallenges(); }} />
          </div>
        </div>
      )} */}
    </div>
  );
}
