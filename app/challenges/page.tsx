import Challenge from "@/components/ui/challenge";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ethers } from "ethers";
import Loading from "@/app/challenges/loading";
import abi from "@/public/abi.json";
import { CONTRACT_ADDRESS } from "@/app/constants";
import { Suspense } from "react";

import AddChallenge from "@/components/ui/addChallenge";
// https://turquoise-neighbouring-nightingale-673.mypinata.cloud
// https://gateway.pinata.cloud/ipfs/
const provider = new ethers.InfuraProvider(
  process.env.ETHEREUM_NETWORK,
  process.env.INFURA_API_KEY
);

const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

async function getChallenge() {
  const challenges = await contract.getChallenges();
  const pinata =
    "https://turquoise-neighbouring-nightingale-673.mypinata.cloud/ipfs/";
  try {
    const challengeObject = await Promise.all(
      challenges.map(async (challenge: any[]) => {
        const cid = pinata + challenge[3];
        const res = await (await fetch(cid, { cache: "no-store" })).json();
        return {
          key: Number(challenge[0]),
          reward: Number(challenge[2]),
          name: res.name,
          description: res.description,
          category: res.category,
        };
      })
    );
    return challengeObject as any[];
  } catch (error) {
    console.log(error);
  }
}

export default async function ChallengesPage() {
  if (!cookies().has("userAddress")) {
    redirect("/login");
  } else {
    const userAddress = cookies().get("userAddress")!.value;
    const ownerAddress = await contract.getOwner();
    const challenges = await getChallenge();
    return (
      <div>
        <Suspense fallback={<Loading />}>
          <h1 className="text-sky-500 text-center my-4 text-xl">Challenges</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mx-8">
            {challenges?.map(async (challenge) => {
              let solved = await contract.IsChallengeSolved(
                userAddress,
                challenge.key
              );
              return (
                <Challenge
                  key={challenge.key}
                  isSolved={solved}
                  challenge={challenge}
                />
              );
            })}
          </div>
          {userAddress?.toLowerCase() === ownerAddress.toLowerCase() && (
            <AddChallenge />
          )}
        </Suspense>
      </div>
    );
  }
}
