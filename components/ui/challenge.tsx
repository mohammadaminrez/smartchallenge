"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ethers } from "ethers";
import { useToast } from "@/components/ui/use-toast";
import { CONTRACT_ADDRESS } from "@/app/constants";
import abi from "@/public/abi.json";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";

export async function submitChallenge(
  key: number,
  flag: string,
  toast: any,
  reward: string
) {
  let provider = new ethers.BrowserProvider(window.ethereum);
  let user = await provider?.getSigner();
  const SignedContract = new ethers.Contract(CONTRACT_ADDRESS, abi, user);

  SignedContract.on("ChallengeSubmitted", (value: string) => {
    if (value.includes("Correct answer")) {
      value += " You have earned : " + reward + " wei";
    }

    toast({
      title: "Challenge submitted",
      description: value,
      duration: 2000,
    });
  });

  try {
    const encodedFlag = ethers.keccak256(ethers.toUtf8Bytes(flag));
    let submit = await SignedContract.submitFlag(key, encodedFlag, {
      value: ethers.parseEther("0.000000000000000001"),
    });
    let receipt = await submit.wait();
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.revert.args[0],
      duration: 2000,
    });
    console.error(error);
  }
}

export default function Challenge({ challenge, isSolved }: any) {
  const { toast } = useToast();
  const [flag, setFlag] = useState("");
  const { key, reward, name, description } = challenge || {};
  return (
    <div className="mt-5">
      <Card
        className="mx-auto min-w-12 h-60 w-90 rounded-lg shadow-lg"
        isSolved={isSolved}
      >
        <CardHeader className="mt-3">
          <CardTitle>{name}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {isSolved ? (
            <p>Earned {reward} wei</p>
          ) : (
            <p>Correct answer earns {reward} wei</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {!isSolved && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Deploy</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Submit flag</DialogTitle>
                  <DialogDescription>
                    Submit the flag for this challenge here.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Flag
                    </Label>
                    <Input
                      id="flag"
                      className="col-span-3"
                      value={flag}
                      onChange={(e) => setFlag(e.target.value)}
                    />
                  </div>
                  <div className="col-span-4 text-center text-red-500 text-sm">
                    Note: You will spend a wei to try this flag.
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    onClick={() =>
                      submitChallenge(key, flag, toast, reward.toString())
                    }
                  >
                    Submit
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Link
            className={
              buttonVariants({ variant: "outline" }) +
              " bg-black text-white hover:bg-slate-800 hover:text-white"
            }
            href={`/challenge/${key}`}
          >
            Start
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
