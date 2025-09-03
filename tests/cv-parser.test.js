const CVParser = require("../src/cv-parser");
const fs = require("fs");
const path = require("path");

// Mock pdf-parse
jest.mock("pdf-parse", () => {
	return jest.fn(() =>
		Promise.resolve({
			text: `
Contact Information
• Name: John Doe
• Phone: (+1) 555-0123
• Email: john.doe@example.com
• Location: New York, USA

Work Experience
Software Developer - Current

Education and Training
BSc (Hons) Computer Science
• Institution: MIT
• Duration: 2020 – 2024

Skills
JavaScript, React, Node.js, Python
`,
		})
	);
});

describe("CVParser", () => {
	let parser;
	const testPdfPath = path.join(__dirname, "test-cv.pdf");

	beforeEach(() => {
		// Create a mock PDF file
		if (!fs.existsSync(testPdfPath)) {
			fs.writeFileSync(testPdfPath, "mock pdf content");
		}
		parser = new CVParser(testPdfPath);
	});

	afterEach(() => {
		// Clean up test files
		if (fs.existsSync(testPdfPath)) {
			fs.unlinkSync(testPdfPath);
		}
		const jsonPath = path.join(__dirname, "../src/cv-data.json");
		if (fs.existsSync(jsonPath)) {
			fs.unlinkSync(jsonPath);
		}
	});

	test("should parse CV and extract personal information", async () => {
		const result = await parser.parseCV();

		expect(result.personal.name).toBe("John Doe");
		expect(result.personal.email).toBe("john.doe@example.com");
		expect(result.personal.phone).toBe("(+1) 555-0123");
		expect(result.personal.location).toBe("New York, USA");
	});

	test("should extract work experience", async () => {
		const result = await parser.parseCV();

		expect(result.experience).toHaveLength(1);
		expect(result.experience[0].title).toBe("Software Developer");
		expect(result.experience[0].period).toBe("Current");
	});

	test("should extract education information", async () => {
		const result = await parser.parseCV();

		expect(result.education).toHaveLength(1);
		expect(result.education[0].qualification).toBe(
			"BSc (Hons) Computer Science"
		);
		expect(result.education[0].institution).toBe("MIT");
		expect(result.education[0].duration).toBe("2020 – 2024");
	});

	test("should extract skills as array", async () => {
		const result = await parser.parseCV();

		expect(result.skills).toEqual(["JavaScript", "React", "Node.js", "Python"]);
		expect(result.skills).toHaveLength(4);
	});
});
