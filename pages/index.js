import { useEffect, useState } from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import ChatRoom from "../components/ChatRoom";
require('dotenv').config();


const firebaseConfig = {
  apiKey: process.env.API_KEY_FIREBASE,
  authDomain: "chat-trabalho-733ba.firebaseapp.com",
  databaseURL: "https://chat-trabalho-733ba-default-rtdb.firebaseio.com",
  projectId: "chat-trabalho-733ba",
  storageBucket: "chat-trabalho-733ba.appspot.com",
  messagingSenderId: "236874509743",
  appId: "1:236874509743:web:728dd59f1698c288ff535a",
  measurementId: "G-XWJX069S5L"
};

// inicialização do Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

export default function Home() {
  // estados iniciais
  const [user, setUser] = useState(() => auth.currentUser);

  // verificação automática do status de autenticação do usuário
  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      // atualiza o estado atual do usuário
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });
  }, []);

  // fazer login
  const signInWithGoogle = async () => {
    // obter o objeto provedor do Google
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.useDeviceLanguage();

    // fazer login do usuário
    try {
      await auth.signInWithPopup(provider);
    } catch (error) {
      console.log(error);
    }
  };

  // fazer logout
  const signOut = async () => {
    try {
      await firebase.auth().signOut();
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <div className="container">
      <main>
        {user ? (
          <>
            <nav id="sign_out">
              <h2>GarroGPT</h2>
              <button onClick={signOut}>Sair</button>
            </nav>
            <ChatRoom user={user} db={db} />
          </>
        ) : (
          <section id="sign_in">
            <h1>Bem vindo(a) ao GarroGPT </h1>
            <button onClick={signInWithGoogle}>Entrar com sua credencial do Google</button>
          </section>
        )}
      </main>
    </div>
  );
}
