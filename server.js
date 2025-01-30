const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

const OLLAMA_API_URL = 'http://ollama.merai.app:11434/api/generate';
const CHUNK_SIZE = 500; // Define the chunk size in characters

// Enable CORS for all origins (for development purposes only)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Use body-parser middleware
app.use(bodyParser.json());

// Function to split text into chunks
const splitIntoChunks = (text, size) => {
  const regex = new RegExp(`(.|[\r\n]){1,${size}}`, 'g');
  return text.match(regex) || [];
};

// API endpoint to process prompt in chunks
app.post('/api/process-prompt', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  try {
    const chunks = splitIntoChunks(prompt, CHUNK_SIZE);
    const results = await Promise.all(
      chunks.map(async (chunk) => {
        const response = await axios.post(
          OLLAMA_API_URL,
          { model: 'llama3.3:latest', prompt: chunk, raw: true, stream: false },
          { headers: { 'Content-Type': 'application/json' } }
        );
        return response.data.response.trim();
      })
    );

    // Combine the results into a single string
    const combinedResult = results.join('\n\n');
    res.json({ success: true, response: combinedResult });
  } catch (error) {
    console.error('Error processing prompt:', error.message);
    res.status(500).json({ success: false, error: 'Failed to process prompt.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});