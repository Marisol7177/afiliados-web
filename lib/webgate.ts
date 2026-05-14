import { ethers } from "ethers";

const abi = [
  "function getConfig() view returns (string,string,bool)"
];

export async function getWebGateConfig() {
  const provider = new ethers.JsonRpcProvider(
    process.env.NEXT_PUBLIC_RPC_URL
  );

  const contract = new ethers.Contract(
    process.env.NEXT_PUBLIC_CONTRACT!,
    abi,
    provider
  );

  const [url, version, active] = await contract.getConfig();

  return { url, version, active };
}
