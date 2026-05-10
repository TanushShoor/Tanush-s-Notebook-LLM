import {
  useState,
  useEffect,
  useRef,
} from "react";

import axios from "axios";

import { IoIosSend } from "react-icons/io";

export default function ChatBox({
  activeNotebook,
}) {

  const [query, setQuery] =
    useState("");

  const [messages, setMessages] =
    useState([]);

  const messagesEndRef = useRef(null);

  // Load notebook messages
  useEffect(() => {

    if (!activeNotebook) {

      setMessages([]);

      return;
    }

    const savedMessages =
      localStorage.getItem(
        activeNotebook.id
      );

    if (savedMessages) {

      setMessages(
        JSON.parse(savedMessages)
      );

    } else {

      setMessages([]);
    }

  }, [activeNotebook]);

  // Save messages
  useEffect(() => {

    if (!activeNotebook) return;

    localStorage.setItem(
      activeNotebook.id,
      JSON.stringify(messages)
    );

  }, [messages, activeNotebook]);

  // Auto scroll
  useEffect(() => {

    messagesEndRef.current?.
      scrollIntoView({
        behavior: "smooth",
      });

  }, [messages]);

  async function sendMessage() {

    if (!activeNotebook) {

      alert("Select a notebook");

      return;
    }

    if (!activeNotebook.uploaded) {

      alert(
        "Upload a file first"
      );

      return;
    }

    if (!query.trim()) return;

    const userMessage = {
      role: "user",
      text: query,
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
    ]);

    const currentQuery = query;

    setQuery("");

    try {

      const response =
        await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/chat`,
          {
            query: currentQuery,

            notebookId:
              activeNotebook.id,
          }
        );

      const botMessage = {
        role: "assistant",
        text: response.data.answer,
      };

      setMessages((prev) => [
        ...prev,
        botMessage,
      ]);

    } catch (error) {

      console.log(error);
    }
  }

  return (
    <div className="chat-wrapper">

      <div className="chat-header">

        <h1>

          {
            activeNotebook
              ? activeNotebook.title
              : "Tanush's LLM Notebook"
          }

        </h1>

      </div>

      <div className="messages-container">

        {
          messages.length === 0 && (

            <div className="welcome-box">

              <h2>
                Ask your AI anything
              </h2>

              <p>

                {
                  activeNotebook?.uploaded
                    ? "Start chatting with your document."
                    : "Upload a document first."
                }

              </p>

            </div>
          )
        }

        {
          messages.map((msg, index) => (

            <div
              key={index}
              className={`message ${msg.role}`}
            >

              <strong>

                {
                  msg.role === "user"
                    ? "You"
                    : "AI"
                }

              </strong>

              <p>{msg.text}</p>

            </div>
          ))
        }

        <div ref={messagesEndRef}></div>

      </div>

      <div className="input-container">

        <input
          className="chat-input"
          type="text"

          placeholder={
            activeNotebook?.uploaded
              ? "Ask anything about your document..."
              : "Upload a document first"
          }

          value={query}

          disabled={
            !activeNotebook?.uploaded
          }

          onChange={(e) =>
            setQuery(e.target.value)
          }

          onKeyDown={(e) => {

            if (e.key === "Enter") {

              sendMessage();
            }

          }}
        />

        <button
          className="send-btn"

          disabled={
            !activeNotebook?.uploaded
          }

          onClick={sendMessage}
        >

          <IoIosSend size={28} />

        </button>

      </div>

    </div>
  );
}