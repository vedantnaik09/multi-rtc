// "use client";
// import React, { useEffect, useRef, useState } from "react";
// import { firestore, firebase } from "./firebaseConfig";

// const Home = () => {
  
//   const webcamButtonRef = useRef<HTMLButtonElement>(null);
//   const callButtonRef = useRef<HTMLButtonElement>(null);
//   const callInputRef = useRef<HTMLInputElement>(null);
//   const answerButtonRef = useRef<HTMLButtonElement>(null);
//   const hangupButtonRef = useRef<HTMLButtonElement>(null);
//   const webcamVideoRef = useRef<HTMLVideoElement>(null);
//   const remoteVideoRef = useRef<HTMLVideoElement>(null);

//   let localStream: MediaStream | null = null;
//   let remoteStream: MediaStream | null = null;

//   useEffect(() => {
//     const servers = {
//       iceServers: [
//         {
//           urls: [
//             "stun:stun1.l.google.com:19302",
//             "stun:stun2.l.google.com:19302",
//           ],
//         },
//       ],
//       iceCandidatePoolSize: 10,
//     };
//     let pc = new RTCPeerConnection(servers);

//     const startWebcam = async () => {
//       try {
//         localStream = await navigator.mediaDevices.getUserMedia({
//           video: true,
//           audio: true,
//         });
//         remoteStream = new MediaStream();


//         if (webcamVideoRef.current && localStream) {
//           webcamVideoRef.current.srcObject = localStream;
//           localStream.getTracks().forEach((track) => {
//             pc.addTrack(track, localStream as MediaStream);
//           });
//         }
//       } catch (error) {
//         console.error("Error accessing webcam:", error);
//       }

//       pc.ontrack = (event) => {
//         event.streams[0].getTracks().forEach((track) => {
//           if (remoteStream) {
//             remoteStream.addTrack(track);
//           }
//         });
  
//         if (remoteVideoRef.current) {
//           remoteVideoRef.current.srcObject = remoteStream;
//         }
//       };
//       if(callButtonRef.current)
//       callButtonRef.current.disabled = false;
//       if(answerButtonRef.current)
//       answerButtonRef.current.disabled = false;
//       if(webcamButtonRef.current)
//       webcamButtonRef.current.disabled = true;


//     };

//     if (webcamButtonRef.current) {
//       webcamButtonRef.current.onclick = startWebcam;
//     }

   

//     const handleCallButtonClick = async () => {
//       const callDoc = firestore.collection("calls").doc();
//       const offerCandidates = callDoc.collection("offerCandidates");
//       const answerCandidates = callDoc.collection("answerCandidates");
//       if (callInputRef.current) {
//         callInputRef.current.value = callDoc.id;
//       }

//       pc.onicecandidate = event =>{
//         event.candidate && offerCandidates.add(event.candidate.toJSON())
//       }

//       const offerDescription = await pc.createOffer()
//       await pc.setLocalDescription(offerDescription)
//       const offer ={
//         sdp: offerDescription.sdp,
//         type: offerDescription.type
//       }
//       await callDoc.set({offer})

//       callDoc.onSnapshot((snapshot)=>{
//         const data = snapshot.data()
//         if(!pc.currentRemoteDescription && data?.answer)
//             {
//                 const answerDescription = new RTCSessionDescription(data.answer)
//                 pc.setRemoteDescription(answerDescription)
//             }
//       })

//       answerCandidates.onSnapshot((snapshot)=>{
//         snapshot.docChanges().forEach((change)=>{
//             if(change.type === 'added')
//                 {
//                     const candidate = new RTCIceCandidate(change.doc.data());
//                     pc.addIceCandidate(candidate)
//                 }
//         })
//       })
//     };

//     const handleAnswerButtonClick = async () =>{
//         let callId;
//         if(callInputRef.current){
//         callId = callInputRef.current.value;}
//         const callDoc = firestore.collection('calls').doc(callId);
//         const offerCandidates = callDoc.collection("offerCandidates");
//         const answerCandidates = callDoc.collection("answerCandidates");

//         pc.onicecandidate = event =>{
//             event.candidate && answerCandidates.add(event.candidate.toJSON())
//         }

//         const callData = (await callDoc.get()).data()
//         const offerDescription = callData?.offer;
//         console.log(offerDescription)
//         await pc.setRemoteDescription(new RTCSessionDescription(offerDescription))

//         const answerDescription = await pc.createAnswer()
//         await pc.setLocalDescription(answerDescription)

//         const answer = {
//             sdp: answerDescription.sdp,
//             type: answerDescription.type
//         }

//         await callDoc.update({answer})

//         offerCandidates.onSnapshot((snapshot)=>{
//             snapshot.docChanges().forEach((change)=>{
//                 console.log(change)
//                 if(change.type == 'added')
//                     {
//                         let data = change.doc.data()
//                         pc.addIceCandidate(new RTCIceCandidate(data))
//                     }
//             })
//         })
//     }

//     if (callButtonRef.current) {
//       callButtonRef.current.onclick = handleCallButtonClick;
//     }
//     if (answerButtonRef.current) {
//       answerButtonRef.current.onclick = handleAnswerButtonClick;
//     }


//   }, []);

//   return (
//     <div>
//       <h2>1. Start your Webcam</h2>
//       <div className="videos">
//         <span>
//           <h3>Local Stream</h3>
//           <video
//             id="webcamVideo"
//             ref={webcamVideoRef}
//             autoPlay
//             playsInline
//           ></video>
//         </span>
//         <span>
//           <h3>Remote Stream</h3>
//           <video
//             id="remoteVideo"
//             ref={remoteVideoRef}
//             autoPlay
//             playsInline
//           ></video>
//         </span>
//       </div>

//       <button ref={webcamButtonRef}>Start webcam</button>
//       <h2>2. Create a new Call</h2>
//       <button ref={callButtonRef} disabled>
//         Create Call (offer)
//       </button>

//       <h2>3. Join a Call</h2>
//       <p>Answer the call from a different browser window or device</p>

//       <input ref={callInputRef} />
//       <button ref={answerButtonRef} disabled>
//         Answer
//       </button>

//       <h2>4. Hangup</h2>

//       <button ref={hangupButtonRef} disabled>
//         Hangup
//       </button>
//     </div>
//   );
// };

// export default Home;
