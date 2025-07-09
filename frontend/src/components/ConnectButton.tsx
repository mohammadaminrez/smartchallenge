// src/components/ConnectButton.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { getProvider } from '../lib/contract';
import { useRouter } from 'next/navigation';

interface ConnectButtonProps {
  account: string | null;
  setAccount: (account: string | null) => void;
  setMessage?: (msg: string | null) => void;
}

export async function connectWallet(setAccount: (account: string | null) => void, setMessage?: (msg: string | null) => void) {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    try {
      const provider = getProvider();
      const accounts = await (provider as ethers.BrowserProvider).send('eth_requestAccounts', []);
      setAccount(accounts[0]);
      if (setMessage) setMessage(null);
    } catch (err: any) {
      let errorMsg = err?.message || '';
      if (
        errorMsg.includes('user rejected action') ||
        errorMsg.includes('User rejected the request') ||
        errorMsg.includes('User denied account authorization')
      ) {
        if (setMessage) setMessage('You rejected the wallet connection request. Please connect your wallet to use the app.');
      } else {
        if (setMessage) setMessage('Failed to connect wallet. Please try again.');
      }
    }
  } else {
    alert('MetaMask is not installed.');
  }
}

export default function ConnectButton({ account, setAccount, setMessage }: ConnectButtonProps) {
  // Check if wallet is already connected
  useEffect(() => {
    async function checkConnection() {
      try {
        const provider = getProvider();
        if (provider instanceof ethers.BrowserProvider) {
          const accounts = await provider.send('eth_accounts', []);
          if (accounts && accounts.length > 0) {
            setAccount(accounts[0]);
          }
        }
      } catch (err) {
        console.error('Error checking wallet connection', err);
      }
    }
    checkConnection();
  }, []);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();
  const disconnect = () => {
    setAccount(null);
    setDropdownOpen(false);
    router.push('/disconnected');
  };

  if (account) {
    const short = `${account.substring(0, 6)}...${account.substring(account.length - 4)}`;
    return (
      <div
        className="relative"
        onMouseEnter={() => setDropdownOpen(true)}
        onMouseLeave={() => setDropdownOpen(false)}
      >
        <button
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold shadow hover:from-green-400 hover:to-blue-400 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25V6.75A2.25 2.25 0 0014.25 4.5h-4.5A2.25 2.25 0 007.5 6.75v1.5m9 0V6.75A2.25 2.25 0 0014.25 4.5h-4.5A2.25 2.25 0 007.5 6.75v1.5m9 0a2.25 2.25 0 012.25 2.25v7.5A2.25 2.25 0 0116.5 20.25h-9A2.25 2.25 0 015.25 18V10.5A2.25 2.25 0 017.5 8.25m9 0h-9" />
          </svg>
          Connected
        </button>
        {dropdownOpen && (
          <div
            className="absolute right-0 mt-0 w-64 bg-[#232946] border border-[#2e335a] rounded-xl shadow-lg z-50 p-4 flex flex-col gap-3 animate-fade-in"
          >
            <div className="font-mono text-blue-200 break-all text-sm mb-2">{account}</div>
            <button
              onClick={disconnect}
              className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-blue-500 text-white font-bold hover:from-pink-400 hover:to-blue-400 transition"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => connectWallet(setAccount, setMessage)}
      className="px-5 py-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold shadow hover:from-blue-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
    >
      Connect Wallet
    </button>
  );
}
