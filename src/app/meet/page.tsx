"use client";
import React, { useEffect, useRef, useState, Suspense } from "react";
import { firestore, firebase } from "../firebaseConfig";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FaMicrophoneAlt, FaVideoSlash, FaMicrophone, FaVideo, FaCopy } from "react-icons/fa";

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
const Page = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PageContent />
    </Suspense>
  );
};

const PageContent = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const [isClient, setIsClient] = useState(false);
  const [inCall, setInCall] = useState(false);
  const webcamButtonRef = useRef<HTMLButtonElement>(null);
  const callButtonRef = useRef<HTMLButtonElement>(null);
  const callInputRef = useRef<HTMLInputElement>(null);
  const answerButtonRef = useRef<HTMLButtonElement>(null);
  const hangupButtonRef = useRef<HTMLButtonElement>(null);
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const [remoteVideoRefs, setRemoteVideoRefs] = useState<React.RefObject<HTMLVideoElement>[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<MediaStream[]>([]);
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [accessGiven, setAccessGiven] = useState(false);

  const [stream, setStream] = useState<MediaStream | null>(null);
  let localStream: MediaStream | null;

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
        setStream(localStream);
        setAccessGiven(true);
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
      setInCall(true);
      const callDoc = firestore.collection("calls").doc();
      let signalDoc = callDoc.collection("signal").doc(`signal1`);
      let indexOfOtherConnectedCandidates = callDoc.collection("otherCandidates").doc(`indexOfConnectedCandidates`);
      await indexOfOtherConnectedCandidates.set({ indexOfCurrentUsers: [] });
      if (callInputRef.current) {
        callInputRef.current.value = callDoc.id;
      }
      replace(`${pathname}?id=${callDoc.id}`);
      await callDoc.set({ loading: false });
      await callDoc.set({ connectedUsers: 1 });

      let lengthUsers: number;
      let offerCandidatesCollection: firebase.firestore.CollectionReference<firebase.firestore.DocumentData>;
      let answerCandidatesCollection: firebase.firestore.CollectionReference<firebase.firestore.DocumentData>;

      await signalDoc.set({ signal: 0 });
      let pc: RTCPeerConnection;
      const handleSignalChange = async (signal: number) => {
        if (signal === 0) {
          pc = await new RTCPeerConnection(servers);

          await localStream?.getTracks().forEach((track) => {
            pc.addTrack(track, localStream as MediaStream);
          });

          let onTrackExecuted = false;

          pc.ontrack = async (event) => {
            if (!onTrackExecuted) {
              onTrackExecuted = true;
              const remoteStream = new MediaStream();
              await event.streams[0].getTracks().forEach((track) => {
                remoteStream.addTrack(track);
              });
              console.log("Remote stream reflected");
              await setRemoteStreams((prevStreams) => [...prevStreams, remoteStream]);
            }
          };

          lengthUsers = (await callDoc.get()).data()?.connectedUsers;
          await callDoc.update({ loading: true });
          offerCandidatesCollection = callDoc.collection("candidates").doc(`candidate${lengthUsers}`).collection("offerCandidates");
          answerCandidatesCollection = callDoc.collection("candidates").doc(`candidate${lengthUsers}`).collection("answerCandidates");
          pc.onicecandidate = async (event) => {
            event.candidate && (await offerCandidatesCollection.add(event.candidate.toJSON()));
          };

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

          const currentPairs: OfferAnswerPair[] = (await callDoc.get()).data()?.offerAnswerPairs || [];

          await currentPairs.push(offerAnswerPair);
          await callDoc.update({ offerAnswerPairs: currentPairs });
          await signalDoc.set({ signal: 1 });

          await callDoc.update({ loading: false });
        }
        if (signal === 2) {
          await callDoc.update({ loading: true });

          const answerDescription = new RTCSessionDescription((await callDoc.get()).data()?.offerAnswerPairs[lengthUsers - 1].answer);
          await pc.setRemoteDescription(answerDescription);

          await answerCandidatesCollection.onSnapshot(
            async (snapshot) => {
              await snapshot.docChanges().forEach(async (change) => {
                if (change.type === "added") {
                  const candidateData = change.doc.data();
                  const candidate = new RTCIceCandidate(candidateData);
                  await pc
                    .addIceCandidate(candidate)
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
          await callDoc.update({
            connectedUsers: (await callDoc.get()).data()?.connectedUsers + 1,
          });
          signalDoc = callDoc.collection("signal").doc(`signal${lengthUsers + 1}`);
          signalDoc.onSnapshot(
            async (doc) => {
              if (doc.exists) {
                const data = doc.data();
                const signal = data?.signal;
                await handleSignalChange(signal);
              }
            },
            (error) => {
              console.error("Error listening to document:", error);
            }
          );
          let indexOfCurrentUsers: number[] = (await indexOfOtherConnectedCandidates.get()).data()?.indexOfCurrentUsers || [];
          indexOfCurrentUsers.push(lengthUsers + 1);
          await indexOfOtherConnectedCandidates.update({
            indexOfCurrentUsers: indexOfCurrentUsers,
          });
          console.log(pc);

          await signalDoc.set({ signal: 0 });
        }
      };
      signalDoc.onSnapshot(
        async (doc) => {
          if (doc.exists) {
            const data = doc.data();
            const signal = data?.signal;
            await handleSignalChange(signal);
          }
        },
        (error) => {
          console.error("Error listening to document:", error);
        }
      );
    };

    const handleAnswerButtonClick = async () => {
      setInCall(true);
      let callId;
      if (callInputRef.current) {
        callId = callInputRef.current.value;
        replace(`${pathname}?id=${callInputRef.current.value}`);
      }
      const callDocHost = firestore.collection("calls").doc(callId);

      const lengthUsers = (await callDocHost.get()).data()?.connectedUsers;
      const signalDoc = callDocHost.collection("signal").doc(`signal${lengthUsers}`);

      const currentConnectedUsers = (await callDocHost.get()).data()?.offerAnswerPairs;
      const offerCandidatesCollection = callDocHost.collection("candidates").doc(`candidate${lengthUsers}`).collection("offerCandidates");
      let indexOfOtherConnectedCandidates = callDocHost.collection("otherCandidates").doc(`indexOfConnectedCandidates`);

      const myIndex = lengthUsers + 1;

      let pc: RTCPeerConnection;

      signalDoc.onSnapshot(
        async (doc) => {
          if (doc.exists) {
            const data = doc.data();
            const signal = data?.signal;
            if (signal === 1) {
              pc = new RTCPeerConnection(servers);

              await localStream?.getTracks().forEach((track) => {
                pc.addTrack(track, localStream as MediaStream);
              });

              let onTrackExecuted = false;

              pc.ontrack = async (event) => {
                if (!onTrackExecuted) {
                  onTrackExecuted = true;
                  const remoteStream = new MediaStream();
                  await event.streams[0].getTracks().forEach((track) => {
                    remoteStream.addTrack(track);
                  });
                  console.log("Remote stream reflected");
                  await setRemoteStreams((prevStreams) => [...prevStreams, remoteStream]);
                }
              };

              const answerCandidatesCollection = callDocHost.collection("candidates").doc(`candidate${lengthUsers}`).collection("answerCandidates");
              if (pc)
                pc.onicecandidate = async (event) => {
                  event.candidate && (await answerCandidatesCollection.add(event.candidate.toJSON()));
                };

              const offerDescription = new RTCSessionDescription((await callDocHost.get()).data()?.offerAnswerPairs[lengthUsers - 1].offer);
              await pc.setRemoteDescription(offerDescription);

              const answerDescription = await pc.createAnswer();
              await pc.setLocalDescription(answerDescription);

              const answer = {
                sdp: answerDescription.sdp,
                type: answerDescription.type,
              };

              currentConnectedUsers[lengthUsers - 1].answer = answer;

              await callDocHost.update({ offerAnswerPairs: currentConnectedUsers });

              await signalDoc.update({ signal: 2 });
            }

            if (signal === 3) {
              await offerCandidatesCollection.get().then(async (snapshot) => {
                await snapshot.docs.forEach(async (doc) => {
                  const candidateData = doc.data();
                  const candidate = new RTCIceCandidate(candidateData);
                  await pc
                    .addIceCandidate(candidate)
                    .then(() => {
                      console.log("Ice candidate added successfully");
                    })
                    .catch((error) => {
                      console.error("Error adding ice candidate:", error);
                    });
                });
              });

              await offerCandidatesCollection.onSnapshot(
                async (snapshot) => {
                  await snapshot.docChanges().forEach(async (change) => {
                    if (change.type === "added") {
                      const candidateData = change.doc.data();
                      const candidate = new RTCIceCandidate(candidateData);
                      await pc
                        .addIceCandidate(candidate)
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

      indexOfOtherConnectedCandidates.onSnapshot(async (doc) => {
        if (doc.exists) {
          //Check for any newly addded users
          if (
            doc.data()?.indexOfCurrentUsers[doc.data()?.indexOfCurrentUsers.length - 1] != myIndex &&
            doc.data()?.indexOfCurrentUsers[doc.data()?.indexOfCurrentUsers.length - 1] &&
            doc.data()?.indexOfCurrentUsers[doc.data()?.indexOfCurrentUsers.length - 1] > myIndex
          ) {
            const newAddedUser = doc.data()?.indexOfCurrentUsers[doc.data()?.indexOfCurrentUsers.length - 1];
            let signalDoc = callDocHost.collection("signal").doc(`signal${newAddedUser}${myIndex}`);
            console.log(`${newAddedUser} added`);
            console.log(`${myIndex} myIndex`);
            await signalDoc.set({ userAdded: `${newAddedUser} added`, signal: 0 });
            let offerAnswerPairs: firebase.firestore.DocumentReference<firebase.firestore.DocumentData>;
            let offerCandidatesCollection: firebase.firestore.CollectionReference<firebase.firestore.DocumentData>;
            let answerCandidatesCollection: firebase.firestore.CollectionReference<firebase.firestore.DocumentData>;
            signalDoc.onSnapshot(async (doc) => {
              if (doc.exists) {
                const data = doc.data();
                const signal = data?.signal;
                if (signal === 0) {
                  pc = new RTCPeerConnection(servers);

                  await localStream?.getTracks().forEach((track) => {
                    pc.addTrack(track, localStream as MediaStream);
                  });

                  let onTrackExecuted = false;

                  pc.ontrack = async (event) => {
                    if (!onTrackExecuted) {
                      onTrackExecuted = true;
                      const remoteStream = new MediaStream();
                      await event.streams[0].getTracks().forEach((track) => {
                        remoteStream.addTrack(track);
                      });
                      console.log("Remote stream reflected");
                      await setRemoteStreams((prevStreams) => [...prevStreams, remoteStream]);
                    }
                  };

                  offerCandidatesCollection = callDocHost.collection("otherCandidates").doc(`candidate${newAddedUser}${myIndex}`).collection("offerCandidates");
                  answerCandidatesCollection = callDocHost
                    .collection("otherCandidates")
                    .doc(`candidate${newAddedUser}${myIndex}`)
                    .collection("answerCandidates");
                  pc.onicecandidate = async (event) => {
                    event.candidate && (await offerCandidatesCollection.add(event.candidate.toJSON()));
                  };
                  offerAnswerPairs = callDocHost.collection("otherCandidates").doc(`offerAnswerPairs${newAddedUser}${myIndex}`);

                  pc.onicecandidate = async (event) => {
                    event.candidate && (await offerCandidatesCollection.add(event.candidate.toJSON()));
                  };

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

                  const currentPairs: OfferAnswerPair[] = (await offerAnswerPairs.get()).data()?.offerAnswerPairs || [];

                  await currentPairs.push(offerAnswerPair);
                  console.log(currentPairs);
                  await offerAnswerPairs.set({ offerAnswerPairs: currentPairs });
                  await signalDoc.set({ signal: 1 });
                } else if (signal == 2) {
                  const answerDescription = new RTCSessionDescription((await offerAnswerPairs.get()).data()?.offerAnswerPairs[0].answer);
                  console.log("Data on receiver is ", (await offerAnswerPairs.get()).data()?.offerAnswerPairs[0].answer);
                  await pc.setRemoteDescription(answerDescription);

                  await answerCandidatesCollection.onSnapshot(
                    async (snapshot) => {
                      await snapshot.docChanges().forEach(async (change) => {
                        if (change.type === "added") {
                          const candidateData = change.doc.data();
                          const candidate = new RTCIceCandidate(candidateData);
                          await pc
                            .addIceCandidate(candidate)
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
                }
              }
            });
          }
        } else {
          console.log("No such document!");
        }
      });
      const indexUsers = (await indexOfOtherConnectedCandidates.get()).data()?.indexOfCurrentUsers;
      await indexUsers.forEach(async (existingCaller: number) => {
        console.log(`User Index: ${existingCaller}`);
        let signalDoc = callDocHost.collection("signal").doc(`signal${myIndex}${existingCaller}`);
        let offerAnswerPairs: firebase.firestore.DocumentReference<firebase.firestore.DocumentData>;
        let offerCandidatesCollection = callDocHost.collection("otherCandidates").doc(`candidate${myIndex}${existingCaller}`).collection("offerCandidates");
        let pc: RTCPeerConnection;

        signalDoc.onSnapshot(async (doc) => {
          if (doc.exists) {
            const data = doc.data();
            const signal = data?.signal;

            if (signal === 1) {
              pc = new RTCPeerConnection(servers);
              offerAnswerPairs = callDocHost.collection("otherCandidates").doc(`offerAnswerPairs${myIndex}${existingCaller}`);
              console.log(`pair is ${myIndex}${existingCaller}`);

              await localStream?.getTracks().forEach((track) => {
                pc.addTrack(track, localStream as MediaStream);
              });

              let onTrackExecuted = false;

              pc.ontrack = async (event) => {
                if (!onTrackExecuted) {
                  onTrackExecuted = true;
                  const remoteStream = new MediaStream();
                  await event.streams[0].getTracks().forEach((track) => {
                    remoteStream.addTrack(track);
                  });
                  console.log("Remote stream reflected");
                  await setRemoteStreams((prevStreams) => [...prevStreams, remoteStream]);
                }
              };

              const answerCandidatesCollection = callDocHost
                .collection("otherCandidates")
                .doc(`candidate${myIndex}${existingCaller}`)
                .collection("answerCandidates");
              if (pc)
                pc.onicecandidate = async (event) => {
                  event.candidate && (await answerCandidatesCollection.add(event.candidate.toJSON()));
                };

              const offerDescription = new RTCSessionDescription((await offerAnswerPairs.get()).data()?.offerAnswerPairs[0].offer);
              console.log("offer is ", (await offerAnswerPairs.get()).data()?.offerAnswerPairs);
              await pc.setRemoteDescription(offerDescription);

              const answerDescription = await pc.createAnswer();
              await pc.setLocalDescription(answerDescription);

              const answer = {
                sdp: answerDescription.sdp,
                type: answerDescription.type,
              };

              const currentPair = (await offerAnswerPairs.get()).data()?.offerAnswerPairs[0];
              console.log("Current pair is ", currentPair);
              currentPair.answer = answer;

              await offerAnswerPairs.update({ offerAnswerPairs: [currentPair] });

              await signalDoc.update({ signal: 2 });
            } else if (signal === 3) {
              console.log("The remote description after setting it is ", pc);
              await offerCandidatesCollection.get().then(async (snapshot) => {
                await snapshot.docs.forEach(async (doc) => {
                  const candidateData = doc.data();
                  const candidate = new RTCIceCandidate(candidateData);
                  await pc
                    .addIceCandidate(candidate)
                    .then(() => {
                      console.log("Ice candidate added successfully");
                    })
                    .catch((error) => {
                      console.error("Error adding ice candidate:", error);
                    });
                });
              });

              await offerCandidatesCollection.onSnapshot(
                async (snapshot) => {
                  await snapshot.docChanges().forEach(async (change) => {
                    if (change.type === "added") {
                      const candidateData = change.doc.data();
                      const candidate = new RTCIceCandidate(candidateData);
                      await pc
                        .addIceCandidate(candidate)
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
        });
      });

      if (answerButtonRef.current) answerButtonRef.current.disabled = true;
    };

    if (callButtonRef.current) {
      callButtonRef.current.onclick = handleCallButtonClick;
    }
    if (answerButtonRef.current) {
      answerButtonRef.current.onclick = handleAnswerButtonClick;
    }
  }, []);

  useEffect(() => {
    const newRemoteVideoRefs = remoteStreams.map(() => React.createRef<HTMLVideoElement>());
    setRemoteVideoRefs(newRemoteVideoRefs);
    console.log(remoteStreams);
  }, [remoteStreams]);

  useEffect(() => {
    remoteVideoRefs.forEach(async (ref, index) => {
      if (ref.current && remoteStreams[index]) {
        ref.current.srcObject = remoteStreams[index];
      }
    });
  }, [remoteVideoRefs, remoteStreams]);

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      if (callInputRef.current) {
        callInputRef.current.value = id;
      }
    }
    setIsClient(true);
  }, []);

  const copyLink = () => {
    const currentUrl = window.location.href;
    navigator.clipboard
      .writeText(currentUrl)
      .then(() => {
        toast.success("Link copied");
      })
      .catch((error) => {
        console.error("Failed to copy link: ", error);
      });
  };

  const handleMicToggle = async () => {
    setMicEnabled(!micEnabled);
    console.log(stream);
    if (stream) {
      const audioTrack = stream.getTracks().find((track) => track.kind === "audio");
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  };

  const handleVideoToggle = async () => {
    setVideoEnabled(!videoEnabled);
    console.log(stream);
    if (stream) {
      const videoTrack = stream.getTracks().find((track) => track.kind === "video");
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  };

  return (
    <div className="mx-auto p-5 ">
      <h2 className="text-2xl font-semibold my-8">Tech-RTC</h2>
      <div className="flex mx-auto justify-center w-full gap-2 flex-wrap">
        <div className="bg-gray-100 p-4 rounded-lg shadow-md max-w-[33%] min-w-[500px] max-sm:w-full">
          <h3 className="text-xl font-medium mb-2">Local Stream</h3>
          {isClient && (
            <video
              id="webcamVideo"
              ref={webcamVideoRef}
              autoPlay
              playsInline
              muted
              className="max-sm:w-[90%] w-[500px] aspect-video mx-auto rounded-md bg-[#202124] "
            ></video>
          )}
          {!isClient && <div className="max-sm:w-[90%] max-lg:w-full w-[500px] aspect-video mx-auto rounded-md bg-[#202124] "></div>}
        </div>
        {remoteStreams.map((_, index) => (
          <div key={index} className="bg-gray-100 p-4 rounded-lg shadow-md max-w-[33%] min-w-[500px] max-sm:w-full">
            <h3 className="text-xl font-medium mb-2">Remote Stream {index + 1}</h3>
            {isClient && (
              <video
                ref={remoteVideoRefs[index]}
                autoPlay
                playsInline
                className="max-sm:w-[90%] w-[500px] aspect-video mx-auto rounded-md bg-[#202124] "
              ></video>
            )}
            {!isClient && <div className="max-sm:w-[90%] max-lg:w-full w-[500px] aspect-video mx-auto rounded-md bg-[#202124] "></div>}
          </div>
        ))}
      </div>
      {accessGiven && (
        <div className="mt-5 flex justify-center gap-2">
          <button
            onClick={handleMicToggle}
            className={`px-4 py-2 rounded-md flex items-center gap-2 ${micEnabled ? "bg-red-500 text-white" : "bg-green-500 text-white"}`}
          >
            {micEnabled ? <FaMicrophoneAlt /> : <FaMicrophone />}
            {micEnabled ? "Disable Mic" : "Enable Mic"}
          </button>
          <button
            onClick={handleVideoToggle}
            className={`px-4 py-2 rounded-md flex items-center gap-2 ${videoEnabled ? "bg-red-500 text-white" : "bg-green-500 text-white"}`}
          >
            {videoEnabled ? <FaVideoSlash /> : <FaVideo />}
            {videoEnabled ? "Disable Video" : "Enable Video"}
          </button>
        </div>
      )}
      <h2 className="text-2xl font-semibold my-4">1. Start your Webcam</h2>

      <button ref={webcamButtonRef} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
        Start webcam
      </button>

      <h2 className="text-2xl font-semibold mt-8 mb-4">2. Create a new Call</h2>
      <button
        ref={callButtonRef}
        disabled
        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Create Call (offer)
      </button>

      <h2 className="text-2xl font-semibold mt-8 mb-4">3. Join a Call</h2>
      <p className="mb-2">Answer the call from a different browser window or device</p>
      <div className="md:flex-row flex flex-col w-full mx-auto gap-2 justify-center items-center">
        <input ref={callInputRef} className="p-2 border border-gray-300 rounded-md w-[400px] max-w-full" />
        <div className="flex gap-2">
          <button
            ref={answerButtonRef}
            disabled
            className="px-4 py-2 w- bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Answer
          </button>
          <button
            disabled={!inCall}
            onClick={copyLink}
            className="disabled:cursor-not-allowed disabled:bg-green-300 px-2 py-1 bg-green-500 text-white rounded-md"
          >
            <div onClick={copyLink} className={`${inCall ? "" : "cursor-not-allowed"} px-2 py-1 text-white rounded-md `} title="Copy Link">
              <FaCopy />
            </div>
          </button>
        </div>
      </div>

      <h2 className="text-2xl font-semibold mt-8 mb-4">4. Hangup</h2>
      <button
        ref={hangupButtonRef}
        disabled
        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed mb-5"
      >
        Hangup
      </button>
    </div>
  );
};

export default Page;
