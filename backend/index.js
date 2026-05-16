// import "dotenv/config";
// import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
// import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
// import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
// // import { OpenAIEmbeddings } from "@langchain/openai";
// import { OpenRouter } from "@openrouter/sdk";
// import { QdrantVectorStore } from "@langchain/qdrant";
// import { OpenAI } from "openai";

// const openrouter = new OpenRouter({
//   apiKey: process.env.OPENROUTER_API_KEY,
//   baseURL: "https://openrouter.ai/api/v1",
// });

// const client = new OpenAI({
//   apiKey: process.env.OPENROUTER_API_KEY,
//   baseURL: "https://openrouter.ai/api/v1",
// });

// const pdffilePath = "./OS.pdf";

// const embeddings = {

//   embedDocuments: async (texts) => {

//   const batchSize = 5;

//   const batches = [];

//   for (let i = 0; i < texts.length; i += batchSize) {

//     batches.push(
//       texts.slice(i, i + batchSize)
//     );
//   }

//   const allVectors = [];

//   for (const batch of batches) {

//     const promises = batch.map(async (text) => {

//       const response =
//         await openrouter.embeddings.generate({
//           requestBody: {
//             model:
//               "nvidia/llama-nemotron-embed-vl-1b-v2:free",

//             input: [
//               {
//                 content: [
//                   {
//                     type: "text",

//                     text: String(text)
//                       .slice(0, 1000),
//                   },
//                 ],
//               },
//             ],

//             encodingFormat: "float",
//           },
//         });

//       return response.data[0].embedding;
//     });

//     const vectors =
//       await Promise.all(promises);

//     allVectors.push(...vectors);
//   }

//   return allVectors;
// },

//   embedQuery: async (text) => {

//     const response =
//       await openrouter.embeddings.generate({
//         requestBody: {
//           model: "nvidia/llama-nemotron-embed-vl-1b-v2:free",

//           input: [
//             {
//               content: [
//                 {
//                   type: "text",
//                   text: String(text).slice(0, 1000),
//                 },
//               ],
//             },
//           ],

//           encodingFormat: "float",
//         },
//       });

//     return response.data[0].embedding;
//   },
// };

// async function indexingPDF(filePath, notebookId) {
//   const loader = new PDFLoader(filePath);

//   // chunking
//   const docs = await loader.load();

//   const splitter =
//   new RecursiveCharacterTextSplitter({
//     chunkSize: 1000,
//     chunkOverlap: 200,
//   });

// const splitDocs =
//   await splitter.splitDocuments(docs);

//   // embeddings
//   //    const embeddings = new OpenAIEmbeddings({
//   //        model: "text-embedding-3-large",
//   //    });

//   const vectoreStore = await QdrantVectorStore.fromDocuments(splitDocs, embeddings, {
//     url: process.env.QDRANT_URL,
//     apiKey: process.env.QDRANT_API_KEY, 
//     collectionName: notebookId,
//   });

//   console.log("Indexeding Completed");
//   console.log(
//   "Total chunks:",
//   splitDocs.length
// );
// }

// // indexingPDF();


//   // -----------------------------------
//   async function indexCSV(filePath, notebookId) {
//     const loader = new CSVLoader(filePath);
//     //   const loader = new CSVLoader("language-locales.csv");

//     const docs = await loader.load();
//     const splitter =
//   new RecursiveCharacterTextSplitter({
//     chunkSize: 1000,
//     chunkOverlap: 200,
//   });

// const splitDocs =
//   await splitter.splitDocuments(docs);

//     const vectoreStore = await QdrantVectorStore.fromDocuments(
//       splitDocs,
//       embeddings,
//       {
//         url: process.env.QDRANT_URL,
//         apiKey: process.env.QDRANT_API_KEY,
//         collectionName: notebookId,
//       },
//     );

//     console.log("CSV Indexing Completed");
//   };

// // indexCSV();


