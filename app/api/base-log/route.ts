import { ethers } from "ethers";

let buffer: string[] = [];

export async function POST(req: Request) {
  try {
    const { hash } = await req.json();

    if (!hash) {
      return Response.json(
        {
          success: false,
          error: "Missing hash",
        },
        { status: 400 }
      );
    }

    buffer.push(hash);

    console.log("CLICK BUFFERED:", hash);

    if (buffer.length >= 50) {
      const batch = buffer.join("|");

      const finalHash = ethers.keccak256(
        ethers.toUtf8Bytes(batch)
      );

      const provider = new ethers.JsonRpcProvider(
        "https://mainnet.base.org"
      );

      const privateKey = process.env.PRIVATE_KEY;

      if (!privateKey) {
        return Response.json(
          {
            success: false,
            error: "Missing PRIVATE_KEY",
          },
          { status: 500 }
        );
      }

      const wallet = new ethers.Wallet(
        privateKey,
        provider
      );

      const tx = await wallet.sendTransaction({
        to: wallet.address,
        value: 0,
        data: ethers.hexlify(
          ethers.toUtf8Bytes(
            `BATCH:${finalHash}`
          )
        ),
      });

      console.log("BATCH SENT:", tx.hash);

      buffer = [];
    }

    return Response.json({
      success: true,
      buffered: buffer.length,
    });

  } catch (error: any) {
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

``
