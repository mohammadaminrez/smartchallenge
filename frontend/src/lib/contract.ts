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

export async function getChallenge(challengeId: number) {
  const contract = await getContract();
  return await contract.challenges(challengeId);
}

export async function getChallenges() {
  const contract = await getContract();
  return await contract.getChallenges();
}

export function hashFlag(flagText: string) {
  return ethers.keccak256(ethers.toUtf8Bytes(flagText));
}

export async function updateChallenge(
  challengeId: number,
  flagText: string,
  newReward: string,
  newIpfsHash: string,
  newDifficulty: number,
  newSubmissionFee: string
) {
  const contract = await getContract(true);
  const flagHash = hashFlag(flagText);
  const tx = await contract.updateChallenge(
    challengeId,
    flagHash,
    newReward,
    newIpfsHash,
    newDifficulty,
    newSubmissionFee
  );
  await tx.wait();
}

