"use client";

import axios from "axios";

export async function getChallengeFlag(id: Number, apiUrl: string) {
  try {
    const response = await axios.get(apiUrl, {
      params: {
        id: Number(id),
      },
      headers: {
        "api-key": "your_api_key_here",
      },
    });
    return response.data.flag;
  } catch (error) {
    console.error(error);
  }
}

export async function getChallengeSolution(id: Number, apiUrl: string) {
  try {
    const response = await axios.get(apiUrl, {
      params: {
        id: Number(id),
      },
      headers: {
        "api-key": "your_api_key_here",
      },
    });
    return response.data.solution;
  } catch (error) {
    console.error(error);
  }
}

export async function checkSolutionCorrectness(
  userSolution: string,
  challengeSolution: string
) {
  if (userSolution === challengeSolution) {
    console.log("Correct solution!");
    return true;
  } else {
    console.log("Incorrect solution!");
    return false;
  }
}

export async function getChallengeProblem(id: Number, apiUrl: string) {
  try {
    const response = await axios.get(apiUrl, {
      params: {
        id: Number(id),
      },
      headers: {
        "api-key": "your_api_key_here",
      },
    });
    return response.data.problem;
  } catch (error) {
    console.error(error);
  }
}
