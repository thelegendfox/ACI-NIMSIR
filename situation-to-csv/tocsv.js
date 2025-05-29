const fs = require("fs");
const pdfParse = require("pdf-parse");
const https = require("https");
const path = require("path");
const Ansi = require("./ansi.js");
const csv = require("../node_modules/csv/lib/index.js");
const getPdf = require("./download.js");

const pdfInfo = getPdf();
const oldPdfInfo = getOldPdf();

if (typeof oldPdfInfo !== "undefined") {
	// Checks if the old pdf matches the current one so that you can run it every day without worrying about national PL level
	if (oldPdfInfo.text == pdfInfo.text) {
		//
	}
} else {
	console.warn(
		`${Ansi.BgYellow}${Ansi.Bright}${Ansi.Blink}WARNING:${Ansi.Reset} oldPdfInfo is not set or is undefined.`
	);
}

// Get sitreprt2.pdf
async function getOldPdf() {
	let oldPdf;
	try {
		oldPdf = fs.readFileSync("./downloads/sitreprt2.pdf");
	} catch (e) {
		oldPdf = undefined;
		console.log(e, "File does not exist");
	}
	let pdfInfo;
	pdfParse(oldPdf).then(function (data) {
		pdfInfo = {
			pageNum: data.numpages,
			metadata: data.metadata,
			info: data.info,
			text: data.text,
		};
	});

	return pdfInfo;
}
