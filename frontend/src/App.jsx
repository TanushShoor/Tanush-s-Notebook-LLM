import { useState, useEffect } from "react";

import UploadBox from "./components/UploadBox";
import ChatBox from "./components/ChatBox";

import "./App.css";

import axios from "axios";

export default function App() {

  const [sidebarOpen, setSidebarOpen] =
    useState(true);

  const [menuState, setMenuState] =
    useState(null);

  const [
    editingNotebookId,
    setEditingNotebookId,
  ] = useState(null);

  const [
    draftNotebookName,
    setDraftNotebookName,
  ] = useState("");

  const [notebooks, setNotebooks] =
    useState(() => {

      const saved =
        localStorage.getItem(
          "notebooks"
        );

      return saved
        ? JSON.parse(saved)
        : [];
    });

  const [
    activeNotebook,
    setActiveNotebook,
  ] = useState(() => {

    const saved =
      localStorage.getItem(
        "activeNotebook"
      );

    return saved
      ? JSON.parse(saved)
      : null;
  });

  // Create notebook
  function createNotebook() {

    const notebook = {

      id: crypto.randomUUID(),

      title:
        `Notebook ${notebooks.length + 1}`,

      uploaded: false,
    };

    setNotebooks((prev) => [
      ...prev,
      notebook,
    ]);

    setActiveNotebook(notebook);

    setMenuState(null);

    setEditingNotebookId(null);

    setDraftNotebookName("");
  }

  // Save notebooks
  useEffect(() => {

    localStorage.setItem(
      "notebooks",
      JSON.stringify(notebooks)
    );

  }, [notebooks]);

  // Save active notebook
  useEffect(() => {

    localStorage.setItem(
      "activeNotebook",
      JSON.stringify(activeNotebook)
    );

  }, [activeNotebook]);

  // Close dropdown menu
  useEffect(() => {

    function handleClickOutside() {

      setMenuState(null);
    }

    window.addEventListener(
      "click",
      handleClickOutside
    );

    return () =>
      window.removeEventListener(
        "click",
        handleClickOutside
      );

  }, []);

  // Update notebook title
  function updateNotebookTitle(
    id,
    title
  ) {

    const updated = notebooks.map(
      (notebook) => {

        if (
          notebook.id === id
        ) {

          return {
            ...notebook,
            title,
          };
        }

        return notebook;
      }
    );

    setNotebooks(updated);

    if (
      activeNotebook?.id === id
    ) {

      setActiveNotebook({
        ...activeNotebook,
        title,
      });
    }
  }

  // Delete notebook
  async function deleteNotebook(id) {

    try {

      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/notebook/${id}`
      );

    } catch (error) {

      console.log(error);
    }

    localStorage.removeItem(id);

    const updated =
      notebooks.filter(
        (n) => n.id !== id
      );

    setNotebooks(updated);

    if (
      activeNotebook?.id === id
    ) {

      setActiveNotebook(null);
    }

    if (
      editingNotebookId === id
    ) {

      setEditingNotebookId(null);

      setDraftNotebookName("");
    }

    setMenuState(null);
  }

  // Start rename
  function startRename(notebook) {

    setEditingNotebookId(
      notebook.id
    );

    setDraftNotebookName(
      notebook.title
    );

    setMenuState(null);
  }

  // Save rename
  function saveRename(id) {

    const trimmed =
      draftNotebookName.trim();

    if (!trimmed) {

      setEditingNotebookId(null);

      setDraftNotebookName("");

      return;
    }

    const updated = notebooks.map(
      (n) =>

        n.id === id
          ? {
              ...n,
              title: trimmed,
            }
          : n
    );

    setNotebooks(updated);

    if (
      activeNotebook?.id === id
    ) {

      setActiveNotebook({
        ...activeNotebook,
        title: trimmed,
      });
    }

    setEditingNotebookId(null);

    setDraftNotebookName("");
  }

  return (

    <div className="app-container">

      <div className="background-overlay"></div>

      {
        sidebarOpen && (

          <div className="sidebar glass-panel">

            <div className="sidebar-header">

              <h1>
                Tanush's LLM Notebook
              </h1>

              <button
                className="hide-btn"
                onClick={() =>
                  setSidebarOpen(false)
                }
              >
                ✕
              </button>

            </div>

            <div className="sidebar-content">

              <div className="history-section">

                <div className="history-header">

                  <h2>
                    Notebooks
                  </h2>

                  <button
                    className="new-notebook-btn"
                    onClick={createNotebook}
                  >
                    + New
                  </button>

                </div>

                <div className="notebook-list">

                  {
                    notebooks.map(
                      (notebook) => (

                        <div
                          key={notebook.id}

                          className={
                            activeNotebook?.id ===
                            notebook.id
                              ? "notebook-item active"
                              : "notebook-item"
                          }

                          onClick={() => {

                            setActiveNotebook(
                              notebook
                            );

                            setMenuState(null);

                            setEditingNotebookId(null);
                          }}
                        >

                          <div className="notebook-row">

                            {
                              editingNotebookId ===
                              notebook.id ? (

                                <input
                                  className="rename-input"

                                  value={
                                    draftNotebookName
                                  }

                                  autoFocus

                                  onChange={(e) =>
                                    setDraftNotebookName(
                                      e.target.value
                                    )
                                  }

                                  onBlur={() =>
                                    saveRename(
                                      notebook.id
                                    )
                                  }

                                  onKeyDown={(e) => {

                                    if (
                                      e.key === "Enter"
                                    ) {

                                      saveRename(
                                        notebook.id
                                      );
                                    }

                                    if (
                                      e.key === "Escape"
                                    ) {

                                      setEditingNotebookId(
                                        null
                                      );

                                      setDraftNotebookName(
                                        ""
                                      );
                                    }

                                  }}

                                  onClick={(e) =>
                                    e.stopPropagation()
                                  }
                                />

                              ) : (

                                <span className="notebook-title">

                                  {
                                    notebook.title
                                  }

                                </span>
                              )
                            }

                            <div className="menu-wrapper">

                              <button
                                className="menu-btn"

                                onClick={(e) => {

                                  e.stopPropagation();

                                  const rect =
                                    e.currentTarget.getBoundingClientRect();

                                  setMenuState({

                                    id:
                                      notebook.id,

                                    top:
                                      rect.bottom + 8,

                                    left:
                                      Math.min(
                                        window.innerWidth - 160,
                                        rect.right - 140
                                      ),
                                  });
                                }}
                              >
                                ⋮
                              </button>

                            </div>

                          </div>

                        </div>
                      )
                    )
                  }

                </div>

              </div>

              <div className="upload-section">

                <UploadBox
                  activeNotebook={activeNotebook}

                  updateNotebookTitle={
                    updateNotebookTitle
                  }

                  setNotebooks={
                    setNotebooks
                  }
                />

              </div>

            </div>

            {
              menuState && (

                <div
                  className="menu-dropdown floating"

                  style={{
                    top: menuState.top,
                    left: menuState.left,
                  }}

                  onClick={(e) =>
                    e.stopPropagation()
                  }
                >

                  <button
                    onClick={() => {

                      const notebook =
                        notebooks.find(
                          (n) =>
                            n.id ===
                            menuState.id
                        );

                      if (notebook) {

                        startRename(
                          notebook
                        );
                      }

                      setMenuState(null);
                    }}
                  >
                    Rename
                  </button>

                  <button
                    className="delete-item"

                    onClick={() =>
                      deleteNotebook(
                        menuState.id
                      )
                    }
                  >
                    Delete
                  </button>

                </div>
              )
            }

          </div>
        )
      }

      <div className="chat-section glass-panel">

        {
          !sidebarOpen && (

            <button
              className="show-sidebar-btn"

              onClick={() =>
                setSidebarOpen(true)
              }
            >
              ☰
            </button>
          )
        }

        <ChatBox
          activeNotebook={activeNotebook}
        />

      </div>

    </div>
  );
}