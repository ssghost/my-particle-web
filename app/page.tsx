"use client";
import { LazorkitProvider, useWallet } from "@lazorkit/wallet";
import { SystemProgram, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js"; 
import { useEffect, useState } from "react";
import * as anchor from '@coral-xyz/anchor';
import { useTheme } from "next-themes";

const HARDCODED_PAYMASTER_CONFIG = {
  paymasterUrl: "https://api.devnet.solana.com"
};

const PORTAL_URL = "https://portal.lazor.sh"; 

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
  const [message, setMessage] = useState('Hello LazorKit!');
  const [signature, setSignature] = useState('');

  const {
    smartWalletPubkey,
    isConnected,
    isConnecting,
    isSigning,
    error,
    connect,
    disconnect,
    signAndSendTransaction
  } = useWallet();

  useEffect(() => {
    if (smartWalletPubkey) {
      const fetchBalance = async () => {
        try {
          const response = await fetch("https://api.devnet.solana.com", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              method: "getBalance",
              params: [smartWalletPubkey.toString()]
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
  }, [smartWalletPubkey]);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleSign = async () => {
    if (!smartWalletPubkey) return;

    const instruction = new anchor.web3.TransactionInstruction({
      keys: [],
      programId: new anchor.web3.PublicKey('Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo'),
      data: Buffer.from(message, 'utf-8'),
    });
    
    try {
      console.log("Instruction created:", instruction);
      alert("Memo Signed! (Check Console)");
    } catch (error) {
      console.error('Signing failed:', error);
    }
  };

  const sendSOL = async () => {
    if (!smartWalletPubkey) return;

    const instruction = SystemProgram.transfer({
      fromPubkey: smartWalletPubkey,
      toPubkey: new PublicKey('MTSLZDJppGh6xUcnrSSbSQE5fgbvCtQ496MqgQTv8c1'),
      lamports: 0.1 * LAMPORTS_PER_SOL,
    });

    try {
      const signature = await signAndSendTransaction(instruction);
      console.log('Transfer successful:', signature);
      setSignature(signature || "Tx Sent!");
      playSuccessSound();
      return signature;
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        {/* Light(white) / Dark(slate-800) */}
        <div className="p-8 border rounded-sm shadow-2xl text-center max-w-md w-full backdrop-blur-sm transition-colors 
          bg-white/80 border-slate-200 
          dark:bg-slate-800/50 dark:border-slate-700">
          
          <h1 className="text-2xl font-bold mb-2 tracking-tight font-mono transition-colors
            text-slate-800 dark:text-slate-100">
            LAZORKIT DEMO
          </h1>
          <p className="mb-8 text-sm font-mono transition-colors
            text-slate-500 dark:text-slate-400">
            SECURE • GASLESS • PASSKEY
          </p>
          
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full font-mono py-3 px-4 rounded-sm transition-all border-b-4 active:border-b-0 active:translate-y-1 disabled:opacity-50
              bg-blue-600 hover:bg-blue-500 text-white border-blue-800"
          >
            {isConnecting ? 'INITIALIZING...' : '[ CONNECT WALLET ]'}
          </button>
          
          {error && (
            <div className="mt-4 p-2 text-xs font-mono break-all
              bg-red-100 border-red-200 text-red-600
              dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400">
              ERROR: {error.message}
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="mt-12 text-center">
          <h3 className="font-mono text-sm mb-4 inline-block pb-1 border-b
            text-slate-500 border-slate-300 dark:border-slate-800">
            SYSTEM FEATURES
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs font-mono max-w-lg
            text-slate-600 dark:text-slate-400">
            <div className="p-2 border rounded transition-colors bg-white border-slate-200 dark:bg-slate-900/50 dark:border-slate-800">✅ No Passwords</div>
            <div className="p-2 border rounded transition-colors bg-white border-slate-200 dark:bg-slate-900/50 dark:border-slate-800">✅ No Extensions</div>
            <div className="p-2 border rounded transition-colors bg-white border-slate-200 dark:bg-slate-900/50 dark:border-slate-800">✅ Cross-Device</div>
            <div className="p-2 border rounded transition-colors bg-white border-slate-200 dark:bg-slate-900/50 dark:border-slate-800">✅ Gasless Ready</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6 p-4 border rounded-sm shadow-sm transition-colors
        bg-white border-slate-200 
        dark:bg-slate-800 dark:border-slate-700"> 
        
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
          <span className="font-mono text-sm transition-colors text-slate-700 dark:text-slate-200">
            Devnet Online
          </span>
        </div>
        <button 
          onClick={() => disconnect()}
          className="text-xs font-mono px-3 py-1 rounded-sm transition-colors
            text-red-600 bg-red-50 border border-red-200 hover:bg-red-100
            dark:text-red-400 dark:bg-red-900/10 dark:border-red-900/50 dark:hover:bg-red-900/20"
        >
          [ DISCONNECT ]
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left: Account Info */}
        <div className="border rounded-sm p-6 shadow-lg transition-colors
          bg-white border-slate-200 
          dark:bg-slate-800 dark:border-slate-700"> 
          
          <h2 className="text-xs font-bold uppercase tracking-wider mb-4 border-b pb-2 flex justify-between transition-colors
            text-slate-500 border-slate-200 dark:text-slate-400 dark:border-slate-700">
            <span>Account Overview</span>
            <span className="opacity-70">ID: LZ-01</span>
          </h2>
          
          <div className="mb-5">
            <p className="text-[10px] mb-1 uppercase text-slate-500">Smart Wallet Address</p>
            <div className="flex items-center p-3 rounded border transition-colors
              bg-slate-50 border-slate-200
              dark:bg-slate-900 dark:border-slate-700/50">
              <code className="text-xs break-all font-mono text-blue-600 dark:text-blue-400">
                {smartWalletPubkey?.toString()}
              </code>
            </div>
          </div>

          <div className="mb-5">
             <p className="text-[10px] mb-1 uppercase text-slate-500">Token Balance</p>
             <div className="text-2xl font-mono tracking-tighter transition-colors text-slate-800 dark:text-slate-200">
               {(balance / LAMPORTS_PER_SOL).toFixed(4)} <span className="text-sm text-slate-500">SOL</span>
             </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-mono border-t pt-2 transition-colors
              border-slate-200 text-slate-500 dark:border-slate-700/50">
              <span>PROGRAM ID</span>
              <span className="opacity-70">3CFG...FTAD8</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>PAYMASTER</span>
              <span className="opacity-70">hij7...5sD8w</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="border rounded-sm p-6 shadow-lg flex flex-col justify-between transition-colors
          bg-white border-slate-200 
          dark:bg-slate-800 dark:border-slate-700"> 
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider mb-4 border-b pb-2 transition-colors
              text-slate-500 border-slate-200 dark:text-slate-400 dark:border-slate-700">
              Interact
            </h2>

            <div className="mb-4">
              <label className="text-[10px] uppercase mb-1 block text-slate-500">Memo Message</label>
              <input 
                type="text" 
                value={message} 
                onChange={(e) => setMessage(e.target.value)}
                className="w-full text-sm p-2 rounded-sm focus:outline-none focus:border-blue-500 font-mono transition-colors
                  bg-slate-50 border border-slate-200 text-slate-800
                  dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleSign}
                disabled={isSigning}
                className="font-mono text-xs py-3 px-2 rounded-sm transition-colors border-b-2 active:border-b-0 active:translate-y-[2px]
                  bg-slate-200 hover:bg-slate-300 text-slate-700 border-slate-300
                  dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 dark:border-slate-900"
              >
                {isSigning ? 'SIGNING...' : 'SIGN MEMO'}
              </button>
              
              <button
                onClick={sendSOL}
                disabled={isSigning}
                className="font-mono text-xs py-3 px-2 rounded-sm transition-colors border-b-2 active:border-b-0 active:translate-y-[2px]
                  bg-blue-600 hover:bg-blue-500 text-white border-blue-800
                  dark:bg-blue-600 dark:hover:bg-blue-500 dark:border-blue-900"
              >
                {isSigning ? 'SENDING...' : 'SEND 0.1 SOL'}
              </button>
            </div>
          </div>

          {signature && (
            <div className="mt-4 p-3 rounded-sm transition-colors
              bg-green-50 border border-green-200
              dark:bg-green-900/10 dark:border-green-900/30">
              <p className="text-[10px] font-bold uppercase mb-1 text-green-600 dark:text-green-500">Last Transaction Success</p>
              <p className="text-[10px] break-all font-mono leading-tight opacity-80 text-green-700 dark:text-green-400">
                {signature}
              </p>
            </div>
          )}
          
          <p className="text-[10px] text-center mt-4 font-mono text-slate-400 dark:text-slate-600">
            * Gas fees sponsored by LazorKit Paymaster
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen font-sans selection:bg-blue-500 selection:text-white transition-colors
      bg-gray-50 text-slate-900
      dark:bg-[#111927] dark:text-slate-200">
      
      {/* Navbar */}
      <nav className="border-b backdrop-blur-md sticky top-0 z-50 transition-colors
        bg-white/80 border-slate-200
        dark:bg-[#0f1521]/80 dark:border-slate-800">
        
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Left: Toggle */}
          <div className="flex-1 flex justify-start">
            <ThemeToggle />
          </div>

          {/* Middle: Logo */}
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-sm flex items-center justify-center font-bold font-mono text-lg shadow-lg
                bg-blue-600 text-white shadow-blue-500/30
                dark:shadow-blue-900/50">
                L
              </div>
              <span className="font-bold text-lg tracking-tight font-mono text-slate-800 dark:text-slate-100">
                LazorScan
              </span>
            </div>
          </div>
          
          {/* Right: Stat */}
          <div className="flex-1 flex justify-end">
            <div className="text-[10px] font-mono px-2 py-1 rounded transition-colors hidden sm:block
              bg-slate-100 text-slate-500 border border-slate-200
              dark:bg-slate-900 dark:border-slate-800">
              SOLANA DEVNET
            </div>
          </div>

        </div>
      </nav>

      {/* Provider Wrapping Dashboard */}
      <LazorkitProvider
        rpcUrl="https://api.devnet.solana.com"
        portalUrl={PORTAL_URL}
        paymasterConfig={HARDCODED_PAYMASTER_CONFIG}
      >
        <Dashboard />
      </LazorkitProvider>
    </main>
  );
}