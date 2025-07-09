"use client";
import { useEffect, useState, useRef } from "react";
import AdminPanel from '../../components/AdminPanel';
import { getContract, getProvider } from '../../lib/contract';
import ConnectButton from '../../components/ConnectButton';
import Header from '../../components/Header';

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);
  const [isOwner, setIsOwner] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const adminPanelRef = useRef<any>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    async function checkOwner() {
      setLoading(true);
      try {
        const provider = getProvider();
        const accounts = await provider.send('eth_accounts', []);
        if (!accounts || accounts.length === 0) {
          setError('Please connect your wallet to access the admin page.');
          setIsOwner(false);
          setLoading(false);
          return;
        }
        setAccount(accounts[0]);
        const contract = await getContract();
        const ownerAddr = await contract.owner();
        if (accounts[0].toLowerCase() === ownerAddr.toLowerCase()) {
          setIsOwner(true);
        } else {
          setError('You are not authorized to access this page.');
          setIsOwner(false);
        }
      } catch (err: any) {
        setError('Failed to check admin status.');
        setIsOwner(false);
      } finally {
        setLoading(false);
      }
    }
    checkOwner();
  }, []);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#181c2f] via-[#232946] to-[#121212] text-gray-100">
        <div className="text-lg text-blue-200 animate-pulse">Checking admin access…</div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#181c2f] via-[#232946] to-[#121212] text-gray-100">
        <div className="bg-[#232946] border border-[#2e335a] rounded-2xl shadow-2xl p-10 flex flex-col items-center">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">Admin Access Denied</h1>
          <div className="mb-4 px-4 py-2 rounded-lg font-semibold text-sm bg-red-700/80 text-red-200">
            {error || 'You are not authorized to access this page.'}
          </div>
          <a href="/home" className="mt-4 text-blue-400 hover:underline">Return to Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#181c2f] via-[#232946] to-[#121212] text-gray-100 font-sans">
      <Header account={account} setAccount={setAccount} isOwner={!!isOwner} onFunded={() => adminPanelRef.current?.refreshBalance()} />
      <main className="max-w-3xl mx-auto p-8">
        {/* Toast notification */}
        {toast && (
          <div
            className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg font-bold text-lg animate-fade-in ${toast.type === 'success' ? 'bg-green-700 text-green-100' : 'bg-red-700 text-red-100'}`}
          >
            {toast.message}
          </div>
        )}
        <AdminPanel ref={adminPanelRef} onShowToast={setToast} />
        {/* Add more admin sections here in the future */}
      </main>
    </div>
  );
} 