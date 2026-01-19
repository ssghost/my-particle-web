"use client";

import { useConnect, useAuthCore, useSolana } from "@particle-network/auth-core-modal";
import { SolanaDevnet } from "@particle-network/chains";
import { LAMPORTS_PER_SOL, PublicKey, Transaction, SystemProgram, VersionedTransaction } from "@solana/web3.js";
import { useEffect, useState, useMemo } from "react";
import { useTheme } from "next-themes";
import { Buffer } from "buffer";

import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { fromWeb3JsPublicKey,toWeb3JsTransaction, fromWeb3JsTransaction } from '@metaplex-foundation/umi-web3js-adapters'; 
import { createTree, mintV1, mplBubblegum } from '@metaplex-foundation/mpl-bubblegum';
import { generateSigner, some } from '@metaplex-foundation/umi';
import { signerIdentity, Signer } from '@metaplex-foundation/umi';

import bs58 from 'bs58';

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
  const [isMinting, setIsMinting] = useState(false);
  const [nftName, setNftName] = useState('My cNFT');
  const [nftSymbol, setNftSymbol] = useState('CNFT');
  const [nftUri, setNftUri] = useState('');
  const { connect, disconnect, connectionStatus } = useConnect();
  const { address, signAndSendTransaction, wallet, chainInfo, switchChain } = useSolana();
  const [copied, setCopied] = useState(false);
  const [mintHistory, setMintHistory] = useState<string[]>([]);
  const { userInfo } = useAuthCore();

  const isConnected = connectionStatus === 'connected';
  const isConnecting = connectionStatus === 'connecting';

  const umi = useMemo(() => {
    if (!wallet || !address) return null;

    const u = createUmi("https://api.devnet.solana.com")
      .use(mplBubblegum());

    const manualSigner: Signer = {
      publicKey: fromWeb3JsPublicKey(new PublicKey(address)),
      signTransaction: async (umiTx) => {
        const web3Tx = toWeb3JsTransaction(umiTx);
        const signedWeb3Tx = await wallet.signTransaction(web3Tx);
        return fromWeb3JsTransaction(signedWeb3Tx as VersionedTransaction);
      },
      signAllTransactions: async (umiTxs) => {
        const web3Txs = umiTxs.map((tx) => toWeb3JsTransaction(tx));
        const signedWeb3Txs = await wallet.signAllTransactions(web3Txs);
        return signedWeb3Txs.map((tx: Transaction | VersionedTransaction) => fromWeb3JsTransaction(tx as VersionedTransaction));
      },
      signMessage: (msg) => wallet.signMessage(msg),
    };

    u.use(signerIdentity(manualSigner));
    return u
  }, [wallet, address]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mint_history");
      if (saved) {
        try {
          setMintHistory(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse history", e);
        }
      }
    }

    if (isConnected && chainInfo && chainInfo.id !== 103) {
      console.log("Detect dismatch network: " + chainInfo.id + "), auto switching...");
      switchChain(SolanaDevnet.id).catch((err: unknown) => {
        console.warn("Failed to switch network:", err);
      });
    }

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
  }, [isConnected, address, chainInfo, switchChain]);

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

  const handleCopy = (text: string, type: 'address' | 'history') => {
    navigator.clipboard.writeText(text);
    if (type === 'address') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      alert("Copied to clipboard!");
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

  const mintCompressedNft = async () => {
    if (!umi || !address) return;
    if (!nftUri) {
      alert("Please enter a Metadata URI first!");
      return;
    }
    setIsMinting(true);
    setSignature('');

    try {
      const umiUserPublicKey = fromWeb3JsPublicKey(new PublicKey(address!));
      const merkleTree = generateSigner(umi);

      const createTreeBuilder = await createTree(umi, {
        merkleTree,
        treeCreator: umi.identity,
        maxDepth: 14,
        maxBufferSize: 64,
        public: false
      });

      const fullTransaction = createTreeBuilder.add(
        mintV1(umi, {
          leafOwner: umiUserPublicKey,
          merkleTree: merkleTree.publicKey,
          metadata: {
            name: nftName,
            symbol: nftSymbol,
            uri: nftUri,
            sellerFeeBasisPoints: 500, 
            collection: some({ key: umiUserPublicKey, verified: false }),
            creators: [
              { address: umiUserPublicKey, verified: true, share: 100 },
            ],
          },
        })
      );

      const { signature } = await fullTransaction.sendAndConfirm(umi);

      const sigStr = bs58.encode(signature); 
      setSignature(sigStr);
      setMintHistory(prev => {
        const newHistory = [...prev, sigStr]; 
        localStorage.setItem('mint_history', JSON.stringify(newHistory));
        return newHistory;
      });

      playSuccessSound();
      console.log("cNFT Minting Completed. Sig:", sigStr);
      alert("Minting successful!");

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errMsg = "Minting failed. " + (errorMessage || "");
      console.error(errMsg, err);
      alert(errMsg);
    } finally {
      setIsMinting(false);
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
        <div className="border rounded-sm p-6 shadow-lg bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 flex flex-col justify-between"> 
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider mb-4 border-b pb-2 flex justify-between text-slate-500 border-slate-200 dark:text-slate-400 dark:border-slate-700">
              <span>Account Overview</span>
              <span className="opacity-70">{userInfo?.name || "User"}</span>
            </h2>
            <div className="mb-5">
              <p className="text-[10px] mb-1 uppercase text-slate-500">Address</p>
              <div className="flex items-center gap-2 p-3 rounded border bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-700/50">
                <code className="text-xs break-all font-mono text-blue-600 dark:text-blue-400 flex-1">
                  {address}
                </code>
                <button 
                  onClick={() => handleCopy(address!, 'address')}
                  className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-400 hover:text-blue-600"
                  title="Copy Address"
                >
                  {copied ? (
                    <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="mb-5">
               <p className="text-[10px] mb-1 uppercase text-slate-500">Balance</p>
               <div className="text-2xl font-mono tracking-tighter text-slate-800 dark:text-slate-200">
                 {(balance / LAMPORTS_PER_SOL).toFixed(4)} <span className="text-sm text-slate-500">SOL</span>
               </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-dashed border-slate-200 dark:border-slate-700">
            <button
                onClick={sendSOL}
                className="w-full font-mono text-xs py-3 px-2 rounded-sm bg-blue-600 hover:bg-blue-500 text-white border-b-2 border-blue-800 active:border-b-0 active:translate-y-[2px]"
              >
                TEST 0.01 SOL TRANSFER
            </button>
          <p className="text-[10px] mt-2 invisible italic">Alignment Spacer</p>
          </div>
        </div>

        <div className="border rounded-sm p-6 shadow-lg flex flex-col justify-between bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700"> 
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider mb-4 border-b pb-2 text-slate-500 border-slate-200 dark:text-slate-400 dark:border-slate-700">
              cNFT Minting Tool
            </h2>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-slate-500 font-bold">NFT Name</label>
                <input 
                  type="text" 
                  value={nftName}
                  onChange={(e) => setNftName(e.target.value)}
                  placeholder="e.g. My Avatar"
                  className="w-full text-xs p-2 border rounded-sm bg-slate-50 dark:bg-slate-900 dark:border-slate-700"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-slate-500 font-bold">Symbol</label>
                <input 
                  type="text" 
                  value={nftSymbol}
                  onChange={(e) => setNftSymbol(e.target.value)}
                  placeholder="e.g. AVTR"
                  className="w-full text-xs p-2 border rounded-sm bg-slate-50 dark:bg-slate-900 dark:border-slate-700"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-slate-500 font-bold">Metadata URI (JSON)</label>
                <input 
                  type="text" 
                  value={nftUri}
                  onChange={(e) => setNftUri(e.target.value)}
                  placeholder="https://gist.githubusercontent.com/..."
                  className="w-full text-xs p-2 border rounded-sm bg-slate-50 dark:bg-slate-900 dark:border-slate-700"
                />
              </div>

              <button
                  onClick={mintCompressedNft}
                  disabled={isMinting}
                  className={`w-full font-mono text-xs py-3 px-2 mt-4 rounded-sm border-b-2 transition-all ${
                    isMinting 
                    ? 'bg-slate-400 border-slate-500 cursor-not-allowed' 
                    : 'bg-purple-600 hover:bg-purple-500 text-white border-purple-800 active:border-b-0 active:translate-y-[2px]'
                  }`}
                >
                  {isMinting ? 'MINTING CNFT...' : 'READY TO MINT'}
              </button>
            </div>
            <p className="text-[10px] text-center mt-2 font-mono text-slate-400 italic">
              Note: Creating a new tree costs ~0.06 SOL on Devnet
            </p>
          </div>

          {signature && (
            <div className="mt-4 p-2 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded text-[10px] font-mono break-all text-green-700 dark:text-green-400">
              Last Sig: {signature}
            </div>
          )}
        </div>
      </div>
      <div className="mt-6 border rounded-sm p-6 shadow-lg bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700">
        <h2 className="text-xs font-bold uppercase tracking-wider mb-4 border-b pb-2 text-slate-500 border-slate-200 dark:text-slate-400 dark:border-slate-700 flex justify-between">
          <span>Minted cNFT History</span>
          <span className="text-blue-600">{mintHistory.length} Total</span>
        </h2>
        
        {mintHistory.length === 0 ? (
          <div className="py-10 text-center text-slate-400 font-mono text-xs border-2 border-dashed border-slate-100 dark:border-slate-700/50">
            NO ASSETS MINTED YET. TRY MINTING YOUR FIRST CNFT ABOVE!
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {mintHistory.map((sig, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 group">
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="text-[10px] font-mono text-slate-400">#{index + 1}</span>
                  <code className="text-xs font-mono text-slate-600 dark:text-slate-300 truncate">
                    {sig}
                  </code>
                </div>
                <button 
                  onClick={() => handleCopy(sig, 'history')}
                  className="ml-4 p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 rounded transition-all opacity-0 group-hover:opacity-100"
                >
                  📋
                </button>
              </div>
            ))}
          </div>
        )}
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
            <span className="font-bold text-lg tracking-tight font-mono">ParticleMint</span>
          </div>
          <div className="text-[10px] font-mono px-2 py-1 rounded bg-slate-900 text-slate-500 border border-slate-800 hidden sm:block">SOLANA DEVNET</div>
        </div>
      </nav>

      <Dashboard />
    </main>
  );
}