import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";

export const runtime = "edge";

type Message = {
  msgId: string;
  roomId: string;
  content: string;
  yoe: string;
  role: string;
};

export async function POST(req: Request) {
  const humanMessage: Message = await req.json();
  const interviewTranscript = humanMessage?.content;
  // const roomId = humanMessage?.roomId;
  let YOE = humanMessage?.yoe || "moderate";
  let role = humanMessage?.role

  const model = new ChatOpenAI({
    // modelName: "gpt-4-0613",
    modelName: "gpt-4o",
    openAIApiKey: process.env.NEXT_GPT_4O_KEY,
    temperature: 0,
  });

  const messages = [
    new SystemMessage(
      `
Examine the provided interview transcript between an interviewer and a candidate who is applying for the role ${role}. Your task is to identify any questions, scenarios, or coding challenges posed by the interviewer. The transcript may contain embedded questions, scenarios, or challenges within longer statements or discussions. Once identified, you should generate the following response for an interviewee with ${YOE} years of experience:

If a question, scenario, or coding challenge is found, use this format: {"itemFound": true, "type": "question"/"scenario"/"coding challenge", "question": "the item presented by the interviewer","experience":"${YOE} years of experience"}.
If no such items are found, use this format: {"itemFound": "false"}.
Please specify in the type field whether the identified item is a "question", "scenario", or "coding challenge". Here's the transcript:

Note: Only include the JSON in your response.
      `
    ),
    new HumanMessage("TRASNCRIPT: " + interviewTranscript),
  ];

  const response = await model.invoke(messages);

  return Response.json({ llmoutput: response.content });
}
