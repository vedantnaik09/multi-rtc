import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";

export const runtime = "edge";

type Message = {
  itemFound: boolean;
  type: string;
  question: string;
  experience: string;
  role: string;
};

export async function POST(req: Request) {
  const humanMessage: Message = await req.json();
  const prompt = {
    itemFound: humanMessage.itemFound,
    type: humanMessage.type,
    question: humanMessage.question,
    yoe: humanMessage.experience,
  };
  const role = humanMessage?.role;
  let YOE = humanMessage?.experience || "moderate";
  // console.log("human message is ",humanMessage)
  // console.log("prompt is ",prompt)
  const model = new ChatOpenAI({
    // modelName: "gpt-4-0613",
    modelName: "gpt-4o",
    openAIApiKey: process.env.NEXT_GPT_4O_KEY,
    temperature: 0,
  });

  const messages = [
    new SystemMessage(
      `Consider an interview is going on for role ${role} between interviewer and candidate with ${YOE} yrs of experience. You'll get the following type of prompt:

{"itemFound": true, "type": "question"/"scenario"/"coding challenge", "question": "the item presented by the interviewer", "experience":"${YOE} years of experience"}

You should generate an answer in a casual, conversational tone appropriate for an interviewee with ${YOE} years of experience. Respond with a JSON structure as follows:
{"itemFound": true, "type":${prompt.type}, "question":${prompt.question}, "experience":${prompt.yoe},"answer": "your casual, conversational response suitable for someone with ${YOE} years of experience should come here"}
itemFound should be always true, if in the given prompt it is true.
Here is the prompt:

 Note: Only include the JSON in your response.`
    ),
    new HumanMessage("Prompt: " + prompt),
  ];

  const response = await model.invoke(messages);

  return Response.json({ llmoutput: response.content });
}
