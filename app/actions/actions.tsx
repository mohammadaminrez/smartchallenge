"use server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ethers } from "ethers";

export async function set_cookie(userAddress: string) {
  cookies().set("userAddress", userAddress);
  redirect("/challenges");
}

export async function get_cookie() {
  return cookies().get("userAddress")?.value;
}

export async function delete_cookie() {
  cookies().delete("userAddress");
}


