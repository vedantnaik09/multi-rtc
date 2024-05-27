// 'use client'
// import React, { useRef, useEffect } from 'react';

// const VideoCapture: React.FC = () => {
//   const videoRef = useRef<HTMLVideoElement>(null);

//   useEffect(() => {
//     const startVideoCapture = async () => {
//       try {
//         // Request access to the user's camera
//         const stream = await navigator.mediaDevices.getUserMedia({ video: true });

//         // Display the stream on the video element
//         if (videoRef.current) {
//           videoRef.current.srcObject = stream;
//         }
//       } catch (error) {
//         console.error('Error accessing user media:', error);
//       }
//     };

//     startVideoCapture();

//     // Cleanup function to stop video capture when component unmounts
//     return () => {
//       if (videoRef.current && videoRef.current.srcObject) {
//         const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
//         tracks.forEach(track => track.stop());
//       }
//     };
//   }, []);

//   return (
//     <div>
//       <h2>Video Capture</h2>
//       <video ref={videoRef} autoPlay playsInline />
//     </div>
//   );
// };

// export default VideoCapture;
