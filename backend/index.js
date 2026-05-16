import "dotenv/config";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
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

  const batchSize = 5;

  const batches = [];

  for (let i = 0; i < texts.length; i += batchSize) {

    batches.push(
      texts.slice(i, i + batchSize)
    );
  }

  const allVectors = [];

  for (const batch of batches) {

    const promises = batch.map(async (text) => {

      const response =
        await openrouter.embeddings.generate({
          requestBody: {
            model:
              "nvidia/llama-nemotron-embed-vl-1b-v2:free",

            input: [
              {
                content: [
                  {
                    type: "text",

                    text: String(text)
                      .slice(0, 1000),
                  },
                ],
              },
            ],

            encodingFormat: "float",
          },
        });

      return response.data[0].embedding;
    });

    const vectors =
      await Promise.all(promises);

    allVectors.push(...vectors);
  }

  return allVectors;
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

  const splitter =
  new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

const splitDocs =
  await splitter.splitDocuments(docs);

  // embeddings
  //    const embeddings = new OpenAIEmbeddings({
  //        model: "text-embedding-3-large",
  //    });

  const vectoreStore = await QdrantVectorStore.fromDocuments(splitDocs, embeddings, {
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY, 
    collectionName: notebookId,
  });

  console.log("Indexeding Completed");
  console.log(
  "Total chunks:",
  splitDocs.length
);
}

// indexingPDF();


  // -----------------------------------
  async function indexCSV(filePath, notebookId) {
    const loader = new CSVLoader(filePath);
    //   const loader = new CSVLoader("language-locales.csv");

    const docs = await loader.load();
    const splitter =
  new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

const splitDocs =
  await splitter.splitDocuments(docs);

    const vectoreStore = await QdrantVectorStore.fromDocuments(
      splitDocs,
      embeddings,
      {
        url: process.env.QDRANT_URL,
        apiKey: process.env.QDRANT_API_KEY,
        collectionName: notebookId,
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
    },
  );

  const retrival = await vectoreStore.asRetriever({
    k: 3,
  });

  const searchedChunks = await retrival.invoke(userQuery);

  //   const client = new OpenAI();
  const context = searchedChunks.map((doc) => doc.pageContent).join("\n\n");

  const system_prompt = `You are an AI Assistant who answers questions ONLY from the provided PDF/CSV dataset context.

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
