import { ethers } from "ethers";
import ABI from "../abi/SmartChallengeUpgradeable.json";

const ADDR = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;

export function getProvider() {
  if (typeof window !== "undefined" && (window as any).ethereum) {
    return new ethers.BrowserProvider((window as any).ethereum);
  }
  return new ethers.JsonRpcProvider(`https://sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_PROJECT_ID}`);
}

export function getSigner() {
  const p = getProvider();
  if (p instanceof ethers.BrowserProvider) return p.getSigner();
  throw new Error("No signer available");
}

export async function getContract(withSigner = false) {
  const provider = getProvider();
  const signerOrProvider =
    withSigner && provider instanceof ethers.BrowserProvider ? await provider.getSigner() : provider;
  const contract = new ethers.Contract(ADDR, ABI.abi, signerOrProvider);

  return contract;
}