// async function retrieval(userQuery, notebookId) {
  

//   const vectoreStore = await QdrantVectorStore.fromExistingCollection(
//     embeddings,
//     {
//       url: process.env.QDRANT_URL,
//       apiKey: process.env.QDRANT_API_KEY,
//       collectionName: notebookId,
//     },
//   );

//   const retrival = await vectoreStore.asRetriever({
//     k: 3,
//   });

//   const searchedChunks = await retrival.invoke(userQuery);

//   //   const client = new OpenAI();
//   const context = searchedChunks.map((doc) => doc.pageContent).join("\n\n");

//   const system_prompt = `You are an AI Assistant who answers questions ONLY from the provided PDF/CSV dataset context.

//         Rules:
//         - Only answer using the provided context.
//         - If information is unavailable, say:
//         "I could not find this information in the CSV data."

//         CSV Context: ${context};
//        `;

//   const response = await client.chat.completions.create({
//     model: "openai/gpt-4.1-mini",
//     max_tokens: 500,
//     messages: [
//       {
//         role: "system",
//         content: system_prompt,
//       },
//       {
//         role: "user",
//         content: userQuery,
//       },
//     ],
//   });

//   return response.choices[0].message.content;
// }

// export {
//   indexingPDF,
//   indexCSV,
//   retrieval,
// };
import "dotenv/config";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { OpenRouter } from "@openrouter/sdk";
import { QdrantVectorStore } from "@langchain/qdrant";
import { OpenAI } from "openai";

const EMBEDDING_MODEL = "nvidia/llama-nemotron-embed-vl-1b-v2:free";
const CHAT_MODEL = "openai/gpt-4.1-mini";

const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 180;
const EMBEDDING_BATCH_SIZE = 5;
const RETRIEVAL_K = 4;

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

function normalizeText(text) {
  return String(text ?? "").replace(/\s+/g, " ").trim();
}

function stripCodeFences(text) {
  return String(text ?? "")
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();
}

function safeJsonParse(text, fallback) {
  try {
    const cleaned = stripCodeFences(text);
    const match = cleaned.match(/\{[\s\S]*\}/);
    return JSON.parse(match ? match[0] : cleaned);
  } catch {
    return fallback;
  }
}

function splitText(text, chunkSize = CHUNK_SIZE, chunkOverlap = CHUNK_OVERLAP) {
  const cleaned = normalizeText(text);
  if (!cleaned) return [];
  if (cleaned.length <= chunkSize) return [cleaned];

  const chunks = [];
  let start = 0;

  while (start < cleaned.length) {
    let end = Math.min(start + chunkSize, cleaned.length);

    if (end < cleaned.length) {
      const lastSpace = cleaned.lastIndexOf(" ", end);
      if (lastSpace > start + Math.floor(chunkSize * 0.6)) {
        end = lastSpace;
      }
    }

    const chunk = cleaned.slice(start, end).trim();
    if (chunk) chunks.push(chunk);

    if (end >= cleaned.length) break;

    const nextStart = Math.max(0, end - chunkOverlap);
    start = nextStart > start ? nextStart : end;
  }

  return chunks;
}

function splitDocumentsIntoChunks(docs) {
  const chunks = [];

  docs.forEach((doc, docIndex) => {
    const parts = splitText(doc.pageContent);
    const metadata = doc.metadata || {};

    parts.forEach((part, chunkIndex) => {
      chunks.push({
        pageContent: part,
        metadata: {
          ...metadata,
          docIndex,
          chunkIndex,
        },
      });
    });
  });

  return chunks;
}

function dedupeDocuments(docs) {
  const seen = new Set();
  const unique = [];

  for (const doc of docs) {
    const key = `${normalizeText(doc.pageContent)}|${JSON.stringify(
      doc.metadata || {},
    )}`;

    if (seen.has(key)) continue;

    seen.add(key);
    unique.push(doc);
  }

  return unique;
}

