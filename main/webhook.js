const fs = require("fs");
const pdfParse = require("pdf-parse");
const Ansi = require("./ansi.js");
const getPdf = require("./download.js");
const secret = require("./secret.json");
const axios = require("axios");

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

SoCal Preparedness Level: \`${socalFireActivity.plLevel}\`.
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

	let nationalFieldInfo = [
		{
			name: "National Preparedness Level",
			value: `\`${nationalPlLevel}\`.`,
			inline: false,
		},
		{
			name: "Initial Attack Activity",
			value: `\`${nationalFireActivity.initialAttackActivity}\`.`,
			inline: false,
		},
		{
			name: "New Large Incidents",
			value: `\`${nationalFireActivity.newLargeIncidents}\`.`,
			inline: true,
		},
		{
			name: "Large Fires Contained",
			value: `\`${nationalFireActivity.largeFiresContained}\`.`,
			inline: true,
		},
		{
			name: "Uncontained Large Fires",
			value: `\`${nationalFireActivity.uncontainedLargeFires}\`.`,
			inline: true,
		},
		{
			name: "CIMTs Committed",
			value: `\`${nationalFireActivity.cimtsCommitted}\`.`,
			inline: true,
		},
		{
			name: "Type 1 IMTs Committed",
			value: `\`${nationalFireActivity.type1ImtsCommitted}\`.`,
			inline: true,
		},
		{
			name: "NIMOs Committed",
			value: `\`${nationalFireActivity.nimosCommitted}\`.`,
			inline: true,
		},
		{
			name: "Notes",
			value: nationalFireActivity.notes,
			inline: false,
		},
		{
			name: "Misc",
			value: nationalFireActivity.postTimes,
			inline: false,
		},
	];

	let socalFieldInfo = [
		{
			name: "SoCal Preparedness Level",
			value: `\`${socalFireActivity.plLevel}\`.`,
			inline: false,
		},
		{
			name: "SoCal New Fires",
			value: `\`${socalFireActivity.newFires}\`.`,
			inline: true,
		},
		{
			name: "SoCal New Large Incidents",
			value: `\`${socalFireActivity.newLargeIncidents}\`.`,
			inline: true,
		},
		{
			name: "SoCal Uncontained Large Fires",
			value: `\`${socalFireActivity.uncontainedLargeFires}\`.`,
			inline: true,
		},
		{
			name: "Misc",
			value: `${socalFireActivity.fireDetails.trim()}`,
			inline: false,
		},
	];

	let misc = {
		weather: weather,
		smfs: sixMinutesForSafety,
		links: links,
		dutyOfficer: "None",
		nationalPlLevel: nationalPlLevel,
	};

	console.log(content1.length, content2.length, content3.length);
	console.log(nationalFireActivity.postTimes);

	post(
		"<@&1379139175399428207>",
		nationalFieldInfo,
		socalFieldInfo,
		misc,
		secret.thumbnailImage,
		secret.webhook
	);
})();

async function post(
	content,
	nationalFieldInfo,
	socalFieldInfo,
	misc,
	thumbnail,
	webhook
) {
	const getTimestamp = (timestamp = Date.now()) =>
		`<t:${Math.round(timestamp / 1000)}:F>`;
	let mainEmbedText = `
Good morning! It's currently ${getTimestamp()}.

## Duty Officer: \`${misc.dutyOfficer}\`

Resource Availability:
Interagency Resources: None available.
Mutual Aid Resources: None available.
Complex Incident Management Team(s): None available.

Please see the \`Misc\` section of the Morning Report for resources and fire information.
	
-# Morning Report automatically created & sent with @jadedcrown's [SITREPRT](https://github.com/thelegendfox/SITREPRT-Hook) based on the [NIFC Incident Mangement Situation Report](https://www.nifc.gov/nicc-files/sitreprt.pdf).
	`;

	const wholeWeather = await getWeather(34.54167, -119.80917); // los padres national forest coords

	const getDetailedWeather = (num) => {
		return wholeWeather.find((i) => i.number === num);
	};
	console.log(wholeWeather.find((i) => i.number === 1));

	let weather = [];

	// if (misc.nationalPlLevel.includes("1")) {
	for (let i = 0; i < 15; i++) {
		let forecast = getDetailedWeather(i);
		if (!forecast) {
			console.log(i);
			continue;
		}
		weather.push([
			{
				day: forecast.name,
				detailedForecast: forecast.detailedForecast,
			},
		]);
	}
	// }
	console.log("\n\n");
	console.log(weather);

	let message = JSON.stringify({
		content: content, // if you don't want any of these values, make them null
		embeds: [
			{
				title: "Hellfire Helibase ~ Morning Report",
				thumbnail: { url: thumbnail },

				description: mainEmbedText,
				color: 7340032,
				footer: {
					text: `Hellfire Helibase`,
				},
			},
			{
				title: "Hellfire Helibase ~ National Fire Information",
				fields: nationalFieldInfo,
				color: 7340032,
				footer: {
					text: `Hellfire Helibase`,
				},
			},
			{
				title: "Hellfire Helibase ~ SoCal Fire Information",
				fields: socalFieldInfo,
				color: 7340032,
				footer: {
					text: `Hellfire Helibase`,
				},
			},
			{
				title: "Hellfire Helibase ~ Misc",
				description: `
## Fire Information

[Forest Alerts and Fire Danger Status](<https://www.fs.usda.gov/r05/lospadres/alerts>)

## Other Resources

[2025 Incident Response Pocket Guide](<https://fs-prod-nwcg.s3.us-gov-west-1.amazonaws.com/s3fs-public/publication/pms461.pdf?VersionId=5jVfeVueiTHKLajwBHssv7sEh4Gv2QFm>)
[Incident Commander's Organizer](<https://fs-prod-nwcg.s3.us-gov-west-1.amazonaws.com/s3fs-public/publication/pms206.pdf?VersionId=r2vd.HpKEspr1FtuIpFM8YRNbM7.WuW2>)
[Initial Attack Fire Size Up](<https://gacc.nifc.gov/nrcc/dc/mtmdc/Forms/Dispatch/MDC%20IA%20Size%20Up%20Form%20(Fillable).pdf>)

# **__Six Minutes for Safety__**
The Six Minutes for Safety topic of the day is [${misc.sixMinutesForSafety}](${misc.links.sixMinutesForSafety})
				`,
				color: 7340032,
				footer: {
					text: `Hellfire Helibase`,
				},
			},
			{
				title: "Storm Prediction Center ~ Convective Outlook",
				image: {
					url: "https://www.spc.noaa.gov/products/outlook/day1otlk_1300.gif",
				},
				color: 7340032,
				footer: {
					text: `Hellfire Helibase`,
				},
			},
			{
				title: "Storm Prediction Center ~ Fire Weather Outlook",
				image: {
					url: "https://www.spc.noaa.gov/products/fire_wx/day1fireotlk-overview.gif",
				},
				color: 7340032,
				footer: {
					text: `Hellfire Helibase`,
				},
			},
		],
	});

	// sendWebhook(webhook, message);
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

async function getWeather(lat, lon) {
	try {
		const headers = { "User-Agent": "email@example.com" };

		const pointUrl = `https://api.weather.gov/points/${lat},${lon}`;
		const pointRes = await axios.get(pointUrl, { headers });
		const forecastUrl = pointRes.data.properties.forecast;

		const forecastRes = await axios.get(forecastUrl, { headers });

		return forecastRes.data.properties.periods;
	} catch (error) {
		console.error("Error:", error.message);
	}
}
