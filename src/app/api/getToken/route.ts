import axios from "axios";

export async function POST(request: Request) {
  const response = await axios.post(
    "https://api.assemblyai.com/v2/realtime/token",
    { expires_in: 3600 },
    { headers: { authorization: process.env.NEXT_PUBLIC_AIASSEMLBY_apiKey } } 
  );
  const { data } = response;
  console.log(data);
  console.log("response sent");
  return Response.json(data);
}
