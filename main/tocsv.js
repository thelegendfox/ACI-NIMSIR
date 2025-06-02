const fs = require("fs");
const pdfParse = require("pdf-parse");
const https = require("https");
const path = require("path");
const Ansi = require("./ansi.js");
const csv = require("../node_modules/csv/lib/index.js");
const getPdf = require("./download.js");

let overwrite = true; // Overwrites posting oldpdfinfo

(async function main() {
	const pdfInfo = await getPdf();
	const oldPdfInfo = await getOldPdf();

	// Checks if the old pdf matches the current one so that you can run it every day without worrying about national PL level
	if (oldPdfInfo.text == pdfInfo.text && overwrite == false) {
		console.log(
			"As oldPdfInfo is the same as pdfInfo, all further processes were ignored."
		);
		return;
	} else {
		if (overwrite == true) {
			console.warn(
				`${Ansi.BgYellow}${Ansi.Bright}${Ansi.Blink}WARNING:${Ansi.Reset} The overwrite system for oldPdfInfo is on.`
			);
		}

		function regexReplacement(item, integer = true) {
			return item?.[0]?.replace(/\s+/g, " ").trim() || null;
		}
	}

	let nationalPlLevel = regexReplacement(
		pdfInfo.text.match(/(?<=National Preparedness Level )([\s\S]*?)(?=\r?\n)/)
	);
	nationalPlLevel = `PL ${nationalPlLevel}`;

	let nationalFireActivity = {
		// I know it's ugly, too bad
		initialAttackActivity: regexReplacement(
			pdfInfo.text.match(
				/(?<=Initial attack activity: )([\s\S]*?)(?=New large)/
			),
			false
		),
		newLargeIncidents: regexReplacement(
			pdfInfo.text.match(/(?<=New large incidents: )([\s\S]*?)(?=Large fires)/)
		),
		largeFiresContained: regexReplacement(
			pdfInfo.text.match(
				/(?<=Large fires contained: )([\s\S]*?)(?=Uncontained large)/
			)
		),
		uncontainedLargeFires: regexReplacement(
			pdfInfo.text.match(
				/(?<=Uncontained large fires: )([\s\S]*?)(?=CIMTs committed:)/
			)
		),
		cimtsCommitted: regexReplacement(
			pdfInfo.text.match(/(?<=CIMTs committed: )([\s\S]*?)(?=\r?\n)/)
		),
		type1ImtsCommitted: regexReplacement(
			pdfInfo.text.match(/(?<=Type 1 IMTs committed: )([\s\S]*?)(?=\r?\n)/)
		),
		nimosCommitted: regexReplacement(
			pdfInfo.text.match(/(?<=NIMOs committed: )([\s\S]*?)(?=\r?\n)/)
		),
		notes: regexReplacement(
			pdfInfo.text.match(
				/(?<=NIMOs committed: .*\r?\n)([\s\S]*?)(?=Understanding the IMSR)/
			),
			false
		), // Before Understanding the IMSR, after NIMOs
	};

	let links = {
		understandingImsr:
			"https://www.nifc.gov/sites/default/files/NICC/1-Incident%20Information/IMSR/Understanding%20the%20IMSR%202024.pdf", // fill in later
		imsrMap:
			"https://www.nifc.gov/nicc/incident-information/national-incident-map",
		sixMinutesForSafety:
			"https://www.nwcg.gov/6-minutes-for-safety/topics/all?title=",
	}; // absolute cuz i cant get it dynamically. except 6mfs cuz thats cool

	let notes = regexReplacement(
		pdfInfo.text.match(
			/(?<=IMSR Map)([\s\S]*?)(?=Active Incident Resource Summary)/
		),
		false
	);

	let socalFireActivity = {
		plLevel: regexReplacement(
			pdfInfo.text.match(/(?<=Southern California Area \(PL )([\s\S]*?)(?=\))/)
		),
		newFires: regexReplacement(
			pdfInfo.text.match(/(?<=New fires:\s*)([\s\S]*?)(?=\r?\n)/)
		),
		newLargeIncidents: regexReplacement(
			pdfInfo.text.match(
				/(?<=Southern California Area[\s\S]*?New large incidents:\s*)([\s\S]*?)(?=\r?\n)/
			)
		),
		uncontainedLargeFires: regexReplacement(
			pdfInfo.text.match(
				/(?<=Southern California Area[\s\S]*?Uncontained large fires:\s*)([\s\S]*?)(?=\r?\n)/
			)
		),
		fireDetails: regexReplacement(
			pdfInfo.text.match(
				/(?<=Southern California Area[\s\S]*?Uncontained large fires:\s*\d+\s*\r?\n\s*\r?\n)([\s\S]*?)(?=\r?\n\s*Incident Name)/
			),
			false
		),
	};

	let weather = regexReplacement(
		pdfInfo.text.match(
			/(?<=Predictive Services Discussion:)([\s\S]*?)(?=National Predictive Services Outlook)/
		),
		false
	);

	let sixMinutesForSafety = regexReplacement(
		pdfInfo.text.match(
			/(?<=The 6 Minutes for Safety topic of the day is)([\s\S]*?)(?=\r?\n)/
		),
		false
	); // replace ' ' with + to add to the link

	links.sixMinutesForSafety +=
		sixMinutesForSafety.replace(/\s+/g, "+").replace(/-/g, "–").trim() ||
		"https://www.example.com";

	console.log(nationalPlLevel + "\n\n");
	console.log(nationalFireActivity);
	console.log(links);
	console.log(notes + "\n\n");
	console.log(socalFireActivity);
	console.log(weather + "\n\n");
	console.log(sixMinutesForSafety);

	csv.generate({
		delimiter: "|",
		length: 1,
	}).pipe; // PL level
})();

// Get sitreprt2.pdf
async function getOldPdf() {
	let oldPdf, pdfInfo;
	try {
		oldPdf = fs.readFileSync("./downloads/sitreprt2.pdf");
	} catch (e) {
		oldPdf = {
			pageNum: "",
			metadata: "",
			info: "",
			text: "",
		};
		console.warn(
			e,
			`${Ansi.BgYellow}${Ansi.Bright}${Ansi.Blink}WARNING:${Ansi.Reset} sitreprt2.pdf was not found and its values have been set to empty strings.`
		);
		return oldPdf;
	}

	try {
		const data = await pdfParse(oldPdf);
		return {
			pageNum: data.numpages,
			metadata: data.metadata,
			info: data.info,
			text: data.text,
		};

		// pdfParse(oldPdf).then(function (data) {
		// 	pdfInfo =
		// });

		// return pdfInfo;
	} catch (e) {
		console.warn(
			`${Ansi.BgYellow}${Ansi.Bright}${Ansi.Blink}WARNING:${Ansi.Reset} There was an error parsing sitreprt2 and its values have been set to empty strings.`
		);
		return {
			pageNum: "",
			metadata: "",
			info: "",
			text: "",
		};
	}
}
