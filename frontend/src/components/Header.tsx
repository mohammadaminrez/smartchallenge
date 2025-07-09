import React, { useState, useEffect } from 'react';
import ConnectButton from './ConnectButton';
import { getContract, getContractBalance } from '../lib/contract';
import { ethers } from 'ethers';
import Modal from './Modal';

interface HeaderProps {
  account: string | null;
  setAccount: (account: string | null) => void;
  isOwner: boolean;
  onFunded?: () => void;
}

export default function Header({ account, setAccount, isOwner, onFunded }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [fundLoading, setFundLoading] = useState(false);
  const [showFundDialog, setShowFundDialog] = useState(false);
  const [weiInput, setWeiInput] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  async function handleFundSubmit(e: React.FormEvent) {
    e.preventDefault();
    let wei;
    try {
      wei = BigInt(weiInput);
      if (wei <= 0n) throw new Error('Invalid amount');
    } catch {
      setToast({ type: 'error', message: 'Invalid amount' });
      return;
    }
    setFundLoading(true);
    try {
      const contract = await getContract(true);
      const tx = await contract.fund({ value: wei });
      await tx.wait();
      setToast({ type: 'success', message: 'Funded successfully!' });
      if (onFunded) onFunded();
      setShowFundDialog(false);
      setWeiInput('');
    } catch (err: any) {
      let msg = 'Funding failed: ';
      if (
        err?.code === 4001 ||
        (typeof err?.message === 'string' && err.message.toLowerCase().includes('user denied'))
      ) {
        msg = 'Transaction cancelled: You denied the MetaMask signature request.';
      } else {
        msg += err?.info?.error?.message || err?.message || err;
      }
      setToast({ type: 'error', message: msg });
    }
    setFundLoading(false);
  }

  return (
    <header className="flex items-center justify-between px-4 lg:px-8 py-5 bg-[#181c2f] shadow-lg border-b border-[#232946] relative z-20">
      <div className="flex items-center gap-3">
        <a href="/" className="flex items-center gap-3" style={{ textDecoration: 'none' }}>
          <img src="/icon.png" alt="SmartChallenge Icon" className="w-16 h-16 lg:w-20 lg:h-20 rounded-full shadow-lg" />
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-lg">SmartChallenge</h1>
        </a>
      </div>
      {/* Burger menu for mobile, tablets, and small desktops */}
      <button
        className="lg:hidden ml-2 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label="Open menu"
        onClick={() => setMenuOpen((v) => !v)}
      >
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      {/* Desktop nav */}
      <div className="hidden lg:flex items-center gap-6">
        {isOwner && (
          <a
            href="/admin"
            className="ml-6 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-bold shadow-lg hover:from-pink-400 hover:to-blue-400 focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
            style={{ minWidth: 0 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5V6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v6.75M3 13.5v3.75A2.25 2.25 0 005.25 19.5h13.5A2.25 2.25 0 0021 17.25V13.5M3 13.5h18" />
            </svg>
            Admin Dashboard
          </a>
        )}
        <a
          href="/home"
          className="ml-3 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-400 text-white font-bold shadow-lg hover:from-blue-400 hover:to-cyan-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          style={{ minWidth: 0 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125h3.375a.375.375 0 00.375-.375V16.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75v4.125c0 .207.168.375.375.375h3.375c.621 0 1.125-.504 1.125-1.125V9.75M8.25 22.5h7.5" />
          </svg>
          Home
        </a>
        <button
          onClick={() => setShowFundDialog(true)}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-green-500 via-teal-500 to-blue-500 text-white font-bold shadow-lg hover:from-green-400 hover:to-teal-400 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
          disabled={fundLoading}
          style={{ minWidth: 0 }}
        >
          {fundLoading ? 'Funding...' : 'Fund'}
        </button>
        <ConnectButton account={account} setAccount={setAccount} />
      </div>
      {/* Mobile nav dropdown */}
      {menuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-[#181c2f] border-b border-[#232946] shadow-lg flex flex-col items-stretch gap-2 py-4 px-6 animate-fade-in z-30">
          {isOwner && (
            <a
              href="/admin"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-bold shadow-lg hover:from-pink-400 hover:to-blue-400 focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
              onClick={() => setMenuOpen(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5V6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v6.75M3 13.5v3.75A2.25 2.25 0 005.25 19.5h13.5A2.25 2.25 0 0021 17.25V13.5M3 13.5h18" />
              </svg>
              Admin Dashboard
            </a>
          )}
          <a
            href="/home"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-400 text-white font-bold shadow-lg hover:from-blue-400 hover:to-cyan-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            onClick={() => setMenuOpen(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125h3.375a.375.375 0 00.375-.375V16.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75v4.125c0 .207.168.375.375.375h3.375c.621 0 1.125-.504 1.125-1.125V9.75M8.25 22.5h7.5" />
            </svg>
            Home
          </a>
          <button
            onClick={() => setShowFundDialog(true)}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-green-500 via-teal-500 to-blue-500 text-white font-bold shadow-lg hover:from-green-400 hover:to-teal-400 focus:outline-none focus:ring-2 focus:ring-green-400 transition w-full mt-2"
            disabled={fundLoading}
          >
            {fundLoading ? 'Funding...' : 'Fund'}
          </button>
          <div className="mt-2">
            <ConnectButton account={account} setAccount={setAccount} />
          </div>
        </div>
      )}
      {showFundDialog && (
        <Modal open={showFundDialog} onClose={() => { setShowFundDialog(false); setWeiInput(''); }}>
          <form onSubmit={handleFundSubmit} className="flex flex-col gap-5 min-w-[240px]">
            <h2 className="text-xl font-bold text-white mb-2 text-center">Fund Contract</h2>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-blue-200 font-semibold" htmlFor="weiInput">Amount (wei)</label>
              <input
                id="weiInput"
                type="number"
                min="1"
                step="1"
                className="px-4 py-2 rounded-lg bg-[#232946] text-white border border-[#2e335a] focus:outline-none focus:ring-2 focus:ring-blue-400 text-base"
                placeholder="Enter amount in wei"
                value={weiInput}
                onChange={e => setWeiInput(e.target.value)}
                disabled={fundLoading}
                required
                autoFocus
              />
            </div>
            <div className="flex gap-3 mt-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold hover:from-green-400 hover:to-blue-400 transition shadow"
                disabled={fundLoading}
              >
                {fundLoading ? 'Funding...' : 'Fund'}
              </button>
              <button
                type="button"
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-gray-500 to-gray-700 text-white font-bold hover:from-gray-400 hover:to-gray-600 transition shadow"
                onClick={() => { setShowFundDialog(false); setWeiInput(''); }}
                disabled={fundLoading}
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
      {toast && (
        <div className={`fixed top-6 left-1/2 z-[100] -translate-x-1/2 px-6 py-3 rounded-xl shadow-lg font-semibold text-base transition-all animate-fade-in ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
          onClick={() => setToast(null)}
        >
          {toast.message}
        </div>
      )}
    </header>
  );
}
