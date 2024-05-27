// "use client";
// import React, { useEffect } from "react";
// import { initializeApp } from "firebase/app";
// import { getFirestore } from "firebase/firestore";
// import {
//   collection,
//   addDoc,
//   getDocs,
//   doc,
//   onSnapshot,
//   setDoc,
//   updateDoc, query
// } from "firebase/firestore";

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

// const app = initializeApp(firebaseConfig);

// const db = getFirestore(app);

// const addData = async () => {
//   // try {
//   //   const docRef = await addDoc(collection(db, "testusers"), {
//   //     first: "Ada",
//   //     last: "Lovelace",
//   //     born: 1815,
//   //   });
//   //   console.log("Document written with ID: ", docRef.id);
//   // } catch (e) {
//   //   console.error("Error adding document: ", e);
//   // }

//   // const querySnapshot = await getDocs(collection(db, "testusers"));
//   // querySnapshot.forEach((doc) => {
//   //   console.log(`${doc.id} => ${doc.data()}`);
//   // });

//   //   const unsub = onSnapshot(doc(db, "testusers"), (doc) => {
//   //     console.log("Current data: ", doc.data());
//   // });

//   // const specificDocRef = doc(collection(db, "testusers"), "specificDocumentId");

//   // // later...
//   // await setDoc(specificDocRef, {
//   //   name: "vedant",
//   //   age: 5,
//   // });

//   // const washingtonRef = doc(db, "testusers", "specificDocumentId");

//   // await updateDoc(washingtonRef, {
//   //   name: "Ghej"
//   // });
  

// //   const docRef = await addDoc(collection(db, "testusers", "specificDocumentId","newCollection"), {
// //         first: "Ada",
// //         last: "Lovelace",
// //         born: 1815,
// //       });
// //       console.log("Document written with ID: ", docRef.id);
// // };


// const q = query(collection(db,"testusers"))
// onSnapshot(q, (snapshot) => {
//   snapshot.docChanges().forEach((change) => {
//     if (change.type === 'added' && change.doc.metadata.hasPendingWrites) {
//       console.log('New user added:', change.doc.data());
//     }
//   });
// });

//   const specificDocRef = doc(collection(db, "testusers"));
//   // later...
//   await setDoc(specificDocRef, {
//     name: "vedant",
//     age: 5,
//   });


// }
// const Home = () => {
//   return (
//     <div>
//       <button onClick={addData}>Click</button>
//     </div>
//   );
// };

// export default Home;
