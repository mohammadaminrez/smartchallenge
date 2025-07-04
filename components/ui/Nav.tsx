"use client";
import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";
import sc from "@/public/smart.png";
import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@/components/context/context";

import ProfileButton from "@/components/ui/ProfileButton";

type Link = {
  name: string;
  href: string;
};

export default function Nav() {
  const { userAddress, setUserAddress } = useUser();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const links: Link[] = [
    {
      name: "Home",
      href: "/",
    },
    {
      name: "Challenges",
      href: "/challenges",
    },
    {
      name: "Leaderboard",
      href: "/leaderboard",
    },
  ];

  return (
    <nav className="flex justify-between items-center shadow-md fixed top-0 left-0 right-0 bg-white z-10">
      <Link className="flex items-center ml-4" href="/">
        <Image
          className={`${isOpen ? "hidden" : "block"}`}
          src={sc}
          alt="Picture"
          width={70}
          height={70}
        />
        <h2 className="text-xl logo hidden md:block">SmartChallenge</h2>
      </Link>
      <div className="mr-4 md:hidden">
        <button
          className="text-gray-700 outline-none p-2 rounded-md focus:border-gray-400 focus:border"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Menu />
        </button>
      </div>
      <div
        className={`justify-self-center pb-3 mt-8 md:block md:pb-0 md:mt-0 ${
          isOpen ? "flex-1 block" : "hidden"
        }`}
      >
        <ul className="justify-center items-center space-y-8 mr-4 md:flex md:space-x-0 md:space-y-0">
          {links.map((link: Link, index: number) => (
            <li key={index} className="text-gray-600">
              <Link
                key={index}
                href={`${link.href}`}
                className={`${
                  pathname === link.href
                    ? "text-2xl font-medium"
                    : "hover:text-indigo-600 text-base font-light"
                } mx-4`}
              >
                {link.name}
              </Link>
            </li>
          ))}
          <li className="justify-center items-center place-items-center"></li>
          {userAddress && <ProfileButton />}
        </ul>
      </div>
    </nav>
  );
}