function formatContext(docs, limit = 8) {
  return docs.slice(0, limit).map((doc, index) => {
    const md = doc.metadata || {};
    const page =
      md.pageNumber ??
      md.loc?.pageNumber ??
      md.page ??
      md.sourcePage ??
      "unknown";

    return `Chunk ${index + 1} (page ${page})\n${doc.pageContent}`;
  }).join("\n\n---\n\n");
}

async function withRetry(fn, retries = 3, delayMs = 1200) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
      await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }

  throw lastError;
}

async function embedOne(text) {
  return withRetry(async () => {
    const response = await openrouter.embeddings.generate({
      requestBody: {
        model: EMBEDDING_MODEL,
        input: [
          {
            content: [
              {
                type: "text",
                text: normalizeText(text).slice(0, 2000),
              },
            ],
          },
        ],
        encodingFormat: "float",
      },
    });

    return response.data[0].embedding;
  });
}

const embeddings = {
  embedDocuments: async (texts) => {
    const vectors = [];

    for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = texts.slice(i, i + EMBEDDING_BATCH_SIZE);

      const batchVectors = await Promise.all(
        batch.map((text) => embedOne(text)),
      );

      vectors.push(...batchVectors);
    }

    return vectors;
  },

  embedQuery: async (text) => {
    return embedOne(text);
  },
};

async function generateSearchPlan(userQuery) {
  const response = await withRetry(() =>
    client.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0,
      max_tokens: 350,
      messages: [
        {
          role: "system",
          content: `
You are a query rewriting assistant for document retrieval.

Return ONLY valid JSON with exactly these keys:
{
  "rewritten_query": "string",
  "alternate_queries": ["string", "string"],
  "hyde_document": "string"
}

Rules:
- Fix spelling mistakes.
- Infer missing intent.
- Keep queries short and retrieval-focused.
- alternate_queries should be 2 or 3 different search phrasings.
- hyde_document should be a short hypothetical document/answer that would likely appear in the source if the question were answered.
- Do not add markdown.
          `.trim(),
        },
        {
          role: "user",
          content: userQuery,
        },
      ],
    }),
  );

  const raw = response.choices?.[0]?.message?.content || "";
  const parsed = safeJsonParse(raw, null);

  if (!parsed) {
    return {
      rewritten_query: normalizeText(userQuery),
      alternate_queries: [normalizeText(userQuery)],
      hyde_document: normalizeText(userQuery),
    };
  }

  return {
    rewritten_query: normalizeText(parsed.rewritten_query || userQuery),
    alternate_queries: Array.isArray(parsed.alternate_queries)
      ? parsed.alternate_queries.map(normalizeText).filter(Boolean)
      : [],
    hyde_document: normalizeText(parsed.hyde_document || userQuery),
  };
}

function buildSearchQueries(userQuery, plan) {
  const queries = [
    normalizeText(userQuery),
    normalizeText(plan.rewritten_query),
    ...(plan.alternate_queries || []).map(normalizeText),
    normalizeText(plan.hyde_document),
  ].filter(Boolean);

  return [...new Set(queries)];
}

async function retrieveDocumentsForQueries(vectorStore, queries, k = RETRIEVAL_K) {
  const retriever = vectorStore.asRetriever({ k });
  const allDocs = [];

  for (const query of queries) {
    try {
      const docs = await retriever.invoke(query);
      allDocs.push(...docs);
    } catch (error) {
      console.log("Retrieval query failed:", query);
      console.log(error);
    }
  }

  return dedupeDocuments(allDocs);
}

