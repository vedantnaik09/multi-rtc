"use client";
import React, { useState, useEffect } from 'react';
import { firestore, firebase, database } from "../firebaseConfig";

const Page = () => {
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [selectedCallId, setSelectedCallId] = useState('');
  const [callIds, setCallIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchCallIds = async () => {
      try {
        const databaseRef = database.ref('flowofwords');
        const snapshot = await databaseRef.once('value');
        const data = snapshot.val();
        const initialCallIds = data ? Object.keys(data).filter(Boolean) : [];
        setCallIds(initialCallIds);
        setSelectedCallId(initialCallIds[0] || '');
  
        // Listen for new call IDs
        databaseRef.on('child_added', (snapshot) => {
          const newCallId = snapshot.key;
          if (newCallId) {
            setCallIds((prevCallIds) => [...prevCallIds, newCallId].filter(Boolean));
          }
        });
      } catch (error) {
        console.error('Error fetching call IDs:', error);
      }
    };
  
    fetchCallIds();
  }, []);

  const fetchTranscripts = async (callId: string) => {
    try {
      const databaseRef = database.ref(`flowofwords/${callId}/messages`);
      const snapshot = await databaseRef.once('value');
      const data = snapshot.val();
      const transcriptsData: any[] = [];
      if (data) {
        for (const key in data) {
          transcriptsData.push(data[key]);
        }
      }
      setTranscripts(transcriptsData);

      databaseRef.on('child_added', (snapshot) => {
        const newTranscript = snapshot.val();
        setTranscripts((prevTranscripts) => [...prevTranscripts, newTranscript]);
      });
    } catch (error) {
      console.error('Error fetching transcripts:', error);
    }
  };

  useEffect(() => {
    if (selectedCallId) {
      fetchTranscripts(selectedCallId);
    }
  }, [selectedCallId]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Call Transcripts</h1>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="callIdSelect">Select Call ID</label>
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
        <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
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