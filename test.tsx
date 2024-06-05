import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
others Imports

export const TranscriptComponent = (props: TranscriptComponentProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [transcriptLength, setTranscriptLength] = useState(0);
  
  const socket = useRef<Socket | null>(null);

  useEffect(() => {
    socket.current = socket.connect();
    return () => {
      socket.current?.disconnect();
    };
  }, []);

  const startRecording = async (id: string) => {
    console.log("Recording started");
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const speakerStream = await (navigator as any).mediaDevices.getDisplayMedia({
        audio: true,
        video: false,
      });
      
      const audioContext = new (window as any).AudioContext();
      const micSource = audioContext.createMediaStreamSource(audioStream);
      const speakerSource = audioContext.createMediaStreamSource(speakerStream);

      const destination = audioContext.createMediaStreamDestination();
      micSource.connect(destination);
      speakerSource.connect(destination);

      setIsRecording(true);
      setStream(destination.stream);

      const mimeTypes = ["audio/mp4", "audio/webm"].filter((type) =>
        MediaRecorder.isTypeSupported(type)
      );

      if (mimeTypes.length === 0) {
        return alert("Browser not supported");
      }

      setTimerInterval(
        setInterval(() => {
          setTranscriptLength((t) => t + 1);
        }, 1000)
      );

      let recorder = new MediaRecorder(destination.stream, { mimeType: mimeTypes[0] });

      recorder.addEventListener("dataavailable", async (event) => {
        if (event.data.size > 0 && socket.current?.connected) {
          socket.current?.emit("audio", { roomId: props.roomId, data: event.data });
        }
      });

      recorder.start(1000);
    } catch (error) {
      console.error("Error accessing media devices:", error);
    }
  };

  const stopRecording = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setIsRecording(false);
    clearInterval(timerInterval!);
    socket.current?.emit("stop-transcript", { roomId: props.roomId });
    console.log("Recording stopped");
  };

  // ... (return and rendering logic)
};