async function judgeRetrievalQuality(userQuery, plan, docs) {
  const preview = formatContext(docs, 6).slice(0, 6000);

  const response = await withRetry(() =>
    client.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0,
      max_tokens: 250,
      messages: [
        {
          role: "system",
          content: `
You are a retrieval quality checker for a RAG system.

Return ONLY valid JSON with exactly these keys:
{
  "sufficient": true/false,
  "improved_query": "string or null"
}

Rules:
- Decide whether the retrieved context is enough to answer the user's question.
- If the context is weak, irrelevant, or incomplete, set "sufficient": false.
- If insufficient, provide a better "improved_query" that could retrieve better results.
- Do not add markdown.
          `.trim(),
        },
        {
          role: "user",
          content: `
User question:
${userQuery}

Initial search plan:
${JSON.stringify(plan)}

Retrieved context:
${preview}
          `.trim(),
        },
      ],
    }),
  );

  const raw = response.choices?.[0]?.message?.content || "";
  const verdict = safeJsonParse(raw, null);

  if (!verdict) {
    return { sufficient: true, improved_query: null };
  }

  return {
    sufficient: Boolean(verdict.sufficient),
    improved_query: verdict.improved_query ? normalizeText(verdict.improved_query) : null,
  };
}

async function indexingPDF(filePath, notebookId) {
  const loader = new PDFLoader(filePath);
  const docs = await loader.load();

  const splitDocs = splitDocumentsIntoChunks(docs);

  await QdrantVectorStore.fromDocuments(splitDocs, embeddings, {
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
    collectionName: notebookId,
  });

  console.log("PDF Indexing Completed");
  console.log("Total chunks:", splitDocs.length);
}

async function indexCSV(filePath, notebookId) {
  const loader = new CSVLoader(filePath);
  const docs = await loader.load();

  const splitDocs = splitDocumentsIntoChunks(docs);

  await QdrantVectorStore.fromDocuments(splitDocs, embeddings, {
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
    collectionName: notebookId,
  });

  console.log("CSV Indexing Completed");
  console.log("Total chunks:", splitDocs.length);
}

async function retrieval(userQuery, notebookId) {
  try {
    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: process.env.QDRANT_URL,
        apiKey: process.env.QDRANT_API_KEY,
        collectionName: notebookId,
      },
    );

    const searchPlan = await generateSearchPlan(userQuery);
    const initialQueries = buildSearchQueries(userQuery, searchPlan);

    let docs = await retrieveDocumentsForQueries(vectorStore, initialQueries, RETRIEVAL_K);

    if (docs.length === 0) {
      return "I could not find this information in the uploaded document.";
    }

    const verdict = await judgeRetrievalQuality(userQuery, searchPlan, docs);

    if (!verdict.sufficient && verdict.improved_query) {
      const improvedPlan = {
        rewritten_query: verdict.improved_query,
        alternate_queries: [verdict.improved_query],
        hyde_document: verdict.improved_query,
      };

      const extraQueries = buildSearchQueries(verdict.improved_query, improvedPlan);
      const extraDocs = await retrieveDocumentsForQueries(
        vectorStore,
        extraQueries,
        RETRIEVAL_K + 1,
      );

      docs = dedupeDocuments([...docs, ...extraDocs]);
    }

    const context = formatContext(docs, 8).slice(0, 12000);

    const response = await withRetry(() =>
      client.chat.completions.create({
        model: CHAT_MODEL,
        max_tokens: 700,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: `
You are an AI assistant for a notebook-based document QA system.

Rules:
- Answer ONLY from the provided context.
- If the answer is not in the context, say exactly:
  "I could not find this information in the uploaded document."
- Do not use outside knowledge.
- Keep the answer clear, direct, and grounded.
            `.trim(),
          },
          {
            role: "user",
            content: `
User question:
${userQuery}

Context:
${context}
            `.trim(),
          },
        ],
      }),
    );

    return (
      response.choices?.[0]?.message?.content ||
      "I could not find this information in the uploaded document."
    );
  } catch (error) {
    console.log("Retrieval error:", error);
    return "I could not find this information in the uploaded document.";
  }
}

export {
  indexingPDF,
  indexCSV,
  retrieval,
};