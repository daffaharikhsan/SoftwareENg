const { spawn } = require("child_process");
const fs = require("fs");
const PDFDocument = require("pdfkit");

// Nama file output
const JSON_RESULT = "test-results.json";
const PDF_REPORT = "Laporan_Testing_NextJS.pdf";

console.log("🚀 Menjalankan Testing Next.js...");

// 1. JALANKAN JEST
// Kita minta Jest output format JSON ke file
const jest = spawn("npx", ["jest", "--json", `--outputFile=${JSON_RESULT}`], {
  shell: true,
});

jest.on("close", (code) => {
  console.log("✅ Testing selesai. Membuat PDF...");
  generatePDF();
});

// 2. FUNGSI GENERATE PDF
function generatePDF() {
  // Baca hasil JSON dari Jest
  let testData;
  try {
    const rawData = fs.readFileSync(JSON_RESULT);
    testData = JSON.parse(rawData);
  } catch (e) {
    console.error("Gagal membaca hasil test JSON. Pastikan test berjalan.");
    return;
  }

  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(PDF_REPORT));

  // --- HEADER ---
  doc.fontSize(18).text("Laporan Testing Next.js", { align: "center" });
  doc.moveDown();
  doc
    .fontSize(10)
    .text(`Tanggal: ${new Date().toLocaleString()}`, { align: "center" });
  doc.moveDown(2);

  // --- SUMMARY ---
  const totalTests = testData.numTotalTests;
  const passedTests = testData.numPassedTests;
  const failedTests = testData.numFailedTests;

  doc.fontSize(12).text(`Total Test Case: ${totalTests}`);
  doc.fillColor("green").text(`Sukses (Passed): ${passedTests}`);

  if (failedTests > 0) {
    doc.fillColor("red").text(`Gagal (Failed): ${failedTests}`);
  } else {
    doc.fillColor("black").text(`Gagal (Failed): ${failedTests}`);
  }
  doc.fillColor("black");
  doc.moveDown(2);

  // --- DETAIL ---
  doc.fontSize(14).text("Detail Pengujian:", { underline: true });
  doc.moveDown();

  testData.testResults.forEach((suite) => {
    // Nama File Test
    const fileName = suite.name.split("/").pop(); // Ambil nama file saja
    doc.fontSize(12).font("Helvetica-Bold").text(`File: ${fileName}`);

    suite.assertionResults.forEach((assertion) => {
      const status = assertion.status; // 'passed' atau 'failed'
      const title = assertion.title;

      if (status === "passed") {
        doc
          .fontSize(10)
          .font("Helvetica")
          .fillColor("green")
          .text(`[PASSED] ${title}`, { indent: 20 });
      } else {
        doc
          .fontSize(10)
          .font("Helvetica")
          .fillColor("red")
          .text(`[FAILED] ${title}`, { indent: 20 });

        // Tulis pesan error jika gagal
        if (assertion.failureMessages) {
          doc
            .fontSize(8)
            .font("Courier")
            .fillColor("black")
            .text(assertion.failureMessages[0].split("\n")[0], { indent: 30 }); // Ambil baris pertama error saja agar rapi
        }
      }
      doc.moveDown(0.5);
    });
    doc.moveDown(1);
  });

  // --- CLEANUP ---
  doc.end();

  // Hapus file JSON sementara agar bersih
  try {
    fs.unlinkSync(JSON_RESULT);
  } catch (e) {}

  console.log(`📄 Laporan PDF siap: ${PDF_REPORT}`);
}
