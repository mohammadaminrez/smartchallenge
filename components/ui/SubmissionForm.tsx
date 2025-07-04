"use client";
import {
  getChallengeSolution,
  checkSolutionCorrectness,
  getChallengeFlag,
} from "@/app/actions/user_actions";
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SubmissionForm({
  challengeKey,
  problem,
  name,
  apiUrl,
}: {
  challengeKey: Number;
  problem: string;
  name: string;
  apiUrl: string;
}) {
  const [inputValues, setInputValues] = useState(
    Array(problem.split("...").length - 1).fill("")
  );
  const [flag, setFlag] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const solution = await getChallengeSolution(challengeKey, apiUrl);
    const checkCorrect = await checkSolutionCorrectness(
      inputValues.join(" ").toString(),
      solution
    );
    if (checkCorrect) {
      const flag = await getChallengeFlag(challengeKey, apiUrl);
      setFlag(flag);
    } else {
      setFlag("Incorrect solution!");
    }
  };

  // Split the problem string into segments based on "..."
  const problemSegments = problem.split("...");

  return (
    <form onSubmit={handleSubmit}>
      <Card
        key={challengeKey.toString()}
        className="mx-auto min-w-80 min-h-32 flex flex-wrap items-center justify-center rounded-lg shadow-lg w-1/2 "
      >
        <CardHeader>
          <CardTitle>{name}</CardTitle>
        </CardHeader>
        <CardContent>
          {problemSegments.map((segment, index) => (
            <React.Fragment key={index}>
              <p>{segment}</p>

              {index < problemSegments.length - 1 && ( // Don't render an input after the last segment
                <input
                  type="text"
                  value={inputValues[index]}
                  className="bg-white border-2 border-gray-300 rounded-lg p-2 w-1/3 mt-1 mb-1"
                  onChange={(e) => {
                    const newInputValues = [...inputValues];
                    newInputValues[index] = e.target.value;
                    setInputValues(newInputValues);
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </CardContent>
        <CardFooter className="flex justify-center flex-col">
          <Button type="submit" variant="ghost">
            Submit
          </Button>
          {flag && <p>{flag}</p>}
        </CardFooter>
      </Card>
    </form>
  );
}
