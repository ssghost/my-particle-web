import { NextResponse } from 'next/server';
import bs58 from 'bs58';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleSingleRequest(method: string, params: any) {
    const PAYMASTER_ADDRESS = "8ESM1y5XNrkdDp6S5NtkLFmpGBTLNRj2YYNjaSq7Uka5";
    const LAZORKIT_PROGRAM_ID = "Gsuz7YcA5sbMGVRXT3xSYhJBessW4xFC4xYsihNCqMFh";
    const disc0 = bs58.decode("6undqAG2F8v"); 
    const disc41 = bs58.decode("31jF87uC71v33vHs9Azd4HrrMd542enA9J4QBNFmYUCc");
    const buffer = Buffer.alloc(860, 0); 

    buffer.set(disc0, 0); 
    buffer.set(disc41, 41); 

    const VALID_DATA_BASE64 = buffer.toString('base64');

    const lazorkitAccount = {
        data: [VALID_DATA_BASE64, "base64"],
        executable: false,
        lamports: 2000000000, 
        owner: LAZORKIT_PROGRAM_ID, 
        rentEpoch: 0,
        space: 860 
    };

    const systemAccount = {
        data: ["", "base64"],
        executable: false,
        lamports: 1000000000, 
        owner: "11111111111111111111111111111111", 
        rentEpoch: 0,
        space: 0 
    };

    if (method === 'getAccountInfo') {
        const requestedPubkey = params ? params[0] : "";
        if (requestedPubkey === PAYMASTER_ADDRESS) return { context: { slot: 10000 }, value: lazorkitAccount };
        return { context: { slot: 10000 }, value: systemAccount };
    } 

    if (method === 'getProgramAccounts' || method === 'getTokenAccountsByOwner') {
        return [{
            pubkey: PAYMASTER_ADDRESS, 
            account: lazorkitAccount 
        }];
    }
    
    if (method === 'getMultipleAccounts') {
        const addresses = (params && Array.isArray(params[0])) ? params[0] : [];
        const values = addresses.map((addr: string) => (addr === PAYMASTER_ADDRESS ? lazorkitAccount : systemAccount));
        return { context: { slot: 10000 }, value: values };
    }

    if (method === 'getFeeForMessage') return { context: { slot: 10000 }, value: 5000 };
    if (method === 'getBalance' || method === 'getMinimumBalanceForRentExemption') return { context: { slot: 10000 }, value: 2000000000 };
    if (method && method.toLowerCase().includes('blockhash')) {
         return { context: { slot: 10000 }, value: { blockhash: "GfV6W9GfV6W9GfV6W9GfV6W9GfV6W9GfV6W9GfV6W9Gf", lastValidBlockHeight: 100000000 }};
    }
    if (method === 'getSlot') return 10000;
    if (method === 'getHealth') return "ok";

    return { context: { slot: 10000 }, value: systemAccount };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const requests = Array.isArray(body) ? body : [body];
    const mockResponses = requests.map((reqItem) => ({
        jsonrpc: "2.0",
        id: reqItem.id,
        result: handleSingleRequest(reqItem.method, reqItem.params)
    }));
    return NextResponse.json(Array.isArray(body) ? mockResponses : mockResponses[0]);
  } catch {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}