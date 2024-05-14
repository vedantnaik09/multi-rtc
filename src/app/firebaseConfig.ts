import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';


const firebaseConfig = {
    apiKey: "AIzaSyDqUS57eUSz3bE-QUCNg0s0si9JG8cLQNo",
    authDomain: "tech-rtc-eb651.firebaseapp.com",
    databaseURL: "https://tech-rtc-eb651-default-rtdb.firebaseio.com",
    projectId: "tech-rtc-eb651",
    storageBucket: "tech-rtc-eb651.appspot.com",
    messagingSenderId: "1088283860807",
    appId: "1:1088283860807:web:bbf9fac412035a542d3662",
    measurementId: "G-M7EV605HCX",
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  
  const firestore = firebase.firestore();
  
  export { firestore, firebase };