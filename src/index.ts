import { Hono } from "hono";
import { streamText } from "hono/streaming";
import { stripIndents } from "common-tags";
import { events } from "fetch-event-stream";

const app = new Hono<{ Bindings: Env }>();

async function notify(title: string = "Notification", message: string) {
  // TODO: Send to app
  console.log(title, message);
}

app.post("/api/chat", async (c) => {
  const payload = await c.req.json();
  let systemMessage = stripIndents`You are an assistant for an employee at a Video Game store.
  
  Your job is to assist the employee in answering the user's question to the best of your ability. 
  
  You should help them look like they know everything about every video game.
  
  Always let the user know if you are unsure of the answer to their question, by replying "Dude, I'm not sure."
  `;
  if (payload.useVectorize) {
    console.log("Generating standalone question");
    const convo = payload.messages
      .map((msg: RoleScopedChatInput) => {
        return `${msg.role}: ${msg.content}`;
      })
      .join("\n\n");
    const results = await c.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      prompt: stripIndents`Create a single standalone question based on the following conversation:
        
      ${convo}
      
      Return only the standalone question.`,
    });
    const standaloneQuestion = results.response;
    notify("Standalone question", standaloneQuestion);
    const embeddingResults = await c.env.AI.run("@cf/baai/bge-large-en-v1.5", {
      text: standaloneQuestion,
    });
    // Use query to similarity search
    const matches = await c.env.VECTORIZE.query(embeddingResults.data[0], {
      returnMetadata: "all",
    });
    // Attach context to system message
    // All textual data is stored in the metadata to avoid a roundtrip back to the API
    const retrievedContext = matches.matches
      .filter((match) => match.score > 0.4)
      .map((match) => {
        return stripIndents`${match.metadata?.name}: ${match.metadata?.text}
        
        Source: ${match.metadata?.url};
        `;
      })
      .join("\n\n");
    systemMessage +=
      "\n\n" +
      stripIndents`
    You should also use the following content in determining your answer:

    <context>
    ${retrievedContext}
    </context>
    Make sure to include a link to the source.
    `;
  }
  const finalMessages = [
    { role: "system", content: systemMessage },
    ...payload.messages,
  ];
  notify("Messages", JSON.stringify(finalMessages, null, 2));
  const eventSource = await c.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
    messages: finalMessages,
    stream: true,
  });
  return streamText(c, async (stream) => {
    const chunks = events(new Response(eventSource as ReadableStream));
    for await (const chunk of chunks) {
      if (chunk.data !== undefined && chunk.data !== "[DONE]") {
        const data = JSON.parse(chunk.data);
        stream.write(data.response);
      }
    }
  });
});

export default app;
