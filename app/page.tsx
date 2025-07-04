"use client";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import Image from "next/image";
import coding from "@/public/coding.png";
import maths from "@/public/maths.png";
import security from "@/public/security.png";
import { useUser } from "@/components/context/context";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

type slide = {
  text: string;
  image: any;
};

export default function Home() {
  const { userAddress } = useUser();

  const a: slide[] = [
    {
      text: "SmartChallenge is an innovative platform designed to test and enhance your skills in coding, mathematics, and security. Our challenges are designed to push your limits and inspire creativity.",
      image: coding,
    },
    {
      text: "Upon successful completion of each challenge, you'll receive a flag. Submit this flag along with your player's address to our smart contract, and watch as your score updates on our live competition scoreboard.",
      image: maths,
    },
    {
      text: "New challenges will be added regularly, each with their own flags. You'll have to figure them out on your own! Good luck, and may the best mind win!",
      image: security,
    },
  ];

  return (
    <div className="text-center">
      <h1 className="text-sky-500 my-2">Welcome to SmartChallenge@DIBRIS!</h1>
      <Carousel className="w-full max-w-80 sm:max-w-sm md:max-w-md md:mb-4 lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl">
        <CarouselContent>
          {a.map((s: slide, index: number) => (
            <CarouselItem key={index}>
              <div className="p-1">
                <Card>
                  <CardContent className="flex-col items-center justify-center p-6">
                    <h1>{s.text}</h1>
                    <Image
                      className="m-auto my-2"
                      src={s.image}
                      alt="Picture"
                      height={200}
                    />
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
      {!userAddress && (
        <Link className={buttonVariants({ variant: "outline" })} href="/login">
          Connect Wallet to Start!
        </Link>
      )}
      {userAddress && (
        <Link className={buttonVariants({ variant: "outline" })} href="/">
          user: {userAddress}
        </Link>
      )}
    </div>
  );
}
