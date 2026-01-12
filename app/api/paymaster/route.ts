import { NextResponse } from 'next/server';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';


const SECRET_KEY = new Uint8Array([
  239, 175, 196, 243, 136, 201, 75, 249, 96, 207, 225, 168, 0, 105, 117, 232, 
  152, 187, 48, 99, 102, 209, 37, 248, 163, 148, 251, 229, 48, 116, 77, 201, 
  172, 215, 133, 93, 163, 207, 178, 154, 207, 148, 195, 155, 183, 123, 66, 73, 
  83, 34, 70, 128, 28, 214, 187, 73, 129, 87, 99, 114, 149, 168, 98, 34
]);
const paymasterKeypair = Keypair.fromSecretKey(SECRET_KEY);
const PAYMASTER_ADDRESS = paymasterKeypair.publicKey.toBase58();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};


export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  console.log(">>> Paymaster received a request!");
  try {
    const text = await req.text();
    if (!text) {
      return NextResponse.json({ error: "Empty request body" }, { status: 400, headers: corsHeaders });
    }
    
    const body = JSON.parse(text);
    const requestItem = Array.isArray(body) ? body[0] : body;
    const method = requestItem.method;
    const id = requestItem.id || 1;

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

    return NextResponse.json(
      { jsonrpc: '2.0', id, result: resultData },
      { headers: corsHeaders }
    );
    
  } catch (error) {
    console.error("Paymaster Error:", error);
    return NextResponse.json(
      { jsonrpc: '2.0', error: { code: -32603, message: "Internal Error" } }, 
      { status: 500, headers: corsHeaders }
    );
  }
}