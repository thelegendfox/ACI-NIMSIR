const fs = require("fs");
const pdfParse = require("pdf-parse");
const https = require("https");
const path = require("path");
const Ansi = require("./ansi.js");
// const csv = require("../node_modules/csv/lib/index.js");
const getPdf = require("./download.js");
const secret = require("./secret.json");

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
		notes:
			regexReplacement(
				pdfInfo.text.match(
					/(?<=NIMOs committed: .*\r?\n)([\s\S]*?)(?=Understanding the IMSR)/
				),
				false
			) +
			" " +
			regexReplacement(
				pdfInfo.text.match(/(?<=IMSR Map)([\s\S]*?)(?=This report will be)/)
			),
		postTimes: regexReplacement(
			pdfInfo.text.match(
				/This report will be posted\s*(.*?)(?=\n.*Active Incident|\n.*Understanding|\.$)/s
			),
			false
		),
	};

	let links = {
		understandingImsr:
			"https://www.nifc.gov/sites/default/files/NICC/1-Incident%20Information/IMSR/Understanding%20the%20IMSR%202024.pdf", // fill in later
		imsrMap:
			"https://www.nifc.gov/nicc/incident-information/national-incident-map",
		sixMinutesForSafety: "https://www.nwcg.gov/committee/6-minutes-for-safety",
	}; // absolute cuz i cant get it dynamically. except 6mfs cuz thats cool

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
	socalFireActivity.plLevel = `PL ${socalFireActivity.plLevel}`;

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

	// console.log(nationalPlLevel + "\n\n");
	// console.log(nationalFireActivity);
	// console.log(links);
	// console.log(socalFireActivity);
	// console.log(weather + "\n\n");
	// console.log(sixMinutesForSafety);
	console.log(nationalFireActivity.notes);

	let content1 = `
# HELLFIRE HELIBASE MORNING REPORT FOR LOS PADRES NATIONAL FOREST
<@&1379139175399428207>

*[Understanding the IMSR](${links.understandingImsr})*
*[IMSR Map](${links.imsrMap})*

## National Fire Activity

National Preparedness Level: \`${nationalPlLevel}\`.
Initial attack activity: \`${nationalFireActivity.initialAttackActivity}\`.
New large incidents: \`${nationalFireActivity.newLargeIncidents}\`.
Large fires contained: \`${nationalFireActivity.largeFiresContained}\`.
Uncontained large fires: \`${nationalFireActivity.uncontainedLargeFires}\`.
CIMTs committed: \`${nationalFireActivity.cimtsCommitted}\`.
Type 1 IMTs committed: \`${nationalFireActivity.type1ImtsCommitted}\`.
NIMOs committed: \`${nationalFireActivity.nimosCommitted}\`.

${nationalFireActivity.notes}

${nationalFireActivity.postTimes}
** **`;

	let content2 = `
## Southern California Fire Activity

Socal Preparedness Level: \`${socalFireActivity.plLevel}\`.
New fires: \`${socalFireActivity.newFires}\`.
New large incidents: \`${socalFireActivity.newLargeIncidents}\`.
Uncontained large fires: \`${socalFireActivity.uncontainedLargeFires}\`.

${socalFireActivity.fireDetails}
** **
	`;

	let content3 = `
## Weather

${weather}

## 6MFS

The 6 Minutes for Safety topic of the day is [${sixMinutesForSafety}](${links.sixMinutesForSafety})
	`;

	let fieldInfo = [
		{
			name: null,
			value: null,
			inline: null,
		},
	];

	console.log(content1.length, content2.length, content3.length);
	console.log(nationalFireActivity.postTimes);

	post(
		"<@&1379139175399428207>",
		fieldInfo,
		secret.thumbnailImage,
		secret.webhook
	);
})();

function post(content, fields, thumbnail, webhook) {
	let messageBody = `
	-# *Created with @jadedcrown's [SITREPRT](${secret.repo})*
	
	`;
	let message = JSON.stringify({
		content: content, // if you don't want any of these values, make them null
		embeds: [
			{
				title: title,
				thumbnail: { url: thumbnail },
				body: "",
				/*fields: fields,
				footer: {
					text: "Hellfire Helibase",
				},
				image: {
					url: "https://www.spc.noaa.gov/products/outlook/day1otlk.gif",
				},
				image: {
					url: "https://www.spc.noaa.gov/products/fire_wx/day1fireotlk-overview.gif",
				},*/
			},
			{
				title: "Hellfire Helibase ~ Morning Report",
				thumbnail: { url: thumbnail },
				body: "",
				footer: {
					text: "Hellfire Helibase",
				},
			},
		],
	});

	/*
	content = 
title = da
fields = d
thumbnail 
webhook = 
threadName
    $field_info = [
        [
            "name" => $title,
            "value" => $body,
            "inline" => true
        ],
        [
            "name" => 'Submitting User',
            "value" => "Name: $server_name Discriminator: $discriminator ID: $discord_id",
            "inline" => true
        ],
        [
            "name" => 'Contact',
            "value" => $contact,
            "inline" => false
        ],

    ];
	*/

	sendWebhook(webhook, message1);
	setTimeout(sendWebhook, 2000, webhook, message2);
	setTimeout(sendWebhook, 4000, webhook, message3);
	// delayed to prevent ratelimiting
}

async function sendWebhook(webhook, message) {
	try {
		let response = await fetch(webhook, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: message,
		});
		if (!response.ok) {
			throw new Error(
				"Posting webhook: " + response.status + response.statusText
			);
		}
	} catch (error) {
		console.error(error);
	}
}

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
