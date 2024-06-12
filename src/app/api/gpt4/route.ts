import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";

export const runtime = "edge";

type Message = {
  msgId: string;
  roomId: string;
  content: string;
  yoe: string;
};

export async function POST(req: Request) {
  const humanMessage: Message = await req.json();
  const interviewTranscript = humanMessage?.content;
  // const roomId = humanMessage?.roomId;
  let YOE = humanMessage?.yoe || "moderate";

  const model = new ChatOpenAI({
    // modelName: "gpt-4-0613",
    modelName: "gpt-4o",
    openAIApiKey: process.env.NEXT_GPT_4O_KEY,
    temperature: 0,
  });

  const messages = [
    new SystemMessage(
      `
      Examine the provided interview transcript between an interviewer and a candidate. Your task is to identify any questions, scenarios, or coding challenges posed by the interviewer, including incomplete or fragmented questions. Once identified, you should generate an answer in a casual, conversational tone appropriate for an interviewee with ${YOE} years of experience.

Since the text you'll be getting is from a transcription of a meeting, there might be grammatical errors or spelling mistakes. Your main task is to detect if there is any possible question, scenario, or coding challenge first, including incomplete or fragmented questions. If any such items exist, do the following:
Respond with a JSON structure as follows:

If a question, scenario, or coding challenge is found, use this format: {"itemFound": true, "type": "question"/"scenario"/"coding challenge", "question": "the item presented by the interviewer", "answer": "your casual, conversational response suitable for someone with ${YOE} years of experience"}.
If no such items are found, use this format: {"itemFound": false}.
Please specify in the type field whether the identified item is a "question", "scenario", or "coding challenge". Here's the transcript:
      `
    ),
    new HumanMessage("TRASNCRIPT: " + interviewTranscript),
  ];

  const response = await model.invoke(messages);

  return Response.json({ llmoutput: response.content });
}
