import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import PDFDocument from "pdfkit";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

const uploadFolder = "./uploads";
const pdfFolder = "./pdf";

if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);
if (!fs.existsSync(pdfFolder)) fs.mkdirSync(pdfFolder);

const storage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, uploadFolder),
  filename: (req, file, callback) =>
    callback(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

const header = (doc) => {
  doc.fontSize(20).fillColor("#0c7cd6").text("DERATIT - Rapport d’intervention", 40, 20);
  doc.moveTo(40, 50).lineTo(550, 50).stroke("#0c7cd6");
};

const footer = (doc, pageNumber) => {
  doc.fontSize(10).fillColor("#666").text(`Page ${pageNumber}`, 40, 760, {
    align: "center",
  });
};

const addProPage = (doc, pageNumber) => {
  if (pageNumber > 1) doc.addPage();
  header(doc);
  footer(doc, pageNumber);
  doc.moveDown(3);
};

app.post(
  "/api/rapports",
  upload.fields([
    { name: "photosAvant", maxCount: 10 },
    { name: "photosApres", maxCount: 10 },
    { name: "signatureClient", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const data = req.body;
      const photosAvant = req.files["photosAvant"] || [];
      const photosApres = req.files["photosApres"] || [];
      const signatureClient = req.files["signatureClient"]?.[0];

      const pdfName = `rapport-${Date.now()}.pdf`;
      const pdfPath = path.join(pdfFolder, pdfName);

      const doc = new PDFDocument({ margin: 40 });
      const writeStream = fs.createWriteStream(pdfPath);
      doc.pipe(writeStream);

      let page = 1;
      addProPage(doc, page);

      doc.fontSize(16).text("Informations de l’intervention", { underline: true });
      doc.moveDown(1);

      Object.keys(data).forEach((key) => {
        doc.font("Helvetica-Bold").text(`${key} : `, { continued: true }).font("Helvetica").text(data[key]);
      });

      page++;
      addProPage(doc, page);
      doc.fontSize(16).text("📸 Photos AVANT", { underline: true });
      doc.moveDown();
      for (let f of photosAvant) {
        doc.image(f.path, { fit: [450, 300] });
        doc.moveDown(1);
      }

      if (photosApres.length > 0) {
        page++;
        addProPage(doc, page);
        doc.fontSize(16).text("📸 Photos APRÈS", { underline: true });
        doc.moveDown();
        for (let f of photosApres) {
          doc.image(f.path, { fit: [450, 300] });
          doc.moveDown(1);
        }
      }

      if (signatureClient) {
        page++;
        addProPage(doc, page);
        doc.fontSize(16).text("✍️ Signature du client", { underline: true });
        doc.moveDown(2);
        doc.image(signatureClient.path, { fit: [300, 150] });
      }

      doc.end();

      writeStream.on("finish", () => {
        res.json({
          message: "PDF généré avec succès !",
          pdfUrl: `http://localhost:4000/pdf/${pdfName}`,
        });
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur PDF" });
    }
  }
);

app.use("/pdf", express.static("pdf"));

app.listen(4000, () => {
  console.log("API backend opérationnelle sur http://localhost:4000");
});
