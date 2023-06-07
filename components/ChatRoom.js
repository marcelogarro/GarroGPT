import { useEffect, useRef, useState } from "react";
import { formatRelative } from "date-fns";
import axios from "axios";

export default function ChatRoom(props) {
  const db = props.db;
  const dummySpace = useRef();
  const { uid, displayName, photoURL } = props.user;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [shouldClearMessages, setShouldClearMessages] = useState(false);

  useEffect(() => {
    db.collection("messages")
      .orderBy("createdAt")
      .limit(100)
      .onSnapshot((querySnapshot) => {
        const data = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setMessages(data);
      });
  }, [db]);

  useEffect(() => {
    if (shouldClearMessages) {
      setMessages([]);
      setShouldClearMessages(false);
    }
  }, [shouldClearMessages]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    db.collection("messages").add({
      text: newMessage,
      createdAt: new Date(),
      uid,
      displayName,
      photoURL,
    });

    setNewMessage("");

    try {
      const apiKey = "process.env.API_KEY_CHAT"; // Substitua pela sua chave de API válida do CHAT GPT

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      };

      const data = {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: newMessage }],
        max_tokens: 200,
        temperature: 0.5,
      };

      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        data,
        { headers }
      );

      if (
        response.data.choices &&
        Array.isArray(response.data.choices) &&
        response.data.choices.length > 0
      ) {
        const chatbotResponse = response.data.choices[0].message.content;
        console.log("Chatbot Response:", chatbotResponse);

        if (chatbotResponse) {
          db.collection("messages").add({
            text: chatbotResponse,
            createdAt: new Date(),
            uid: "chat-gpt",
            displayName: "Chatbot GPT",
          });
        }
      }
    } catch (error) {
      console.error("Erro ao chamar a API do Chatbot GPT:", error);
    }

    dummySpace.current.scrollIntoView({ behavior: "smooth" });
  };

  const handleClearMessages = () => {
    db.collection("messages")
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          db.collection("messages").doc(doc.id).delete();
        });
      });

    setShouldClearMessages(true);
  };

  const filteredMessages = shouldClearMessages
    ? []
    : messages.filter((message) => message.uid === uid || message.uid === "chat-gpt");

  return (
    <main id="chat_room">
      <ul>
        {filteredMessages.map((message) => (
          <li
            key={message.id}
            className={message.uid === uid ? "sent" : "received"}
          >
            <section>
              {message.photoURL && (
                <img
                  src={message.photoURL}
                  alt="Avatar"
                  width={45}
                  height={45}
                />
              )}
            </section>

            <section>
              <p style={{ overflowWrap: "break-word" }}>{message.text}</p>
              {message.displayName && <span>{message.displayName}</span>}
              <br />
              {message.createdAt && (
                <span>
                  {formatRelative(
                    new Date(message.createdAt.seconds * 1000),
                    new Date()
                  )}
                </span>
              )}
            </section>
          </li>
        ))}
      </ul>

      <section ref={dummySpace}></section>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Digite sua mensagem aqui..."
        />

        <button type="submit" disabled={!newMessage}>
          Enviar
        </button>
      </form>

      <button onClick={handleClearMessages}>Apagar Todas as Mensagens</button>
    </main>
  );
}
