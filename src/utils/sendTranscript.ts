import { push, ref } from "firebase/database";
import { extractJson } from "./extractJson";
import { database } from "@/app/firebaseConfig";
import axios from "axios";
import { showWarningToast } from "./toasts";

export async function sendTranscriptTo_Chatgpt_AndPushInDatabase(
  roomId: string,
  value: string,
  yoe?: string
) {
  try {
    if (value.length <= 10) return;
    const response = await axios.post("/api/gptAnswer2", {
      content: value,
      roomId,
      yoe,
    });
    console.log(response);
    const data = response.data;
    const responseObject = extractJson(data.llmoutput);
    console.log("RESPONSE OBJECT IS :\n", responseObject);
    if (responseObject?.itemFound) {
      // toast.success(
      //   `Ai Answered the Question: ${responseObject.question} type: ${responseObject.type}`
      // );
      // put in database
      const messagesRef = ref(database, "flowofwords/" + roomId + "/messages");
      push(messagesRef, {
        question: responseObject.question,
        answer: responseObject.answer,
      }).then(() => console.log("message pushed in database"));
    } else {
      showWarningToast("No Question detected in the previous. Transcript");
    }
  } catch (err) {
    // toast.error("Ai failed to create a Valid JSON. Ai Output : " + err);
    console.log(
      "error while writing data to room or chatgpt response is not a json:",
      err
    );
  }
}
export async function sendTranscriptTo_Chatgpt4O_AndPushInDatabase(
  roomId: string,
  value: string,
  yoe?: string
) {
  try {
    if (value.length <= 10) return;
    const response = await axios.post("/api/gpt4", {
      content: value,
      roomId,
      yoe,
    });
    console.log(response);
    const data = response.data;
    const responseObject = extractJson(data.llmoutput);
    console.log("RESPONSE OBJECT IS :\n", responseObject);
    if (responseObject?.itemFound) {
      // toast.success(
      //   `Ai Answered the Question: ${responseObject.question} type: ${responseObject.type}`
      // );
      // put in database
      const messagesRef = ref(database, "flowofwords/" + roomId + "/messages");
      push(messagesRef, {
        question: responseObject.question,
        answer: responseObject.answer,
      }).then(() => console.log("message pushed in database"));
    } else {
      showWarningToast("No Question detected in the previous. Transcript");
    }
  } catch (err) {
    // toast.error("Ai failed to create a Valid JSON. Ai Output : " + err);
    console.log(
      "error while writing data to room or chatgpt response is not a json:",
      err
    );
  }
}

export async function sendTranscriptTo_MISTRAL_AndPushInDatabase(
  roomId: string,
  value: string,
  yoe?: string
) {
  try {
    if (value.length <= 10) return;
    const response = await axios.post("/api/mistralAnswer", {
      content: value,
      roomId,
      yoe,
    });
    console.log(response);
    const data = response.data;
    const responseObject = extractJson(data.llmoutput);
    console.log("RESPONSE OBJECT IS :\n", responseObject);
    if (responseObject?.itemFound) {
      // toast.success(
      //   `Ai Answered the Question: ${responseObject.question} type: ${responseObject.type}`
      // );
      // put in database
      const messagesRef = ref(database, "flowofwords/" + roomId + "/messages");
      push(messagesRef, {
        question: responseObject.question,
        answer: responseObject.answer,
      }).then(() => console.log("message pushed in database"));
    } else {
      showWarningToast("No Question detected in the previous. Transcript");
    }
  } catch (err) {
    // toast.error("Ai failed to create a Valid JSON. Ai Output : " + err);
    console.log(
      "error while writing data to room or chatgpt response is not a json:",
      err
    );
  }
}
