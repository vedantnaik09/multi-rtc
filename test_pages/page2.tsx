// "use client";
// import { useState, useEffect, useRef } from "react";
// import firebase from "firebase/compat/app";
// import "firebase/compat/firestore";
// import SimplePeer from "simple-peer";

// // Initialize Firebase
// const firebaseConfig = {
//   apiKey: "AIzaSyDqUS57eUSz3bE-QUCNg0s0si9JG8cLQNo",
//   authDomain: "tech-rtc-eb651.firebaseapp.com",
//   databaseURL: "https://tech-rtc-eb651-default-rtdb.firebaseio.com",
//   projectId: "tech-rtc-eb651",
//   storageBucket: "tech-rtc-eb651.appspot.com",
//   messagingSenderId: "1088283860807",
//   appId: "1:1088283860807:web:bbf9fac412035a542d3662",
//   measurementId: "G-M7EV605HCX",
// };

// if (!firebase.apps.length) {
//   firebase.initializeApp(firebaseConfig);
// }

// const firestore = firebase.firestore();

// interface PeerWithSignal extends SimplePeer.Instance {
//   signal: (data: string | SimplePeer.SignalData) => void;
// }

// export default function Home() {
//   const [roomId, setRoomId] = useState("");
//   const [peers, setPeers] = useState<PeerWithSignal[]>([]);
//   const [localStream, setLocalStream] = useState<MediaStream | null>(null); // State to store local stream
//   const [remoteStreams, setRemoteStreams] = useState<MediaStream[]>([]); // State to store remote streams
//   const videoRef = useRef<HTMLVideoElement>(null); // Reference to local video element

//   useEffect(() => {
//     if (roomId) {
//       const roomRef = firestore.collection("rooms").doc(roomId);

//       const unsubscribe = roomRef.onSnapshot((snapshot) => {
//         const roomData = snapshot.data();
//         const newPeers = roomData ? roomData.peers : [];
//         setPeers(newPeers);
//       });

//       return () => {
//         unsubscribe();
//       };
//     }
//   }, [roomId]);

//   const joinRoom = async (roomId: string) => {
//     setRoomId(roomId);
//   };

//   const createRoom = async () => {
//     const roomRef = await firestore.collection("rooms").add({ peers: [] });
//     setRoomId(roomRef.id);
//   };

//   const leaveRoom = async () => {
//     await firestore.collection("rooms").doc(roomId).delete();
//     setRoomId("");
//   };

//  const connectToPeers = async () => {
//   try {
//     // Get access to a new local media stream (e.g., webcam)
//     const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

//     // Create a SimplePeer instance for each peer with its own local stream
//     const peer = new SimplePeer({ initiator: true, stream: localStream, config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] } });

//     peer.on("signal", async (signal) => {
//       await firestore
//         .collection("rooms")
//         .doc(roomId)
//         .update({
//           peers: firebase.firestore.FieldValue.arrayUnion(signal),
//         });
//     });

    

//     peer.on("stream", (stream) => {
//       // Store the remote stream in state
//       console.log("stream")
//       console.log(stream)
//       setRemoteStreams((prevStreams) => [...prevStreams, stream]);
//     });

//     // Add the peer to the list of peers
//     setPeers([...peers, peer]);
//   } catch (error) {
//     console.error("Error accessing local media:", error);
//   }
// };
  

//   useEffect(() => {
//     const startVideoCapture = async () => {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({
//           video: true,
//         });
//         if (videoRef.current) {
//           videoRef.current.srcObject = stream;
//         }
//       } catch (error) {
//         console.error("Error accessing user media:", error);
//       }
//     };

//     startVideoCapture();

//     return () => {
//       if (videoRef.current && videoRef.current.srcObject) {
//         const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
//         tracks.forEach((track) => track.stop());
//       }
//     };
//   }, []);

//   return (
//     <div>
//       <h1>Video Chat App</h1>
//       <video ref={videoRef} autoPlay playsInline />

//       {!roomId && (
//         <>
//           <button onClick={createRoom}>Create Room</button>
//           <RoomList joinRoom={joinRoom} />
//         </>
//       )}
//       {roomId && (
//         <div>
//           <p>Share this room ID with others: {roomId}</p>
//           <button onClick={leaveRoom}>Leave Room</button>
//           <button onClick={connectToPeers}>Connect to Peers</button>
//           {/* Render remote streams */}
//           {remoteStreams.map((stream, index) => (
//             <video
//               key={index}
//               autoPlay
//               playsInline
//               ref={(videoElement) => {
//                 if (videoElement && stream) {
//                   videoElement.srcObject = stream;
//                 }
//               }}
//             />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// function RoomList({ joinRoom }: { joinRoom: (roomId: string) => void }) {
//   const [rooms, setRooms] = useState<string[]>([]);
//   useEffect(() => {
//     const roomsRef = firestore.collection("rooms");
//     const unsubscribe = roomsRef.onSnapshot((snapshot) => {
//       const roomIds: string[] = [];
//       snapshot.forEach((doc) => {
//         roomIds.push(doc.id);
//       });
//       setRooms(roomIds);
//     });

//     return () => {
//       unsubscribe();
//     };
//   }, []);

//   return (
//     <div>
//       <h2>Join a Room</h2>
//       <ul>
//         {rooms.map((roomId) => (
//           <li key={roomId}>
//             <button onClick={() => joinRoom(roomId)}>Join Room {roomId}</button>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }
