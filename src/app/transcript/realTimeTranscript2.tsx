"use client";
import React, { useState, useEffect, useRef } from "react";
import RecordRTC, { StereoAudioRecorder } from "recordrtc";
import { child, get, push, ref } from "firebase/database";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { database } from "../firebaseConfig";
import toast from "react-hot-toast";
import { showWarningToast } from "@/utils/toasts";
import { sendTranscriptTo_Chatgpt4O_AndPushInDatabase } from "@/utils/sendTranscript";

const partialTranscriptPauseThreshold = 10;

const realTimeTranscript2 = () => {
  const [status, setStatus] = useState<"RECORDING" | "PAUSED" | "STOPPED">("STOPPED");
  const [vocabSwitch, setVocabSwitch] = useState<"ON" | "OFF">("ON");
  const [stream, setStream] = useState<MediaStream | undefined>();
  const [websiteStream, setWebsiteStream] = useState<MediaStream | undefined>();
  const [recorder, setRecorder] = useState<RecordRTC | null>(null);
  const [localStreamText, setLocalStreamText] = useState<string>("");
  const prevTimeEnd = useRef<number>(0);
  const socket = useRef<WebSocket | null>(null);
  const scrollDiv = useRef<any>(null);
  const finalTextsGlobal = useRef<Record<string, string> | undefined>();
  const currentPauseTime = useRef<number>(0);
  const pauseDetected = useRef<boolean>(false);
  const emptyPartialTranscripts = useRef<number>(0);
  const mediaRecorderforFile = useRef<MediaRecorder>();

  const updateTranscriptInDatabase = (value: string) => {
    const messagesRef = ref(database, "flowofwords/" + "roomId" + "/transcript");
    push(messagesRef, value).then(() => console.log("transcript pushed in database"));
  };

  const run = async () => {
    toast.loading("Starting... pls wait...");
    let temp = currentPauseTime.current;
    currentPauseTime.current = temp + 1;
    if (status != "RECORDING") {
      try {
        const response = await fetch("/api/getToken", {
          method: "POST",
        });
        const data = await response.json();

        if (data.error) {
          alert(data.error);
          return;
        }

        const { token } = data;
        let params;

        params = {
          sample_rate: "16000",
          token: token,
        };

        console.log("params is ", params);
        const url = `wss://api.assemblyai.com/v2/realtime/ws?${new URLSearchParams(params).toString()}`;
        const newSocket = new WebSocket(url);

        socket.current = newSocket;

        let finalTexts: Record<string, string> = {};
        if (finalTextsGlobal.current) {
          finalTexts = finalTextsGlobal.current;
          const sortedKeys = Object.keys(finalTexts).sort((a: any, b: any) => a - b);
          finalTexts[sortedKeys[sortedKeys.length - 1]] = finalTexts[sortedKeys[sortedKeys.length - 1]] += "\n";
        }
        newSocket.onmessage = (message) => {
          let finalMsg = "";
          const res = JSON.parse(message.data);
          const keys = Object.keys(finalTexts).sort((a: any, b: any) => a - b);
          for (const key of keys) {
            if (finalTexts[key]) {
              finalMsg += ` ${finalTexts[key]}`;
            }
          }
          if (res.message_type == "FinalTranscript") {
            if (pauseDetected.current == true) {
              console.log("GREATER THAN 2 SECONDS");
              finalTexts[`${currentPauseTime.current}-${res.audio_start}`] = `\n${res.text}`;
              console.log("TEXT AFTER LONG PAUSE IS : \n", res.text, "\n SEDNGING TO CHATGPT");
              updateTranscriptInDatabase(res.text);
              pauseDetected.current = false;
            } else {
              finalTexts[`${currentPauseTime.current}-${res.audio_start}`] = res.text;
            }
            prevTimeEnd.current = res.audio_end;
          } else {
            if (res.text == "") {
              emptyPartialTranscripts.current = emptyPartialTranscripts.current += 1;
              pauseDetected.current = true;
            } else {
              if (emptyPartialTranscripts.current >= partialTranscriptPauseThreshold) {
                finalMsg += `\n`;
              }
              emptyPartialTranscripts.current = 0;
            }
          }
          finalMsg += ` ${res.text}`;
          setLocalStreamText(finalMsg);
          finalTextsGlobal.current = finalTexts;
        };

        newSocket.onerror = (event) => {
          console.error(event);
          socket.current?.close();
          toast.error(JSON.stringify(event));
        };

        newSocket.onclose = (event) => {
          console.log("socketconnection closed 2 ", event);
          socket.current = null;
          toast.error("websocket connection closed.");
        };
        newSocket.onopen = async () => {
          // Capture microphone stream
          navigator.mediaDevices
            .getUserMedia({ audio: true })
            .then((stream) => {
              setStream(stream);

              // Capture website audio stream
              // Capture website audio stream
              // Capture website audio stream
              const audioElements = Array.from(document.querySelectorAll<HTMLMediaElement>("audio, video"));
              const audioStreams = audioElements.map((element) => (element as HTMLMediaElement & { captureStream: () => MediaStream }).captureStream());
              const mergedStream = new MediaStream([...stream.getTracks(), ...audioStreams.flatMap((s) => s.getTracks())]);

              setStatus("RECORDING");
              toast.dismiss();
              toast.success("recording  started");

              const recorder = new MediaRecorder(mergedStream);
              let audioChunks: Blob[] = [];
              recorder.ondataavailable = (e) => {
                audioChunks.push(e.data);
              };
              recorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: "audio/mp3" });
                console.log("AUDIBLOB : ", audioBlob);
                const url = URL.createObjectURL(audioBlob);
                console.log("URL IS ", url);

                const now = new Date();
                const day = String(now.getDate()).padStart(2, "0");
                const month = String(now.getMonth() + 1).padStart(2, "0");
                const year = now.getFullYear();
              };
              recorder.start();
              mediaRecorderforFile.current = recorder;

              const localRecorder = new RecordRTC(mergedStream, {
                type: "audio",
                mimeType: "audio/webm;codecs=pcm",
                recorderType: StereoAudioRecorder,
                timeSlice: 250,
                desiredSampRate: 16000,
                numberOfAudioChannels: 1,
                bufferSize: 16384,
                audioBitsPerSecond: 128000,
                ondataavailable: (blob) => {
                  const reader = new FileReader();
                  reader.onload = () => {
                    const base64data = reader.result as string;
                    if (socket) {
                      if (typeof base64data == "string") {
                        socket.current?.send(
                          JSON.stringify({
                            audio_data: base64data?.split("base64,")[1],
                          })
                        );
                      }
                    }
                  };
                  reader.readAsDataURL(blob);
                },
              });
              setRecorder(localRecorder);
              localRecorder.startRecording();
            })
            .catch((err) => console.error(err));
        };
      } catch (error) {
        toast.dismiss();
        toast.error("error while starting " + error);
        console.error(error);
      }
    }
  };

  return (
    <div>
      <button onClick={run} className="bg-green-500 p-5 mx-5">
        Start Recording
      </button>
      <button
        onClick={() => {
          if (recorder) {
            recorder.stopRecording(() => {
              setStatus("STOPPED");
              toast.success("recording stopped");
              if (mediaRecorderforFile.current) {
                mediaRecorderforFile.current.stop();
              }
              if (socket.current) {
                socket.current.close();
              }
            });
          } else {
            toast.error("recording not started yet");
          }
        }}
        className="bg-red-500 p-5 mx-5"
      >
        Stop Recording
      </button>
    </div>
  );
};

export default realTimeTranscript2;
