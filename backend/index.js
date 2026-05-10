import "dotenv/config";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
// import { OpenAIEmbeddings } from "@langchain/openai";
import { OpenRouter } from "@openrouter/sdk";
import { QdrantVectorStore } from "@langchain/qdrant";
import { OpenAI } from "openai";

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const pdffilePath = "./OS.pdf";

const embeddings = {

  embedDocuments: async (texts) => {

    const vectors = [];

    for (const text of texts) {

      const response =
        await openrouter.embeddings.generate({
          requestBody: {
            model: "nvidia/llama-nemotron-embed-vl-1b-v2:free",

            input: [
              {
                content: [
                  {
                    type: "text",
                    text: String(text).slice(0, 1000),
                  },
                ],
              },
            ],

            encodingFormat: "float",
          },
        });

      vectors.push(response.data[0].embedding);
    }

    return vectors;
  },

  embedQuery: async (text) => {

    const response =
      await openrouter.embeddings.generate({
        requestBody: {
          model: "nvidia/llama-nemotron-embed-vl-1b-v2:free",

          input: [
            {
              content: [
                {
                  type: "text",
                  text: String(text).slice(0, 1000),
                },
              ],
            },
          ],

          encodingFormat: "float",
        },
      });

    return response.data[0].embedding;
  },
};

async function indexingPDF(filePath, notebookId) {
  const loader = new PDFLoader(filePath);

  // chunking
  const docs = await loader.load();

  // embeddings
  //    const embeddings = new OpenAIEmbeddings({
  //        model: "text-embedding-3-large",
  //    });

  const vectoreStore = await QdrantVectorStore.fromDocuments(docs, embeddings, {
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY, 
    collectionName: notebookId,
    // collectionName: "NOTEBOOK-DATA",
  });

  console.log("Indexeding Completed");
}

// indexingPDF();


  // -----------------------------------
  async function indexCSV(filePath, notebookId) {
    const loader = new CSVLoader(filePath);
    //   const loader = new CSVLoader("language-locales.csv");

    const docs = await loader.load();

    const vectoreStore = await QdrantVectorStore.fromDocuments(
      docs,
      embeddings,
      {
        url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
        collectionName: notebookId,
        // collectionName: "NOTEBOOK-DATA",
      },
    );

    console.log("CSV Indexing Completed");
  };

// indexCSV();


async function retrieval(userQuery, notebookId) {
  

  const vectoreStore = await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
      collectionName: notebookId,
      // collectionName: "NOTEBOOK-DATA",
    },
  );

  const retrival = await vectoreStore.asRetriever({
    k: 3,
  });

  const searchedChunks = await retrival.invoke(userQuery);

  //   const client = new OpenAI();
  const context = searchedChunks.map((doc) => doc.pageContent).join("\n\n");

  const system_prompt = `You are an AI Assistant who answers questions ONLY from the provided CSV dataset context.

        Rules:
        - Only answer using the provided context.
        - If information is unavailable, say:
        "I could not find this information in the CSV data."

        CSV Context: ${context};
       `;

  const response = await client.chat.completions.create({
    model: "openai/gpt-4.1-mini",
    max_tokens: 500,
    messages: [
      {
        role: "system",
        content: system_prompt,
      },
      {
        role: "user",
        content: userQuery,
      },
    ],
  });

  return response.choices[0].message.content;
}

export {
  indexingPDF,
  indexCSV,
  retrieval,
};
