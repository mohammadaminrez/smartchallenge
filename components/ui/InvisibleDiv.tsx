"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { getChallengeFlag } from "@/app/actions/user_actions";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function InvisibleDiv({
  challengeKey,
  apiUrl,
  name,
  problem,
}: {
  challengeKey: Number;
  name: string;
  problem: string;
  apiUrl: string;
}) {
  const [flag, setFlag] = React.useState<string | null>(null);

  const handleClick = async () => {
    const flag = await getChallengeFlag(challengeKey, apiUrl);
    setFlag(flag);
  };

  return (
    <>
      <div className="justify-center">
        <Card className="mx-auto min-w-80 min-h-32 flex flex-wrap items-center justify-center w-90 rounded-lg shadow-lg w-1/2 ">
          <CardHeader>
            <CardTitle>{name}</CardTitle>
            {<CardDescription>{problem}</CardDescription>}
          </CardHeader>
        </Card>
      </div>
      <div className="invisible flex mt-8 mx-8 items-center justify-center">
        <Button variant="ghost" onClick={handleClick}>
          Obtain The Flag
        </Button>
        {flag && <p>{flag}</p>}
      </div>
    </>
  );
}
