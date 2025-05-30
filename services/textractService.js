const AWS = require("aws-sdk");
const fs = require("fs");
const path = require("path");
const Tesseract = require("tesseract.js");
const { fromPath } = require("pdf2pic");
const os = require("os");

AWS.config.update({
  region: "ap-south-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const textract = new AWS.Textract();

// OCR fallback using pdf2pic + Tesseract for multi-page PDFs
async function ocrWithTesseract(pdfPath) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ocr-"));
  const convert = fromPath(pdfPath, {
    density: 150,
    savePath: tempDir,
    format: "png",
    width: 1200,
    height: 1600,
  });

  console.log("Converting PDF pages to images...");
  const pageCount = 10; // adjust or detect dynamically
  let textOutput = "";

  for (let page = 1; page <= pageCount; page++) {
    try {
      const imageResult = await convert(page);
      console.log(`Processing page ${page}...`);

      const result = await Tesseract.recognize(imageResult.path, "eng", {
        logger: (m) => console.log(m.status),
      });

      textOutput += result.data.text + "\n";

      // Delete image file
      fs.unlinkSync(imageResult.path);
    } catch (err) {
      console.warn(`Stopped at page ${page} — no more pages or error.`);
      break;
    }
  }

  // Remove temp dir
  fs.rmdirSync(tempDir, { recursive: true });

  return textOutput.trim();
}

// Main extractor with fallback
async function extractTextWithTextract(filePath) {
  const fileData = fs.readFileSync(filePath);
  const params = {
    Document: { Bytes: fileData },
  };

  try {
    const data = await textract.detectDocumentText(params).promise();
    const text = data.Blocks.map((block) => block.Text).join(" ");

    if (!text.trim()) {
      console.warn("Textract returned no text. Falling back to OCR...");
      return await ocrWithTesseract(filePath);
    }

    return text;
  } catch (err) {
    console.error("Textract error:", err.message);
    console.warn("Falling back to OCR...");
    return await ocrWithTesseract(filePath);
  }
}

module.exports = { extractTextWithTextract };
