const Tesseract = require("tesseract.js");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

function findImages(dir, images = []) {
	const items = fs.readdirSync(dir);
	for (const item of items) {
		const fullPath = path.join(dir, item);
		const stat = fs.statSync(fullPath);
		if (stat.isDirectory()) {
			findImages(fullPath, images);
		} else if (/\.(png|jpg|jpeg)$/i.test(item)) {
			images.push(fullPath);
		}
	}
	return images;
}

function parseTradingData(text) {
	const lowerText = text.toLowerCase();

	const patterns = {
		entry: /(?:entry|buy|long)\s*:?\s*([\d.]+)/i,
		exit: /(?:exit|sell)\s*:?\s*([\d.]+)/i,
		target: /(?:target|tp|take profit)\s*:?\s*([\d.]+)/i,
		stoploss: /(?:stoploss|sl|stop loss)\s*:?\s*([\d.]+)/i,
	};

	const result = { entry: "", exit: "", target: "", stoploss: "" };

	for (const [key, pattern] of Object.entries(patterns)) {
		const match = text.match(pattern);
		result[key] = match ? match[1] : "";
	}

	if (!result.entry && !result.target && !result.stoploss) {
		const numberPattern = /([\d.]+)/g;
		const numbers = text.match(numberPattern);
		if (numbers && numbers.length >= 3) {
			result.entry = numbers[0] || "";
			result.target = numbers[1] || "";
			result.stoploss = numbers[2] || "";
		}
	}

	return result;
}

async function extractFromImage(imagePath) {
	console.log(`Processing: ${path.basename(imagePath)}`);

	try {
		const {
			data: { text },
		} = await Tesseract.recognize(imagePath, "eng", {
			logger: (m) => {
				if (m.status === "recognizing text") {
					process.stdout.write(".");
				}
			},
		});
		console.log("\nExtracted text:", text.trim().substring(0, 200));

		const tradingData = parseTradingData(text);
		console.log("Parsed:", tradingData);

		return {
			"image-name": path.basename(imagePath),
			...tradingData,
		};
	} catch (error) {
		console.error(`Error processing ${imagePath}:`, error.message);
		return {
			"image-name": path.basename(imagePath),
			entry: "",
			exit: "",
			target: "",
			stoploss: "",
		};
	}
}

async function main() {
	const savedDir = path.join(__dirname, "saved");

	if (!fs.existsSync(savedDir)) {
		console.log("No saved directory found");
		return;
	}

	const images = findImages(savedDir);
	console.log(`Found ${images.length} images\n`);

	const results = [];
	for (const image of images) {
		const result = await extractFromImage(image);
		results.push(result);
	}

	const worksheet = XLSX.utils.json_to_sheet(results);
	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, worksheet, "Trading Data");

	const outputPath = path.join(__dirname, "trading_data.xlsx");
	XLSX.writeFile(workbook, outputPath);
	console.log(`\nExcel file saved to: ${outputPath}`);
}

main();
