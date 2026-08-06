const fs = require('fs');
const path = require('path');
const https = require('https');

const modelsDir = path.join(__dirname, '..', 'public', 'models');
const modelPath = path.join(modelsDir, 'beatnet.onnx');

// Direct HuggingFace BeatNet CRNN ONNX model URL
const MODEL_URL = 'https://huggingface.co/models/BeatNet/resolve/main/beatnet.onnx';

async function downloadModel() {
  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
  }

  console.log(`Downloading BeatNet ONNX model from ${MODEL_URL}...`);

  const file = fs.createWriteStream(modelPath);
  
  const request = (url) => {
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle HuggingFace redirect
        return request(response.headers.location);
      }
      
      if (response.statusCode !== 200) {
        console.error(`Failed to download model: HTTP ${response.statusCode}`);
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`BeatNet ONNX model saved successfully to ${modelPath}`);
      });
    }).on('error', (err) => {
      fs.unlink(modelPath, () => {});
      console.error(`Error downloading BeatNet model: ${err.message}`);
    });
  };

  request(MODEL_URL);
}

downloadModel();
