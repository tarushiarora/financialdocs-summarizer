require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { extractTextWithTextract } = require('./services/textractService');
const { analyzeDocument } = require('./services/openaiService');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });
app.post("/api/analyze", upload.single("file"), async (req, res) => {
  const filePath = req.file.path;
  console.log("File details:", {
    path: filePath,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });

  try {
    const text = await extractTextWithTextract(filePath);
    const analysis = await analyzeDocument(text);

    res.json({ success: true, analysis });
  } catch (err) {
    console.error("Error in /api/analyze:", err);
    res.status(500).json({ error: err.message });
  } finally {
    // ✅ Always try to delete file even if there was an error
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted uploaded file: ${filePath}`);
      }
    } catch (unlinkErr) {
      console.warn("Could not delete uploaded file:", unlinkErr.message);
    }
  }
});


// app.post('/api/analyze', upload.single('file'), async (req, res) => {
//   try {
//     const filePath = req.file.path;
//     console.log('File details:', {
//       path: filePath,
//       size: req.file.size,
//       mimetype: req.file.mimetype
//     });
//     const text = await extractTextWithTextract(filePath);

//     const analysis = await analyzeDocument(text);

//     // Clean up uploaded file
//     fs.unlinkSync(filePath);

//     res.json({ success: true, analysis });
//   } catch (err) {
//     console.error("Error in /api/analyze:", err);
//     res.status(500).json({ error: err.message });
//   }
// });


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));