// import express from "express";
// import cors from "cors";
// import fs from "fs";
// import multer from "multer";
// import path from "path";
// import { QdrantClient } from "@qdrant/js-client-rest";

// import {
//   indexingPDF,
//   indexCSV,
//   retrieval
// } from "./index.js";

// const app = express();

// app.use(cors());
// app.use(express.json());

// if (!fs.existsSync("uploads")) {
//   fs.mkdirSync("uploads");
// }


// // ---------------- MULTER ----------------

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads/");
//   },

//   filename: function (req, file, cb) {
//     cb(null, Date.now() + "-" + file.originalname);
//   },
// });

// const upload = multer({ storage });


// // ---------------- GLOBAL TYPE ----------------

// let currentFileType = "";


// // ---------------- UPLOAD ROUTE ----------------

// app.post("/upload", upload.single("file"), async (req, res) => {

//   console.log("UPLOAD HIT");

//   try {

//     const filePath = req.file.path;

//     // following is the for making the separate notebooks for separate sessions.
//     const notebookId = req.body.notebookId;
//     console.log(notebookId);

//     const extension = path.extname(req.file.originalname);

//     if (extension === ".pdf") {

//     //   currentFileType = "pdf";

//       await indexingPDF(filePath , notebookId);

//     } 
//     else if (extension === ".csv") {

//     //   currentFileType = "csv";

//       await indexCSV(filePath , notebookId);

//     }
//     else {

//       return res.status(400).json({
//         message: "Unsupported file type",
//       });
//     }

//     res.json({
//       message: "Indexing Completed",
//     });

//   } catch (error) {

//     console.log(error);

//     res.status(500).json({
//       message: "Upload failed",
//     });
//   }
// });


// // ---------------- CHAT ROUTE ----------------

// app.post("/chat", async (req, res) => {

//   try {

//     const { query, notebookId} = req.body;

//     let answer = await retrieval(query , notebookId);

//     // if (currentFileType === "pdf" || currentFileType === "csv") {

//     //   answer = await retrivalPDF(query);

//     // } else if (currentFileType === "csv") {

      

//     // } else {

//     //   return res.status(400).json({
//     //     message: "No file uploaded",
//     //   });
//     // }

//     res.json({
//       answer,
//     });

//   } catch (error) {

//     console.log(error);

//     res.status(500).json({
//       message: "Chat failed",
//     });
//   }
// });


// // ---------------- SERVER ----------------

// app.listen(process.env.PORT || 3000,  () => {
//   console.log("Server running");
// });


// const qdrant = new QdrantClient({
//   url: process.env.QDRANT_URL,
//   apiKey: process.env.QDRANT_API_KEY,
// });

// app.delete("/notebook/:id", async (req, res) => {

//   try {

//     const notebookId = req.params.id;

//     await qdrant.deleteCollection(
//       notebookId
//     );

//     res.json({
//       message: "Notebook deleted",
//     });

//   } catch (error) {

//     console.log(error);

//     res.status(500).json({
//       message: "Delete failed",
//     });
//   }
// });

import express from "express";
import cors from "cors";
import fs from "fs";
import multer from "multer";
import path from "path";
import { QdrantClient } from "@qdrant/js-client-rest";

import {
  indexingPDF,
  indexCSV,
  retrieval,
} from "./index.js";

const app = express();

app.use(cors());
app.use(express.json());

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

app.post("/upload", upload.single("file"), async (req, res) => {
  console.log("UPLOAD HIT");

  if (!req.file) {
    return res.status(400).json({
      message: "No file uploaded",
    });
  }

  try {
    const filePath = req.file.path;
    const notebookId = String(req.body.notebookId || "").trim();

    if (!notebookId) {
      return res.status(400).json({
        message: "Notebook ID missing",
      });
    }

    const extension = path.extname(req.file.originalname).toLowerCase();

    if (extension === ".pdf") {
      await indexingPDF(filePath, notebookId);
    } else if (extension === ".csv") {
      await indexCSV(filePath, notebookId);
    } else {
      return res.status(400).json({
        message: "Unsupported file type",
      });
    }

    return res.json({
      message: "Indexing Completed",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Upload failed",
    });
  } finally {
    if (req.file?.path) {
      fs.promises.unlink(req.file.path).catch(() => {});
    }
  }
});

app.post("/chat", async (req, res) => {
  try {
    const { query, notebookId } = req.body;

    if (!query || !notebookId) {
      return res.status(400).json({
        message: "Query or notebookId missing",
      });
    }

    const answer = await retrieval(query, notebookId);

    return res.json({
      answer,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Chat failed",
    });
  }
});

app.delete("/notebook/:id", async (req, res) => {
  try {
    const notebookId = req.params.id;

    await qdrant.deleteCollection(notebookId);

    return res.json({
      message: "Notebook deleted",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Delete failed",
    });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});