"use client";
import { ethers } from "ethers";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { CONTRACT_ADDRESS } from "@/app/constants";
import abi from "@/public/abi.json";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const apiUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000/api"
    : "https://smartchallenge.vercel.app/api";

// call the api to save the flag in clear in the API instead of the contract that contains the hash
export async function saveFlag(id: Number, flag: string, solution: string) {
  try {
    const response = await axios.post(
      `${apiUrl}`,
      {
        id: Number(id),
        flag: flag,
        solution: solution,
      },
      {
        headers: {
          "api-key": "your_api_key_here",
        },
      }
    );
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
}

export async function add(
  name: string,
  description: string,
  flag: string,
  reward: Number,
  category: string,
  problem: string,
  solution: string,
  toast: any
) {
  let provider = new ethers.BrowserProvider(window.ethereum);
  let user = await provider?.getSigner();
  const SignedContract = new ethers.Contract(CONTRACT_ADDRESS, abi, user);

  const options = {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization:
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIxY2ZhYTlkYS0wMzkxLTRkODAtYTk2YS05NjllNmUxZDI2MWMiLCJlbWFpbCI6ImFsaS5oYWlkZXIuaWljMDBAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siaWQiOiJGUkExIiwiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjF9LHsiaWQiOiJOWUMxIiwiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjF9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImUyZTRlODYyYTJlOTdlYWRlZjkwIiwic2NvcGVkS2V5U2VjcmV0IjoiYTZlZmI4MTZmNGZiMzI0MGQ2OGZiNTlhOTA5NjMzOTkzZDU2YTJhMGU0NjQwOTQxMmVlZDc4ZWQ0NzNmODA5NiIsImlhdCI6MTcwNzA3MjA4NH0.355NkcXe1T1Zr1YQYLTYS-yUyrcQ-8aC-oiSNL_XlYk",
    },
    body: JSON.stringify({
      pinataContent: {
        name: name,
        description: description,
        category: category,
        problem: problem,
      },
      pinataOptions: { cidVersion: 1 },
      pinataMetadata: { name: "pinnie.json" },
    }),
  };

  try {
    const response = await (
      await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", options)
    ).json();
    console.log(response.IpfsHash);

    try {
      const encodedFlag = ethers.keccak256(ethers.toUtf8Bytes(flag));
      let add = await SignedContract.addChallenge(
        encodedFlag,
        reward,
        response.IpfsHash
      );
      toast({
        title: "Challenge added",
        description: "The challenge has been added to the platform",
      });
      try {
        SignedContract.challengeCounter().then(async (id) => {
          await saveFlag(id, flag, solution);
          console.log("Flag and solution saved in the API");
        });
      } catch (error) {
        console.error("Challenge counter error -> ", error);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.revert.args[0],
        duration: 2000,
      });
    }
  } catch (error) {
    console.error(error);
  }
}

export default function AddChallenge() {
  const [flag, setFlag] = useState("");
  const [reward, setReward] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const { toast } = useToast();

  return (
    <div>
      <div className="fixed bottom-7 right-7">
        <Dialog>
          <DialogTrigger asChild>
            <button className="p-0 w-16 h-16 bg-sky-500 rounded-full hover:bg-sky-400 active:shadow-lg shadow transition ease-in duration-200 focus:outline-none">
              <svg viewBox="0 0 20 20" className="w-6 h-6 inline-block">
                <path
                  fill="#FFFFFF"
                  d="M16,10c0,0.553-0.048,1-0.601,1H11v4.399C11,15.951,10.553,16,10,16c-0.553,0-1-0.049-1-0.601V11H4.601 C4.049,11,4,10.553,4,10c0-0.553,0.049-1,0.601-1H9V4.601C9,4.048,9.447,4,10,4c0.553,0,1,0.048,1,0.601V9h4.399 C15.952,9,16,9.447,16,10z"
                />
              </svg>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Add Challenge</DialogTitle>
              <DialogDescription>
                Add a new challenge to the platform
              </DialogDescription>
            </DialogHeader>
            <Separator />
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  className="col-span-3"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input
                  id="description"
                  className="col-span-3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Category
                </Label>
                <Input
                  id="category"
                  className="col-span-3"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="flag" className="text-right">
                  Flag
                </Label>
                <Input
                  id="flag"
                  className="col-span-3"
                  value={flag}
                  onChange={(e) => setFlag(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="reward" className="text-right">
                  Reward
                </Label>
                <Input
                  id="reward"
                  className="col-span-3"
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="solution" className="text-right">
                  Problem
                </Label>
                <Input
                  id="problem"
                  className="col-span-3"
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="solution" className="text-right">
                  Solution
                </Label>
                <Input
                  id="solution"
                  className="col-span-3"
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() =>
                  add(
                    name,
                    description,
                    flag,
                    +reward,
                    category,
                    problem,
                    solution,
                    toast
                  )
                }
                type="submit"
              >
                Save changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
