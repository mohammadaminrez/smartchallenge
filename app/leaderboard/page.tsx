"use client";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import Loading from "@/app/challenges/loading";
import abi from "@/public/abi.json";
import { CONTRACT_ADDRESS } from "@/app/constants";

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScores = async () => {
      setLoading(true);
      let provider = new ethers.BrowserProvider(window.ethereum);
      let contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
      let [addresses, scores] = await contract.getScores();

      // Create an array of objects, each object contains an address and a score
      let players = addresses.map((address: string, index: number) => ({
        address,
        score: scores[index].toString(),
      }));

      // Sort the array in descending order of score
      players.sort((a: any, b: any) => b.score - a.score);

      setLeaderboard(players);
      setLoading(false);
    };

    fetchScores();
  }, []);

  if (loading) {
    return <Loading />;
  } else {
    return (
      <div>
        <h1 className="text-sky-500 text-center my-4 text-xl">Leaderboard</h1>
        <table className="table-auto text-center border-collapse border-2 border-slate-500">
          <thead>
            <tr className="bg-sky-500">
              <th className="border border-slate-600 px-4">Pos</th>
              <th className="border border-slate-600 px-4">Player</th>
              <th className="border border-slate-600 px-4">Score</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map(
              (player: { address: string; score: number }, index: number) => (
                <tr key={index}>
                  <td className="p-4 border border-slate-700">{index + 1}</td>
                  <td className="p-4 border border-slate-700">
                    {player.address}
                  </td>
                  <td className="p-4 font-bold border border-slate-700">
                    {player.score}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    );
  }
};

export default Leaderboard;
