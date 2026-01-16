"use client";

import { useConnect, useAuthCore, useSolana } from "@particle-network/auth-core-modal";
import { SolanaDevnet } from "@particle-network/chains";
import { LAMPORTS_PER_SOL, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Buffer } from "buffer";

if (typeof window !== "undefined") {
  window.Buffer = window.Buffer || Buffer;
}

const playSuccessSound = () => {
  if (typeof window !== 'undefined') {
    const audio = new Audio('/sounds/success.wav');
    audio.volume = 0.5;
    audio.play().catch(e => console.log("Audio play prevented:", e));
  }
};

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-md transition-colors bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600"
    >
      {theme === 'dark' ? (
        <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}

function Dashboard() {
  const [balance, setBalance] = useState(0);
  const [signature, setSignature] = useState('');
  const { connect, disconnect, connectionStatus } = useConnect();
  const { address, signAndSendTransaction } = useSolana();
  const { userInfo } = useAuthCore();

  const isConnected = connectionStatus === 'connected';
  const isConnecting = connectionStatus === 'connecting';

  useEffect(() => {
    if (isConnected && address) {
      const fetchBalance = async () => {
        try {
          const response = await fetch("https://api.devnet.solana.com", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              method: "getBalance",
              params: [address]
            })
          });
          
          const data = await response.json();
          if (data.result && data.result.value !== undefined) {
            setBalance(data.result.value); 
          }
        } catch (e) {
          console.error("Failed to fetch balance:", e);
        }
      };
      fetchBalance();
      playSuccessSound(); 
    }
  }, [isConnected, address]);

  const handleConnect = async () => {
    try {
      await connect({
        socialType: 'google', 
        chain: SolanaDevnet, 
      });
    } catch (err) {
      console.error('Connection failed:', err);
    }
  };

  const sendSOL = async () => {
    if (!address) return;

    const fromPubkey = new PublicKey(address);
    const toPubkey = new PublicKey('MTSLZDJppGh6xUcnrSSbSQE5fgbvCtQ496MqgQTv8c1');

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports: 0.01 * LAMPORTS_PER_SOL,
      })
    );

    try {
      const sig = await signAndSendTransaction(transaction);
      setSignature(sig);
      playSuccessSound();
      alert(`Transaction successful! Signature: ${sig}`);
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="p-8 border rounded-sm shadow-2xl text-center max-w-md w-full backdrop-blur-sm transition-colors bg-white/80 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
          <h1 className="text-2xl font-bold mb-2 tracking-tight font-mono text-slate-800 dark:text-slate-100">
            MY-PARTICLE-WEB
          </h1>
          <p className="mb-8 text-sm font-mono text-slate-500 dark:text-slate-400">
            SECURE • PASSKEY • CNFT READY
          </p>
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full font-mono py-3 px-4 rounded-sm transition-all border-b-4 active:border-b-0 active:translate-y-1 disabled:opacity-50 bg-blue-600 hover:bg-blue-500 text-white border-blue-800"
          >
            {isConnecting ? 'INITIALIZING...' : '[ CONNECT WITH GOOGLE ]'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4">
      <div className="flex justify-between items-center mb-6 p-4 border rounded-sm shadow-sm bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700"> 
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
          <span className="font-mono text-sm text-slate-700 dark:text-slate-200">Solana Devnet</span>
        </div>
        <button 
          onClick={() => disconnect()}
          className="text-xs font-mono px-3 py-1 rounded-sm text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/10 dark:border-red-900/50 dark:hover:bg-red-900/20"
        >
          [ DISCONNECT ]
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="border rounded-sm p-6 shadow-lg bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700"> 
          <h2 className="text-xs font-bold uppercase tracking-wider mb-4 border-b pb-2 flex justify-between text-slate-500 border-slate-200 dark:text-slate-400 dark:border-slate-700">
            <span>Account Overview</span>
            <span className="opacity-70">{userInfo?.name || "User"}</span>
          </h2>
          <div className="mb-5">
            <p className="text-[10px] mb-1 uppercase text-slate-500">Address</p>
            <div className="flex items-center p-3 rounded border bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-700/50">
              <code className="text-xs break-all font-mono text-blue-600 dark:text-blue-400">{address}</code>
            </div>
          </div>
          <div className="mb-5">
             <p className="text-[10px] mb-1 uppercase text-slate-500">Balance</p>
             <div className="text-2xl font-mono tracking-tighter text-slate-800 dark:text-slate-200">
               {(balance / LAMPORTS_PER_SOL).toFixed(4)} <span className="text-sm text-slate-500">SOL</span>
             </div>
          </div>
        </div>

        <div className="border rounded-sm p-6 shadow-lg flex flex-col justify-between bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700"> 
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider mb-4 border-b pb-2 text-slate-500 border-slate-200 dark:text-slate-400 dark:border-slate-700">Interact</h2>
            <button
                onClick={sendSOL}
                className="w-full font-mono text-xs py-3 px-2 rounded-sm bg-blue-600 hover:bg-blue-500 text-white border-b-2 border-blue-800 active:border-b-0 active:translate-y-[2px]"
              >
                TEST 0.01 SOL TRANSFER
            </button>
            <p className="text-[10px] text-center mt-4 font-mono text-slate-400">cNFT Minting Module (Next Step)</p>
          </div>
          {signature && (
            <div className="mt-4 p-2 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded text-[10px] font-mono break-all text-green-700 dark:text-green-400">
              Last Sig: {signature}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="min-h-screen bg-gray-50 dark:bg-[#111927]" />;

  return (
    <main className="min-h-screen font-sans selection:bg-blue-500 selection:text-white bg-gray-50 text-slate-900 dark:bg-[#111927] dark:text-slate-200">
      <nav className="border-b backdrop-blur-md sticky top-0 z-50 bg-white/80 border-slate-200 dark:bg-[#0f1521]/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <ThemeToggle />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-sm flex items-center justify-center font-bold font-mono text-lg bg-blue-600 text-white shadow-lg">P</div>
            <span className="font-bold text-lg tracking-tight font-mono">ParticleScan</span>
          </div>
          <div className="text-[10px] font-mono px-2 py-1 rounded bg-slate-900 text-slate-500 border border-slate-800 hidden sm:block">SOLANA DEVNET</div>
        </div>
      </nav>

      <Dashboard />
    </main>
  );
}