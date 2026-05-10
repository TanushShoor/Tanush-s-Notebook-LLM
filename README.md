# Tanush's Notebook LLM

An AI-powered Notebook application where users can upload PDF or CSV files and chat with their documents using Retrieval-Augmented Generation (RAG).

---

# 🚀 Live Project

- Frontend Live URL: YOUR_VERCEL_URL
- Backend Live URL: YOUR_RENDER_URL

---

# 📌 Features

- Upload PDF files
- Upload CSV files
- AI-powered chat with uploaded documents
- Separate notebooks with isolated vector collections
- Persistent chat history using LocalStorage
- Real-time document retrieval using vector embeddings
- Clean modern UI
- Fully deployed production setup

---

# 🛠️ Tech Stack

## Frontend
- React
- Vite
- Axios
- React Icons
- CSS

## Backend
- Node.js
- Express.js
- Multer

## AI / Vector Database
- OpenRouter API
- Qdrant Vector Database
- LangChain

## Deployment
- Vercel (Frontend)
- Render (Backend)
- Qdrant Cloud (Vector Database)

---

# 🧠 How It Works

1. User creates a notebook
2. User uploads a PDF or CSV file
3. Backend extracts document data
4. Text is converted into embeddings
5. Embeddings are stored in Qdrant collections
6. User asks questions
7. Relevant chunks are retrieved from Qdrant
8. AI generates answers using retrieved context

---

# 📂 Project Structure

```
My-notebook-LLM/
│
├── backend/
│   ├── uploads/
│   ├── server.js
│   ├── index.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├──public/
│   │   ├──websiteIcon.png
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── .env
│
└── docker-compose.yml
```

---

# ⚙️ Environment Variables

## Backend .env

```env
OPENROUTER_API_KEY=your_api_key
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_api_key
```

## Frontend .env

```env
VITE_BACKEND_URL=https://your-backend-url.onrender.com
```

---

# 💻 Local Setup

## 1. Clone Repository

```
git clone YOUR_GITHUB_REPOSITORY_URL
```

---

## 2. Install Dependencies

### Frontend

```bash
cd frontend
npm install
```

### Backend

```bash
cd backend
npm install --legacy-peer-deps
```

---

## 3. Start Qdrant with Docker

```bash
docker compose up -d
```

---

## 4. Run Backend

```bash
cd backend
node server.js
```

---

## 5. Run Frontend

```bash
cd frontend
npm run dev
```

---

# 🌐 Deployment

## Frontend Deployment
- Hosted on Vercel

## Backend Deployment
- Hosted on Render

## Vector Database
- Hosted on Qdrant Cloud

---

# 📖 API Routes

## Upload File

```http
POST /upload
```

### Form Data
- file
- notebookId

---

## Chat with Document

```http
POST /chat
```

### Body

```json
{
  "query": "your question",
  "notebookId": "notebook-id"
}
```

---

## Delete Notebook

```http
DELETE /notebook/:id
```

---

# 🔥 Future Improvements

- Authentication system
- Multiple file uploads
- Streaming AI responses
- Markdown rendering
- Better chunking strategy
- Search history
- Notebook sharing
- Dark/Light themes

---

# 👨‍💻 Author

Tanush Shoor

- GitHub: https://github.com/TanushShoor

---

# 📜 License

This project is for educational and learning purposes.
