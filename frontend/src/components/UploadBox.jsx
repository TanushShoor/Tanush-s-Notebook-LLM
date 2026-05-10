import {
  useState,
  useRef,
} from "react";

import axios from "axios";

import {
  FiUploadCloud,
} from "react-icons/fi";

export default function UploadBox({
  activeNotebook,
  updateNotebookTitle,
  setNotebooks,
}) {

  const [loading, setLoading] =
    useState(false);

  const [status, setStatus] =
    useState("");

  const [selectedFileName,
    setSelectedFileName] =
    useState("");

  const fileInputRef =
    useRef(null);

  async function handleFileSelect(
    e
  ) {

    const selectedFile =
      e.target.files[0];

    if (!selectedFile) return;

    if (!activeNotebook) {

      alert(
        "Create a notebook first"
      );

      return;
    }

    setSelectedFileName(
      selectedFile.name
    );

    const formData =
      new FormData();

    formData.append(
      "file",
      selectedFile
    );

    formData.append(
      "notebookId",
      activeNotebook.id
    );

    try {

      setLoading(true);

      setStatus("Indexing...");

      const response =
        await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/upload`,
          formData
        );

      setStatus(
        response.data.message
      );

      // mark uploaded
      setNotebooks((prev) =>
        prev.map((notebook) => {

          if (
            notebook.id ===
            activeNotebook.id
          ) {

            return {
              ...notebook,
              uploaded: true,
            };
          }

          return notebook;
        })
      );

      activeNotebook.uploaded =
        true;

      // auto rename
      if (
        activeNotebook.title.startsWith(
          "Notebook"
        )
      ) {

        const cleanName =
          selectedFile.name
            .replace(".pdf", "")
            .replace(".csv", "");

        updateNotebookTitle(
          activeNotebook.id,
          cleanName
        );
      }

      setTimeout(() => {

        setStatus("");

      }, 3000);

    } catch (error) {

      console.log(error);

      setStatus(
        "Upload Failed"
      );

    } finally {

      setLoading(false);

      if (
        fileInputRef.current
      ) {

        fileInputRef.current.value =
          "";
      }
    }
  }

  return (

    <div className="upload-container">

      <input
        ref={fileInputRef}

        type="file"

        accept=".pdf,.csv"

        style={{
          display: "none",
        }}

        onChange={
          handleFileSelect
        }
      />

      <div
        className="upload-dropzone"

        onClick={() => {

          fileInputRef.current?.click();

        }}
      >

        <FiUploadCloud
          className="upload-icon"
        />

        <h2 className="upload-title">

          {
            loading
              ? "Indexing..."
              : "Upload PDF or CSV"
          }

        </h2>

        <p className="upload-subtitle">

          Click here to browse files

        </p>

        {
          selectedFileName && (

            <p className="selected-file">

              {selectedFileName}

            </p>
          )
        }

      </div>

      {
        status && (

          <p className="status-text">

            {status}

          </p>
        )
      }

    </div>
  );
}
