import React, { useState } from 'react';
import ConnectButton from './ConnectButton';

interface HeaderProps {
  account: string | null;
  setAccount: (account: string | null) => void;
  isOwner: boolean;
}

export default function Header({ account, setAccount, isOwner }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="flex items-center justify-between px-4 lg:px-8 py-5 bg-[#181c2f] shadow-lg border-b border-[#232946] relative z-20">
      <div className="flex items-center gap-3">
        <img src="/icon.png" alt="SmartChallenge Icon" className="w-16 h-16 lg:w-20 lg:h-20 rounded-full shadow-lg" />
        <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-lg">SmartChallenge</h1>
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
        <a
          href="/"
          className="ml-6 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-400 text-white font-bold shadow-lg hover:from-blue-400 hover:to-cyan-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          style={{ minWidth: 0 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125h3.375a.375.375 0 00.375-.375V16.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75v4.125c0 .207.168.375.375.375h3.375c.621 0 1.125-.504 1.125-1.125V9.75M8.25 22.5h7.5" />
          </svg>
          Home
        </a>
        {isOwner && (
          <a
            href="/admin"
            className="ml-3 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-bold shadow-lg hover:from-pink-400 hover:to-blue-400 focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
            style={{ minWidth: 0 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5V6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v6.75M3 13.5v3.75A2.25 2.25 0 005.25 19.5h13.5A2.25 2.25 0 0021 17.25V13.5M3 13.5h18" />
            </svg>
            Admin Dashboard
          </a>
        )}
        <ConnectButton account={account} setAccount={setAccount} />
      </div>
      {/* Mobile nav dropdown */}
      {menuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-[#181c2f] border-b border-[#232946] shadow-lg flex flex-col items-stretch gap-2 py-4 px-6 animate-fade-in z-30">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-400 text-white font-bold shadow-lg hover:from-blue-400 hover:to-cyan-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            onClick={() => setMenuOpen(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125h3.375a.375.375 0 00.375-.375V16.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75v4.125c0 .207.168.375.375.375h3.375c.621 0 1.125-.504 1.125-1.125V9.75M8.25 22.5h7.5" />
            </svg>
            Home
          </a>
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
          <div className="mt-2">
            <ConnectButton account={account} setAccount={setAccount} />
          </div>
        </div>
      )}
    </header>
  );
}
