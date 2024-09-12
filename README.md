# Gamertown

Welcome to Gamertown!

[![Watch Gamertown Vectorize Demo on YouTube](https://img.youtube.com/vi/9IjfyBJsJRQ/0.jpg)](https://youtu.be/9IjfyBJsJRQ)

This repo is the code for the behind the counter application that answers all your questions.

This is a demo of [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/) making use of [Vectorize](https://developers.cloudflare.com/vectorize/), our vector database.

This data can come from any source, I happend to use the [IGDB from Twitch](https://www.igdb.com/). I used the [IGDB API](https://api-docs.igdb.com/#getting-started)

The app is styled by the absolutely incredible [98.css](https://jdan.github.io/98.css/)

Also, you should check out [Oddworld](https://x.com/OddworldInc).

## Get started

Install dependencies

```bash
npm install
```

Create your Vectorize database. (I used the bge-large embedding.)

```bash
npx wrangler vectorize create video-game-summaries --preset "@cf/baai/bge-large-en-v1.5"      
```

Run the local development server

```bash
npm run dev
```

Deploy your application

```bash
npm run deploy
```





