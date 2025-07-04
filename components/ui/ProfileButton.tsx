"use client";
import { ethers } from "ethers";
import { useState, useEffect, useRef } from "react";
import { Settings, LogOut } from "lucide-react";
import { useUser } from "@/components/context/context";
import { delete_cookie } from "@/app/actions/actions";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { CONTRACT_ADDRESS } from "@/app/constants";
import "dotenv/config";
import abi from "@/public/abi.json";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export async function getImage(toast: any) {
  let provider = new ethers.BrowserProvider(window.ethereum);
  let user = await provider?.getSigner();
  const SignedContract = new ethers.Contract(CONTRACT_ADDRESS, abi, user);
  try {
    const hash = await SignedContract.getPlayer();
    if (hash !== "") {
      let image = "https://gateway.pinata.cloud/ipfs/" + hash;
      return image;
    }
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message,
      duration: 2000,
    });
  }
  return "https://github.com/shadcn.png";
}

export async function ModifyProfile(selectedFile: any, toast: any) {
  let provider = new ethers.BrowserProvider(window.ethereum);
  let user = await provider?.getSigner();
  const SignedContract = new ethers.Contract(CONTRACT_ADDRESS, abi, user);

  const data = new FormData();
  data.append("file", selectedFile);
  data.append("pinataMetadata", JSON.stringify({ name: "pinnie.json" }));
  data.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

  const options = {
    method: "POST",
    headers: {
      accept: "application/json",
      authorization:
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIxY2ZhYTlkYS0wMzkxLTRkODAtYTk2YS05NjllNmUxZDI2MWMiLCJlbWFpbCI6ImFsaS5oYWlkZXIuaWljMDBAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siaWQiOiJGUkExIiwiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjF9LHsiaWQiOiJOWUMxIiwiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjF9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImUyZTRlODYyYTJlOTdlYWRlZjkwIiwic2NvcGVkS2V5U2VjcmV0IjoiYTZlZmI4MTZmNGZiMzI0MGQ2OGZiNTlhOTA5NjMzOTkzZDU2YTJhMGU0NjQwOTQxMmVlZDc4ZWQ0NzNmODA5NiIsImlhdCI6MTcwNzA3MjA4NH0.355NkcXe1T1Zr1YQYLTYS-yUyrcQ-8aC-oiSNL_XlYk",
    },
    body: data,
  };

  try {
    const response = await (
      await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", options)
    ).json();
    console.log(response.IpfsHash);
    try {
      let add = await SignedContract.updatePlayer(response.IpfsHash);
      toast({
        title: "Player modified",
        description: "The player has been modified successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        duration: 2000,
      });
    }
  } catch (error) {
    console.error(error);
  }
}

const ProfileButton = () => {
  const { toast } = useToast();
  const { userAddress, setUserAddress } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState();
  const node = useRef<HTMLDivElement>(null);
  const [ProfileImg, setProfileImg] = useState("");

  useEffect(() => {
    (async () => {
      setProfileImg(await getImage(toast));
    })();

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          (async () => {
            setProfileImg(await getImage(toast));
          })();
        }
      });
    }
  }, []);

  const handleImageUpload = (event: any) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleSignOut = () => {
    delete_cookie();
    setUserAddress("");
    router.push("/login");
  };

  const handleClickOutside = (e: any) => {
    if (node.current && node.current.contains(e.target as Node)) {
      // inside click
      return;
    }
    // outside click
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Avatar
        className="cursor-pointer hover:opacity-75 active:ring-2 active:outline-blue-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <AvatarImage src={ProfileImg} />
      </Avatar>

      {isOpen && (
        <div
          className="w-72 py-4 px-8 absolute right-0 mt-2 sm:w-96 rounded-2xl shadow-xl bg-white ring-1 ring-black ring-opacity-5"
          ref={node}
        >
          <div className="flex items-center my-4">
            <Avatar className="mr-4">
              <AvatarImage src={ProfileImg} />
            </Avatar>
            <div className="truncate ... whitespace-nowrap font-semibold">
              {userAddress}
            </div>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <button className="flex w-full px-4 py-2 items-center rounded-lg text-sm text-gray-700 hover:bg-gray-100">
                <Settings className="w-4 mr-4 opacity-70" />
                Manage account
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Account</DialogTitle>
                <DialogDescription>
                  Manage your account information
                </DialogDescription>
              </DialogHeader>
              <Separator />
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="profile-picture" className="text-right">
                    Profile image:
                  </Label>
                  <Input
                    type="file"
                    id="profile-picture"
                    onChange={handleImageUpload}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  onClick={() => ModifyProfile(selectedFile, toast)}
                >
                  Save changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <button
            onClick={handleSignOut}
            className="flex w-full px-4 py-2 items-center rounded-lg text-sm text-gray-700 hover:bg-gray-100"
          >
            <LogOut className="w-4 mr-4 opacity-70" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileButton;
