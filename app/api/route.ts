import { sql } from "@vercel/postgres";
const API_KEY = "your_api_key_here";

type Challenge = {
  id: number;
  flag: string;
  solution: string;
};

export async function GET(req: Request) {
  const apiKey = req.headers.get("api-key");
  if (apiKey !== API_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    const { rows: challenges } = await sql`SELECT * FROM challenges`;
    return Response.json(challenges);
  }
  const { rows: challenge } =
    await sql`SELECT * FROM challenges WHERE id = ${Number(id)}`;
  return Response.json(challenge[0]);
}

export async function POST(req: Request) {
  const apiKey = req.headers.get("api-key");
  if (apiKey !== API_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const newChallenge: Challenge = await new Response(req.body).json();
  const { rowCount } =
    await sql`SELECT 1 FROM challenges WHERE id = ${newChallenge.id}`;
  if (rowCount > 0) {
    return Response.json("A challenge with this ID already exists");
  } else {
    await sql`INSERT INTO challenges (id, flag, solution) VALUES (${newChallenge.id}, ${newChallenge.flag}, ${newChallenge.solution})`;
    return Response.json("Challenge added successfully");
  }
}
