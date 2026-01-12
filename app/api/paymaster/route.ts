import { NextResponse } from 'next/server';
import { Keypair, Connection } from '@solana/web3.js';
import bs58 from 'bs58';

const RPC_URL = "http://127.0.0.1:8899";
const connection = new Connection(RPC_URL, 'confirmed');

const paymasterKeypair = Keypair.generate();
const PAYMASTER_ADDRESS = paymasterKeypair.publicKey.toBase58();

console.log("Paymaster (Live Bridge Mode) Ready.");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const requestItem = Array.isArray(body) ? body[0] : body;
    const { method, id } = requestItem;

    let resultData;

    if (method === 'getPayerSigner') {
        resultData = PAYMASTER_ADDRESS;
    } 
    else if (method && method.toLowerCase().includes('blockhash')) {
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        const slot = await connection.getSlot();
        
        resultData = {
            context: { slot },
            value: {
                blockhash,
                lastValidBlockHeight
            }
        };
        console.log(`Fetched real blockhash: ${blockhash} at slot ${slot}`);
    }
    else if (method === 'signTransaction' || method === 'sign') {
        resultData = bs58.encode(Buffer.alloc(64, 1));
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
    console.error("Paymaster Bridge Error:", error);
    return NextResponse.json({ 
        jsonrpc: '2.0', 
        id: 1, 
        error: { code: -32603, message: "Internal Paymaster Error" } 
    }, { status: 500 });
  }
}
