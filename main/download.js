/**
 * Takes a PDF, downloads it to the system, and parses its pagenum, metadata, info, and text.
 *
 * @param {string} link A direct link to fetch the PDF from. Default the NIFC sitreprt. By default, overwrites any previously saved PDFs.
 * @param {string} directory The directory to save the downloaded PDF to. By default, makes/uses a ./downloads/ directory.
 * @returns {object}
 */

const getPdf = async function downloadAndParsePDF(
	link = "https://www.nifc.gov/nicc-files/sitreprt.pdf",
	directory = "./downloads/"
) {
	const fs = require("fs");
	const pdf = require("pdf-parse");
	const https = require("https");
	const path = require("path");
	try {
		console.log("Downloading PDF...");

		let response;

		// Download the PDF

		try {
			response = await fetch(link);

			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			} else {
				console.log("PDF successfully downloaded.");
			}
		} catch (e) {
			console.error(
				`${Ansi.BgRed}${Ansi.Bright}${Ansi.Blink}ERROR:${Ansi.Reset} Could not download PDF.`,
				e
			);
			return {
				pageNum: "",
				metadata: "",
				info: "",
				text: "",
			};
		}

		const arrayBuffer = await response.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		const downloadDir = directory;
		if (!fs.existsSync(downloadDir)) {
			fs.mkdirSync(downloadDir, { recursive: true });
		}

		const filePath = path.join(downloadDir, "sitreprt.pdf");
		fs.writeFileSync(filePath, buffer);
		console.log(`PDF saved to: ${filePath}`);

		console.log("Parsing PDF...");
		const data = await pdf(buffer);

		// console.log("=== PDF INFO ===");
		// console.log(`Number of pages: ${data.numpages}`);
		// console.log(`Number of rendered pages: ${data.numrender}`);
		// console.log("PDF info:", data.info);
		// console.log("PDF metadata:", data.metadata);
		// console.log("PDF.js version:", data.version);
		// console.log("\n=== PDF TEXT ===");
		// console.log(data.text);

		const pdfInfo = {
			pageNum: data.numpages,
			metadata: data.metadata,
			info: data.info,
			text: data.text,
		};

		return pdfInfo;
	} catch (error) {
		console.error("Error downloading or parsing PDF:", error);
	}
};

module.exports = getPdf;
