import { ethers } from "ethers";

const NFT_ADDRESS = "0x4CB46E91B37b5efd1Be89E25EAb1cEd7E1C9EbCe";

const ABI = [
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)"
];

export async function getOwner(tokenId: number, rpcUrl: string) {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(NFT_ADDRESS, ABI, provider);

  const owner = await contract.ownerOf(tokenId);
  return owner;
}

export async function getTokenURI(tokenId: number, rpcUrl: string) {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(NFT_ADDRESS, ABI, provider);

  const uri = await contract.tokenURI(tokenId);
  return uri;
}
