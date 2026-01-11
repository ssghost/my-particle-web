import { NextResponse } from 'next/server';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

const paymasterKeypair = Keypair.generate();
const PAYMASTER_ADDRESS = paymasterKeypair.publicKey.toBase58();

console.log("=== Paymaster (Mock Mode) Ready ===");
console.log("Address:", PAYMASTER_ADDRESS);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const requestItem = Array.isArray(body) ? body[0] : body;
    const method = requestItem.method;
    const id = requestItem.id;

    let resultData;

    if (method === 'getPayerSigner') {
        resultData = PAYMASTER_ADDRESS;
    } 
    else if (method === 'signTransaction' || method === 'sign') {
        resultData = bs58.encode(Buffer.alloc(64, 1));
    }
    else if (method && method.toLowerCase().includes('blockhash')) {
         resultData = {
            context: { slot: 10000 },
            value: {
                blockhash: "GfV6W9GfV6W9GfV6W9GfV6W9GfV6W9GfV6W9GfV6W9Gf",
                lastValidBlockHeight: 100000000
            }
        };
    }
    else {
        resultData = PAYMASTER_ADDRESS;
    }

    return NextResponse.json({
      jsonrpc: '2.0',
      id: id,
      result: resultData 
    });
    
  } catch (error) {
    console.error("Paymaster Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}