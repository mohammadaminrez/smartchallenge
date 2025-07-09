"use client";
import { useRouter } from "next/navigation";

export default function DisconnectedPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#181c2f] via-[#232946] to-[#121212] text-gray-100">
      <div className="bg-[#232946] border border-[#2e335a] rounded-2xl shadow-2xl p-10 flex flex-col items-center">
        <img src="/icon.png" alt="SmartChallenge Icon" className="w-32 h-32 rounded-full shadow-lg mb-6" />
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">Disconnected</h1>
        <div className="mb-4 px-4 py-2 rounded-lg font-semibold text-sm bg-red-700/80 text-red-200">
          You have been disconnected from your wallet.
        </div>
        <button
          className="mt-4 px-6 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold shadow hover:from-blue-400 hover:to-purple-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          onClick={() => router.push("/home")}
        >
          Return to Home
        </button>
      </div>
    </div>
  );
} 