"use client";
import React, { useState, useEffect } from "react";
import { firestore, firebase, database } from "../firebaseConfig";
import toast from "react-hot-toast";
import { sendTranscriptTo_Chatgpt4O_AndPushInDatabase } from "@/utils/sendTranscript";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";
import Login from "@/components/Login";

const Page = () => {
  const { user} = useAuth();

  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [selectedCallId, setSelectedCallId] = useState("");
  const [callIds, setCallIds] = useState<string[]>([]);
  const [selectedText, setSelectedText] = useState("");
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupPosition, setPopupPosition] = useState({
    left: "0px",
    top: "0px",
  });
  

  useEffect(() => {
    const fetchCallIds = async () => {
      try {
        const databaseRef = database.ref("flowofwords");
        const snapshot = await databaseRef.once("value");
        const data = snapshot.val();
        const initialCallIds = new Set(data ? Object.keys(data).filter(Boolean) : []);
        setCallIds(Array.from(initialCallIds));
        setSelectedCallId(initialCallIds.values().next().value || "");
  
        // Listen for new call IDs
        databaseRef.on("child_added", (snapshot) => {
          const newCallId = snapshot.key;
          if (newCallId) {
            setCallIds((prevCallIds) => Array.from(new Set([...prevCallIds, newCallId])));
          }
        });
      } catch (error) {
        console.error("Error fetching call IDs:", error);
      }
    };
    fetchCallIds();
  }, []);

  const fetchTranscripts = async (callId: string) => {
    try {
      const databaseRef = database.ref(`flowofwords/${callId}/messages`);
      const snapshot = await databaseRef.once("value");
      const data = snapshot.val();
      const transcriptsData: any[] = [];
      if (data) {
        for (const key in data) {
          transcriptsData.push(data[key]);
        }
      }
      setTranscripts(transcriptsData);

      databaseRef.on("child_added", (snapshot) => {
        const newTranscript = snapshot.val();
        setTranscripts((prevTranscripts) => [...prevTranscripts, newTranscript]);
      });
    } catch (error) {
      console.error("Error fetching transcripts:", error);
    }
  };

  useEffect(() => {
    if (selectedCallId) {
      fetchTranscripts(selectedCallId);
    }
  }, [selectedCallId]);

  const handleTextSelection = (event: any) => {
    const text = window.getSelection()?.toString().trim();
    console.log(event);
    if (text) {
      const selection = window.getSelection()?.getRangeAt(0);
      const rect = selection?.getBoundingClientRect();
      console.log(rect);

      // Access the id of the clicked element using event.target.id
      const clickedElementId = event.target.id;
      console.log("Clicked Element ID:", clickedElementId);

      setPopupPosition({
        left: rect?.left + "px",
        top: rect?.bottom + "px",
      });
      setSelectedText(text);
      console.log("here");
      setPopupVisible(true);
    } else {
      setTimeout(() => {
        setPopupVisible(false);
      }, 1000);
    }
  };

  async function sendToChatgptAndPushInDatabase() {
    try {
      if (!selectedText) {
        toast("No text selected");
        return;
      }
      toast("Asking AI. pls wait");
      sendTranscriptTo_Chatgpt4O_AndPushInDatabase(selectedCallId, selectedText, "1");
    } catch (err) {
      console.log("error while writing data to room or chatgpt response is not a json:", err);
    }
  }

  useEffect(() => {
    document.addEventListener("mouseup", handleTextSelection);
    return () => {
      document.removeEventListener("mouseup", handleTextSelection);
    };
  }, []);

  if (!user) {
    return(<Login/>)
  }

  if(user)
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {popupVisible && (
        <div
          id="popup"
          className={` absolute bg-green-500 z-40 px-3 py-2 rounded-md border-2 border-green-700 shadow-md cursor-pointer`}
          style={{ left: popupPosition.left, top: popupPosition.top }}
          onClick={sendToChatgptAndPushInDatabase}
          onBlur={() => {
            console.log("onblur");
            setPopupVisible(false);
          }}
        >
          <p className=" text-sm text-green-900">Answer this</p>
        </div>
      )}
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Question Answers</h1>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="callIdSelect">
            Select Call ID
          </label>
          <select
            id="callIdSelect"
            value={selectedCallId}
            onChange={(e) => setSelectedCallId(e.target.value)}
            className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            {callIds.map((callId) => (
              <option key={callId} value={callId}>
                {callId}
              </option>
            ))}
          </select>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg shadow-inner overflow-y-auto h-[70vh]">
          {transcripts.map((transcript, index) => (
            <div key={index} className="mb-4">
              <p className="text-gray-700 font-semibold">Question: {transcript.question}</p>
              <p className="text-gray-600">Answer: {transcript.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Page;
