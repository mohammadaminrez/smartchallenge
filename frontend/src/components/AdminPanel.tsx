'use client';

import React, { useEffect, useState } from 'react';
import { getContract, getProvider } from '../lib/contract';
import { ethers } from 'ethers';

export default function AdminPanel({ onChallengeAdded }: { onChallengeAdded?: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [paused, setPaused] = useState(false);
  const [balance, setBalance] = useState('0');
  const [msg, setMsg] = useState<string | null>(null);
  const [pauseLoading, setPauseLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  // Challenge fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [flagText, setFlagText] = useState('');
  const [reward, setReward] = useState('');
  const [difficulty, setDifficulty] = useState('');

  const [submissionFee, setSubmissionFee] = useState('');
  const [feeInput, setFeeInput] = useState('');
  const [feeLoading, setFeeLoading] = useState(false);

  // Add 10 predefined challenge templates
  const challengeTemplates = [
    {
      name: 'Block Explorer',
      description: 'Analyze a block and extract the miner address.',
      category: 'Blockchain',
      flagText: 'block{miner_address}',
      reward: '10000000000000000',
      difficulty: '2',
      submissionFee: '1000000000000000',
    },
    {
      name: 'Hash Hunter',
      description: 'Find the hash of a given transaction.',
      category: 'Crypto',
      flagText: 'flag{tx_hash}',
      reward: '20000000000000000',
      difficulty: '3',
      submissionFee: '2000000000000000',
    },
    {
      name: 'Web3 Login',
      description: 'Authenticate using your wallet.',
      category: 'Web',
      flagText: 'web3{login_success}',
      reward: '15000000000000000',
      difficulty: '1',
      submissionFee: '500000000000000',
    },
    {
      name: 'Gas Saver',
      description: 'Optimize a contract for lower gas usage.',
      category: 'Blockchain',
      flagText: 'flag{gas_optimized}',
      reward: '25000000000000000',
      difficulty: '4',
      submissionFee: '3000000000000000',
    },
    {
      name: 'Signature Check',
      description: 'Verify a digital signature.',
      category: 'Crypto',
      flagText: 'sig{verified}',
      reward: '12000000000000000',
      difficulty: '2',
      submissionFee: '1000000000000000',
    },
    {
      name: 'NFT Detective',
      description: 'Find the owner of a specific NFT.',
      category: 'Blockchain',
      flagText: 'nft{owner}',
      reward: '18000000000000000',
      difficulty: '3',
      submissionFee: '1500000000000000',
    },
    {
      name: 'Smart Contract Audit',
      description: 'Identify a vulnerability in a contract.',
      category: 'Blockchain',
      flagText: 'audit{vuln_found}',
      reward: '30000000000000000',
      difficulty: '5',
      submissionFee: '5000000000000000',
    },
    {
      name: 'Token Tracker',
      description: 'Track the transfer of a token.',
      category: 'Crypto',
      flagText: 'token{transfer}',
      reward: '11000000000000000',
      difficulty: '1',
      submissionFee: '800000000000000',
    },
    {
      name: 'Oracle Quest',
      description: 'Use an oracle to fetch off-chain data.',
      category: 'Web',
      flagText: 'oracle{data_fetched}',
      reward: '22000000000000000',
      difficulty: '4',
      submissionFee: '2500000000000000',
    },
    {
      name: 'Wallet Watcher',
      description: 'Monitor wallet activity for suspicious transactions.',
      category: 'Blockchain',
      flagText: 'wallet{activity}',
      reward: '17000000000000000',
      difficulty: '2',
      submissionFee: '1200000000000000',
    },
  ];

  // Add random fill handler
  const handleRandomFill = () => {
    const random = challengeTemplates[Math.floor(Math.random() * challengeTemplates.length)];
    setName(random.name);
    setDescription(random.description);
    setCategory(random.category);
    setFlagText(random.flagText);
    setReward(random.reward);
    setDifficulty(random.difficulty);
    setSubmissionFee(random.submissionFee);
  };

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    async function loadAdminState() {
      const contract = await getContract();
      const ownerAddr = await contract.owner();
      const provider = getProvider();
      const accounts = await (provider as any).send('eth_accounts', []);
      setIsOwner(accounts[0]?.toLowerCase() === ownerAddr.toLowerCase());
      setPaused(await contract.paused());
      const bal = await provider.getBalance(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!);
      setBalance(bal.toString());
    }
    loadAdminState();
  }, []);

  const addChallenge = async () => {
    setMsg(null);
    setAddLoading(true);
    // Input validations
    if (!name.trim()) {
      setMsg('Name is required');
      setAddLoading(false);
      return;
    }
    if (!description.trim()) {
      setMsg('Description is required');
      setAddLoading(false);
      return;
    }
    if (!category.trim()) {
      setMsg('Category is required');
      setAddLoading(false);
      return;
    }
    if (!flagText.trim()) {
      setMsg('Flag text is required');
      setAddLoading(false);
      return;
    }
    if (!reward || isNaN(Number(reward)) || Number(reward) <= 0) {
      setMsg('Reward (wei) must be a number greater than 0');
      setAddLoading(false);
      return;
    }
    if (!submissionFee || isNaN(Number(submissionFee)) || Number(submissionFee) < 0) {
      setMsg('Submission Fee (wei) must be a number 0 or greater');
      setAddLoading(false);
      return;
    }
    if (!difficulty) {
      setMsg('Difficulty is required');
      setAddLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/pinMetadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, category }),
      });
      if (!res.ok) throw new Error('IPFS pin failed');
      const { cid } = await res.json();

      const contract = await getContract(true);
      const flagHash = ethers.keccak256(ethers.toUtf8Bytes(flagText));
      const tx = await contract.addChallenge(
        flagHash,
        ethers.parseUnits(reward, 'wei'),
        cid,
        Number(difficulty),
        submissionFee
      );
      await tx.wait();
      setMsg('Challenge added successfully');
      setName('');
      setDescription('');
      setCategory('');
      setFlagText('');
      setReward('');
      setDifficulty('');
      setSubmissionFee('');
      if (onChallengeAdded) onChallengeAdded();
    } catch (err: any) {
      let errorMsg = err?.reason || err?.message || 'Add challenge failed';
      if (err?.error?.message) errorMsg = err.error.message;
      if (errorMsg.includes('Reward must be > 0')) errorMsg = 'Reward must be greater than 0';
      if (errorMsg.includes('Pausable: paused')) errorMsg = 'The contract is currently paused.';
      setMsg(errorMsg);
    } finally {
      setAddLoading(false);
    }
  };

  const togglePause = async () => {
    setPauseLoading(true);
    setMsg(null);
    try {
      const contract = await getContract(true);
      const tx = paused ? await contract.unpause() : await contract.pause();
      await tx.wait();
      setPaused(!paused);
      setMsg(paused ? 'Contract unpaused successfully' : 'Contract paused successfully');
    } catch (err: any) {
      let errorMsg = err?.reason || err?.message || 'Pause/unpause failed';
      if (err?.error?.message) errorMsg = err.error.message;
      if (errorMsg.includes('Pausable: paused')) {
        errorMsg = 'The contract is currently paused.';
      }
      setMsg(errorMsg);
    } finally {
      setPauseLoading(false);
    }
  };

  const withdraw = async () => {
    setWithdrawing(true);
    setMsg(null);
    try {
      const contract = await getContract(true);
      const tx = await contract.withdraw();
      await tx.wait();
      setMsg('Funds withdrawn successfully.');
      const provider = getProvider();
      const bal = await provider.getBalance(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!);
      setBalance(bal.toString());
    } catch (err: any) {
      let errorMsg = err?.reason || err?.message || 'Withdrawal failed';
      if (err?.error?.message) errorMsg = err.error.message;
      if (errorMsg.includes('Ownable: caller is not the owner')) {
        errorMsg = 'Only the owner can withdraw funds.';
      }
      if (errorMsg.includes('Pausable: paused')) {
        errorMsg = 'The contract is currently paused.';
      }
      setMsg(errorMsg);
    } finally {
      setWithdrawing(false);
    }
  };

  const updateFee = async () => {
    setFeeLoading(true);
    setMsg(null);
    try {
      const contract = await getContract(true);
      const tx = await contract.setSubmissionFee(feeInput);
      await tx.wait();
      setSubmissionFee(feeInput);
      setMsg('Submission fee updated successfully');
    } catch (err: any) {
      let errorMsg = err?.reason || err?.message || 'Fee update failed';
      if (err?.error?.message) errorMsg = err.error.message;
      setMsg(errorMsg);
    } finally {
      setFeeLoading(false);
    }
  };

  if (!mounted || !isOwner) return null;

  return (
    <div className="space-y-10 max-w-7xl mx-auto">

      {/* Contract Controls */}
      <section className="bg-[#232946] rounded-xl shadow border border-[#2e335a] p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:gap-0">
            <span className="font-semibold text-blue-200">Contract Balance:</span>
            <span className="text-yellow-300 font-bold sm:ml-2">{balance} wei</span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 sm:flex-wrap w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-purple-200">Status:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${paused ? 'bg-red-700/80 text-red-200' : 'bg-green-700/80 text-green-200'}`}>{paused ? 'Paused' : 'Active'}</span>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={togglePause}
                disabled={pauseLoading}
                className={`flex-1 sm:flex-none px-5 py-2 rounded-lg font-bold shadow transition ${paused ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'} text-white disabled:opacity-50`}
              >
                {pauseLoading ? 'Processing…' : paused ? 'Unpause' : 'Pause'}
              </button>
              <button
                onClick={withdraw}
                disabled={withdrawing}
                className="flex-1 sm:flex-none px-5 py-2 rounded-lg font-bold shadow bg-yellow-600 hover:bg-yellow-500 text-white disabled:opacity-50"
              >
                {withdrawing ? 'Withdrawing…' : 'Withdraw Funds'}
              </button>
            </div>
          </div>
        </div>
        {msg && (
          <div className={`px-4 py-2 rounded-lg font-semibold text-sm mt-2 ${msg.includes('success') ? 'bg-green-700/80 text-green-200' : 'bg-red-700/80 text-red-200'}`}>
            {msg}
          </div>
        )}
      </section>

      {/* Challenge Creation Section */}
      <section className="bg-[#232946] rounded-xl shadow border border-[#2e335a] p-6">
        <h3 className="text-xl font-bold mb-4 text-pink-300">Add New Challenge</h3>
        <button
          type="button"
          onClick={handleRandomFill}
          className="mb-4 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg font-semibold shadow"
        >
          Random Fill
        </button>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-blue-200">Name</label>
            <input
              placeholder="Enter challenge name"
              value={name}
              onChange={e => setName(e.target.value)}
              className={`w-full bg-[#181c2f] border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition disabled:opacity-60 shadow-sm ${msg && msg.toLowerCase().includes('name') ? 'border-red-500' : 'border-[#2e335a] text-gray-100'}`}
              disabled={addLoading}
            />
            {msg && msg.toLowerCase().includes('name') && (
              <p className="text-red-400 text-xs mt-1">{msg}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-blue-200">Description</label>
            <textarea
              placeholder="Describe the challenge"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className={`w-full bg-[#181c2f] border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition disabled:opacity-60 shadow-sm ${msg && msg.toLowerCase().includes('description') ? 'border-red-500' : 'border-[#2e335a] text-gray-100'}`}
              disabled={addLoading}
            />
            {msg && msg.toLowerCase().includes('description') && (
              <p className="text-red-400 text-xs mt-1">{msg}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-blue-200">Category</label>
            <input
              placeholder="e.g. Blockchain, Web, Crypto"
              value={category}
              onChange={e => setCategory(e.target.value)}
              className={`w-full bg-[#181c2f] border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 transition disabled:opacity-60 shadow-sm ${msg && msg.toLowerCase().includes('category') ? 'border-red-500' : 'border-[#2e335a] text-gray-100'}`}
              disabled={addLoading}
            />
            {msg && msg.toLowerCase().includes('category') && (
              <p className="text-red-400 text-xs mt-1">{msg}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-blue-200">Flag Text</label>
            <input
              placeholder="Enter flag text"
              value={flagText}
              onChange={e => setFlagText(e.target.value)}
              className={`w-full bg-[#181c2f] border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 transition disabled:opacity-60 shadow-sm ${msg && msg.toLowerCase().includes('flag text') ? 'border-red-500' : 'border-[#2e335a] text-gray-100'}`}
              disabled={addLoading}
            />
            {msg && msg.toLowerCase().includes('flag text') && (
              <p className="text-red-400 text-xs mt-1">{msg}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-blue-200">Reward (wei)</label>
            <input
              type="number"
              placeholder="Enter reward in wei"
              value={reward}
              onChange={e => setReward(e.target.value)}
              className={`w-full bg-[#181c2f] border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition disabled:opacity-60 shadow-sm ${msg && msg.toLowerCase().includes('reward') ? 'border-red-500' : 'border-[#2e335a] text-gray-100'}`}
              disabled={addLoading}
              min={1}
            />
            {msg && msg.toLowerCase().includes('reward') && (
              <p className="text-red-400 text-xs mt-1">{msg}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-blue-200">Submission Fee (wei)</label>
            <input
              type="number"
              min={0}
              placeholder="Enter submission fee in wei"
              value={submissionFee}
              onChange={e => setSubmissionFee(e.target.value)}
              className={`w-full bg-[#181c2f] border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 transition disabled:opacity-60 shadow-sm ${msg && msg.toLowerCase().includes('submission fee') ? 'border-red-500' : 'border-[#2e335a] text-gray-100'}`}
              disabled={addLoading}
            />
            {msg && msg.toLowerCase().includes('submission fee') && (
              <p className="text-red-400 text-xs mt-1">{msg}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-blue-200">Difficulty</label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setDifficulty(d.toString());
                    if (msg && msg.toLowerCase().includes('difficulty')) setMsg(null);
                  }}
                  className={`px-3 py-1 rounded-lg border font-bold transition-colors duration-150
                    ${difficulty === d.toString()
                      ? 'bg-blue-600 text-white border-blue-700 shadow'
                      : `${msg && msg.toLowerCase().includes('difficulty') ? 'border-red-500' : 'bg-[#181c2f] text-gray-100 border-[#2e335a] hover:bg-blue-800/40'}`}
                  `}
                  disabled={addLoading}
                >
                  {d}
                </button>
              ))}
            </div>
            {msg && msg.toLowerCase().includes('difficulty') && (
              <p className="text-red-400 text-xs mt-1">{msg}</p>
            )}
          </div>
          <button
            onClick={addChallenge}
            disabled={addLoading}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-2 rounded-lg font-semibold shadow hover:from-green-500 hover:to-blue-500 transition disabled:opacity-50"
          >
            {addLoading ? 'Processing…' : 'Add Challenge'}
          </button>
        </div>
      </section>
    </div>
  );
}

