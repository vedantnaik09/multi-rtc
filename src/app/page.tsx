"use client";
import React, { useEffect, useRef, useState } from "react";
import { firestore, firebase } from "./firebaseConfig";

type OfferAnswerPair = {
  offer: {
    sdp: string | null;
    type: RTCSdpType;
  } | null;
  answer: {
    sdp: string | null;
    type: RTCSdpType;
  } | null;
};

const Home = () => {
  const webcamButtonRef = useRef<HTMLButtonElement>(null);
  const callButtonRef = useRef<HTMLButtonElement>(null);
  const callInputRef = useRef<HTMLInputElement>(null);
  const answerButtonRef = useRef<HTMLButtonElement>(null);
  const hangupButtonRef = useRef<HTMLButtonElement>(null);
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [pcConns, setpcConns] = useState<RTCPeerConnection[]>([]);

  let localStream: MediaStream | null = null;
  let remoteStream: MediaStream | null = null;

  useEffect(() => {
    const servers = {
      iceServers: [
        {
          urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
        },
      ],
      iceCandidatePoolSize: 10,
    };

    const startWebcam = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        remoteStream = new MediaStream();

        if (webcamVideoRef.current && localStream) {
          webcamVideoRef.current.srcObject = localStream;
          
        }
      } catch (error) {
        console.error("Error accessing webcam:", error);
      }

      

      if (callButtonRef.current) callButtonRef.current.disabled = false;
      if (answerButtonRef.current) answerButtonRef.current.disabled = false;
      if (webcamButtonRef.current) webcamButtonRef.current.disabled = true;
    };

    if (webcamButtonRef.current) {
      webcamButtonRef.current.onclick = startWebcam;
    }

    const handleCallButtonClick = async () => {
      
      const callDoc = firestore.collection("calls").doc();
      let signalDoc = callDoc.collection("signal").doc(`signal1`);
      if (callInputRef.current) {
        callInputRef.current.value = callDoc.id;
      }
      await callDoc.set({ loading: false });
      await callDoc.set({ connectedUsers: 1 });

      let lengthUsers: number;
      let offerCandidatesCollection: firebase.firestore.CollectionReference<firebase.firestore.DocumentData>;
      let answerCandidatesCollection: firebase.firestore.CollectionReference<firebase.firestore.DocumentData>;

      await signalDoc.set({ signal: 0 });
      let pc : RTCPeerConnection;
      const handleSignalChange = async (signal: number) => {
        if (signal === 0) {
          pc = new RTCPeerConnection(servers);


          localStream?.getTracks().forEach((track) => {
            pc.addTrack(track, localStream as MediaStream);
          });


          pc.ontrack = (event) => {
            event.streams[0].getTracks().forEach((track) => {
              if (remoteStream) {
                remoteStream.addTrack(track);
              }
            });
    
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
            }
          };



          lengthUsers = (await callDoc.get()).data()?.connectedUsers;
          console.log(lengthUsers);
          await callDoc.update({ loading: true });
          offerCandidatesCollection = callDoc.collection("candidates").doc(`candidate${lengthUsers}`).collection("offerCandidates");
          answerCandidatesCollection = callDoc.collection("candidates").doc(`candidate${lengthUsers}`).collection("answerCandidates");
          pc.onicecandidate = (event) => {
            console.log("Added offers collection to ",lengthUsers)
            event.candidate && offerCandidatesCollection.add(event.candidate.toJSON());
          };

          //Set Local Offer Description:
          const offerDescription = await pc.createOffer();
          await pc.setLocalDescription(offerDescription);

          let offer = {
            sdp: offerDescription.sdp as string,
            type: offerDescription.type,
          };

          let offerAnswerPair: OfferAnswerPair = {
            offer: offer,
            answer: null,
          };

          // Get the current array of offerAnswerPair from the callDoc
          const currentPairs: OfferAnswerPair[] = (await callDoc.get()).data()?.offerAnswerPairs || [];

          // Push the new offerAnswerPair into the array
          await currentPairs.push(offerAnswerPair);
          console.log("Current pairs are");
          console.log(currentPairs);
          // Update the offerAnswerPairs field in the callDoc
          await callDoc.update({ offerAnswerPairs: currentPairs });
          await signalDoc.set({ signal: 1 });

          await callDoc.update({ loading: false });
        }
        if (signal === 2) {
          console.log("inside signal 2");
          await callDoc.update({ loading: true });

          console.log("Length users in signal 2 is ",lengthUsers)

          const answerDescription = new RTCSessionDescription((await callDoc.get()).data()?.offerAnswerPairs[lengthUsers - 1].answer);

          pc.setRemoteDescription(answerDescription);

          console.log(pc);
          await callDoc.update({ loading: false });

          answerCandidatesCollection.onSnapshot(
            (snapshot) => {
              snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                  const candidateData = change.doc.data();
                  const candidate = new RTCIceCandidate(candidateData);
                  // console.log(candidateData)
                  pc.addIceCandidate(candidate)
                    .then(() => {
                      console.log("Ice candidate added successfully");
                    })
                    .catch((error) => {
                      console.error("Error adding ice candidate:", error);
                    });
                }
              });
            },
            (error) => {
              console.error("Error getting candidate collection:", error);
            }
          );
          await signalDoc.update({ signal: 3 });
        } else if (signal === 4) {

          setpcConns((prevPcConns) => {
            const newPcConns = [...prevPcConns, pc];
            console.log("The pc connections in array are ", newPcConns);
            return newPcConns;
          });

          await callDoc.update({ connectedUsers: (await callDoc.get()).data()?.connectedUsers + 1 });
          signalDoc = callDoc.collection("signal").doc(`signal${lengthUsers + 1}`);
          signalDoc.onSnapshot(
            async (doc) => {
              if (doc.exists) {
                const data = doc.data();
                const signal = data?.signal;
                console.log("Signal changed to ", signal);
                handleSignalChange(signal);
              }
            },
            (error) => {
              console.error("Error listening to document:", error);
            }
          );

          await signalDoc.set({ signal: 0 });
        }


      };
      signalDoc.onSnapshot(
        async (doc) => {
          if (doc.exists) {
            const data = doc.data();
            const signal = data?.signal;
            console.log("Signal changed to ", signal);
            handleSignalChange(signal);
          }
        },
        (error) => {
          console.error("Error listening to document:", error);
        }
      );
    };

    
    const handleAnswerButtonClick = async () => {
      let callId;
      if (callInputRef.current) {
        callId = callInputRef.current.value;
      }
      const callDocHost = firestore.collection("calls").doc(callId);

      const lengthUsers = (await callDocHost.get()).data()?.connectedUsers;
      const myDoc = firestore.collection("calls").doc();
      const signalDoc = callDocHost.collection("signal").doc(`signal${lengthUsers}`);

      const currentConnectedUsers = (await callDocHost.get()).data()?.offerAnswerPairs;
      const offerCandidatesCollection = callDocHost.collection("candidates").doc(`candidate${lengthUsers}`).collection("offerCandidates");

      let pc : RTCPeerConnection;

      signalDoc.onSnapshot(
        async (doc) => {
          if (doc.exists) {
            const data = doc.data();
            const signal = data?.signal;
            if (signal === 1) {
              console.log("Signal is 1");
              console.log("Currently connected users are ", lengthUsers);

              pc = new RTCPeerConnection(servers);

              localStream?.getTracks().forEach((track) => {
                pc.addTrack(track, localStream as MediaStream);
              });
        
        
              pc.ontrack = (event) => {
                event.streams[0].getTracks().forEach((track) => {
                  if (remoteStream) {
                    remoteStream.addTrack(track);
                  }
                });
        
                if (remoteVideoRef.current) {
                  remoteVideoRef.current.srcObject = remoteStream;
                }
              };
        
              //Creating new pc and setting its answer

              const answerCandidatesColletion = callDocHost.collection("candidates").doc(`candidate${lengthUsers}`).collection("answerCandidates");
              if (pc)
                pc.onicecandidate = (event) => {
                  console.log(`Adding answer candidates to collection ${lengthUsers}`)
                  event.candidate && answerCandidatesColletion.add(event.candidate.toJSON());
                };

              console.log((await callDocHost.get()).data()?.offerAnswerPairs[lengthUsers - 1].offer);

              const offerDescription = new RTCSessionDescription((await callDocHost.get()).data()?.offerAnswerPairs[lengthUsers - 1].offer);
              await pc.setRemoteDescription(offerDescription);
              console.log(pc);

              const answerDescription = await pc.createAnswer();
              await pc.setLocalDescription(answerDescription);

              const answer = {
                sdp: answerDescription.sdp,
                type: answerDescription.type,
              };

              currentConnectedUsers[lengthUsers - 1].answer = answer;
              //Push this to the existing array
              // Update the document with the modified offerAnswerPairs array
              await callDocHost.update({ offerAnswerPairs: currentConnectedUsers });
              

              // set signal to 2
              await signalDoc.update({ signal: 2 });
            }

            if (signal === 3) {
              console.log("Signal is now 3");

              // Fetch existing offerCandidates documents
              offerCandidatesCollection
                .get()
                .then((querySnapshot) => {
                  querySnapshot.forEach((doc) => {
                    const candidateData = doc.data();
                    const candidate = new RTCIceCandidate(candidateData);
                    pc.addIceCandidate(candidate)
                      .then(() => {
                        console.log("Ice candidate added successfully");
                      })
                      .catch((error) => {
                        console.error("Error adding ice candidate:", error);
                      });
                  });
                })
                .catch((error) => {
                  console.error("Error getting existing offerCandidates:", error);
                });

              // Listen for real-time changes in offerCandidates collection
              offerCandidatesCollection.onSnapshot(
                (snapshot) => {
                  snapshot.docChanges().forEach((change) => {
                    if (change.type === "added") {
                      const candidateData = change.doc.data();
                      const candidate = new RTCIceCandidate(candidateData);
                      pc.addIceCandidate(candidate)
                        .then(() => {
                          console.log("Ice candidate added successfully");
                        })
                        .catch((error) => {
                          console.error("Error adding ice candidate:", error);
                        });
                    }
                  });
                },
                (error) => {
                  console.error("Error listening for offerCandidates changes:", error);
                }
              );
              
              await signalDoc.update({ signal: 4 });
            }
          }
        },
        (error) => {
          console.error("Error listening to document:", error);
        }
      );

      await callDocHost.update({ loading: false });

      if (answerButtonRef.current) answerButtonRef.current.disabled = true;
    };

    if (callButtonRef.current) {
      callButtonRef.current.onclick = handleCallButtonClick;
    }
    if (answerButtonRef.current) {
      answerButtonRef.current.onclick = handleAnswerButtonClick;
    }
  }, []);

  return (
    <div>
      <h2>1. Start your Webcam</h2>
      <div className="videos">
        <span>
          <h3>Local Stream</h3>
          <video id="webcamVideo" ref={webcamVideoRef} autoPlay playsInline></video>
        </span>
        <span>
          <h3>Remote Stream</h3>
          <video id="remoteVideo" ref={remoteVideoRef} autoPlay playsInline></video>
        </span>
      </div>

      <button ref={webcamButtonRef}>Start webcam</button>
      <h2>2. Create a new Call</h2>
      <button ref={callButtonRef} disabled>
        Create Call (offer)
      </button>

      <h2>3. Join a Call</h2>
      <p>Answer the call from a different browser window or device</p>

      <input ref={callInputRef} />
      <button ref={answerButtonRef} disabled>
        Answer
      </button>

      <h2>4. Hangup</h2>

      <button ref={hangupButtonRef} disabled>
        Hangup
      </button>
    </div>
  );
};

export default Home;
