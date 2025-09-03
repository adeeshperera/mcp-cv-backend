const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");

class CVParser {
	constructor(pdfPath) {
		this.pdfPath = pdfPath;
		this.cvData = null;
	}

	async parseCV() {
		try {
			// Check if PDF exists
			if (!fs.existsSync(this.pdfPath)) {
				throw new Error(`CV file not found at: ${this.pdfPath}`);
			}

			// Read and parse PDF
			const dataBuffer = fs.readFileSync(this.pdfPath);
			const pdfData = await pdf(dataBuffer);
			const text = pdfData.text;

			// Structure the data
			this.cvData = this.structureData(text);

			// Save to JSON file
			await this.saveToJSON();

			return this.cvData;
		} catch (error) {
			console.error("Error parsing CV:", error.message);
			throw error;
		}
	}

	structureData(text) {
		const data = {
			personal: {},
			experience: [],
			education: [],
			skills: [],
			projects: [],
			languages: [],
			memberships: [],
			recommendations: [],
			rawText: text,
		};

		// Extract essential data
		data.personal = this.extractPersonalInfo(text);
		data.experience = this.extractExperience(text);
		data.education = this.extractEducation(text);
		data.skills = this.extractSkills(text);
		data.projects = this.extractProjects(text);
		data.languages = this.extractLanguages(text);
		data.memberships = this.extractMemberships(text);
		data.recommendations = this.extractRecommendations(text);

		return data;
	}

	extractPersonalInfo(text) {
		const personal = {};

		// Simple regex patterns for essential personal info
		const patterns = {
			name: /•\s*Name:\s*([^\n]+)/,
			email: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/,
			phone: /•\s*Phone:\s*([^\n]+)/,
			location: /•\s*Location:\s*([^\n]+)/,
			linkedin: /•\s*LinkedIn:\s*([^\n]+)/,
			github: /•\s*GitHub:\s*([^\n]+)/,
		};

		for (const [key, pattern] of Object.entries(patterns)) {
			const match = text.match(pattern);
			if (match) {
				personal[key] = match[1].trim();
			}
		}

		return personal;
	}

	extractExperience(text) {
		const experience = [];
		const workExpMatch = text.match(
			/Work Experience\s*([\s\S]*?)(?=Education and Training|$)/
		);

		if (workExpMatch) {
			const lines = workExpMatch[1]
				.trim()
				.split("\n")
				.filter((line) => line.trim());

			for (const line of lines) {
				const trimmedLine = line.trim();
				if (trimmedLine && !trimmedLine.startsWith("•")) {
					const parts = trimmedLine.split(" - ");
					experience.push({
						title: parts[0].trim(),
						period: parts[1] ? parts[1].trim() : "Current",
						company: parts[2] ? parts[2].trim() : "Self-employed",
					});
				}
			}
		}

		return experience;
	}

	extractEducation(text) {
		const education = [];
		const eduMatch = text.match(
			/Education and Training\s*([\s\S]*?)(?=Skills|Projects|$)/
		);

		if (eduMatch) {
			const eduSection = eduMatch[1];

			// Extract degree
			const degreeMatch = eduSection.match(
				/(BSc|MSc|BA|MA|PhD)\s*\([^)]*\)[^\n]*/
			);
			if (degreeMatch) {
				const institutionMatch = eduSection.match(
					/•\s*Institution:\s*([^\n]+)/
				);
				const durationMatch = eduSection.match(/•\s*Duration:\s*([^\n]+)/);

				education.push({
					qualification: degreeMatch[0].trim(),
					institution: institutionMatch ? institutionMatch[1].trim() : "",
					duration: durationMatch ? durationMatch[1].trim() : "",
				});
			}

			// Extract certifications (simplified)
			const certMatches = eduSection.match(
				/([A-Z][^•\n]*(?:Essentials|Certification))/g
			);
			if (certMatches) {
				certMatches.forEach((cert) => {
					if (!cert.includes("BSc") && !cert.includes("MSc")) {
						education.push({
							qualification: cert.trim(),
							type: "Certification",
						});
					}
				});
			}
		}

		return education;
	}

	extractSkills(text) {
		const skills = [];
		const skillsMatch = text.match(
			/Skills\s*([\s\S]*?)(?=Projects|Language Skills|$)/
		);

		if (skillsMatch) {
			const skillsText = skillsMatch[1].trim().replace(/\s+/g, " ");
			const skillList = skillsText
				.split(",")
				.map((skill) => skill.trim())
				.filter((skill) => skill.length > 0);
			skills.push(...skillList);
		}

		return skills;
	}

	extractProjects(text) {
		const projects = [];
		const projectsMatch = text.match(
			/Projects\s*([\s\S]*?)(?=Language Skills|Networks and Memberships|$)/
		);

		if (projectsMatch) {
			const projectsSection = projectsMatch[1];
			const projectNames = projectsSection.match(/^[A-Za-z][a-z-]+[a-z]/gm);

			if (projectNames) {
				projectNames.forEach((name) => {
					if (name && !name.includes("http") && name.length > 3) {
						projects.push({
							name: name.trim(),
							description: "",
							links: [],
						});
					}
				});
			}
		}

		return projects;
	}

	extractLanguages(text) {
		const languages = [];
		const languagesMatch = text.match(
			/Language Skills\s*([\s\S]*?)(?=Networks and Memberships|Recommendations|$)/
		);

		if (languagesMatch) {
			const lines = languagesMatch[1]
				.trim()
				.split("\n")
				.filter((line) => line.trim());
			lines.forEach((line) => {
				const trimmedLine = line.trim();
				if (trimmedLine && !trimmedLine.startsWith("•")) {
					languages.push(trimmedLine);
				}
			});
		}

		return languages;
	}

	extractMemberships(text) {
		const memberships = [];
		const membershipsMatch = text.match(
			/Networks and Memberships\s*([\s\S]*?)(?=Recommendations|$)/
		);

		if (membershipsMatch) {
			const lines = membershipsMatch[1]
				.split("\n")
				.filter((line) => line.trim());
			let currentMembership = null;

			lines.forEach((line) => {
				const trimmedLine = line.trim();
				if (trimmedLine && !trimmedLine.startsWith("•")) {
					if (currentMembership) memberships.push(currentMembership);
					currentMembership = { organization: trimmedLine, duration: "" };
				} else if (trimmedLine.includes("Duration:") && currentMembership) {
					currentMembership.duration = trimmedLine
						.replace(/•\s*Duration:\s*/, "")
						.trim();
				}
			});

			if (currentMembership) memberships.push(currentMembership);
		}

		return memberships;
	}

	extractRecommendations(text) {
		const recommendations = [];
		const recommendationsMatch = text.match(/Recommendations\s*([\s\S]*?)$/);

		if (recommendationsMatch) {
			const lines = recommendationsMatch[1]
				.split("\n")
				.filter((line) => line.trim());
			let currentRecommendation = null;

			lines.forEach((line) => {
				const trimmedLine = line.trim();
				if (
					trimmedLine &&
					!trimmedLine.startsWith("•") &&
					!trimmedLine.includes("http")
				) {
					if (currentRecommendation)
						recommendations.push(currentRecommendation);
					currentRecommendation = {
						name: trimmedLine,
						position: "",
						company: "",
					};
				} else if (trimmedLine.startsWith("•") && currentRecommendation) {
					if (trimmedLine.includes("Position:")) {
						currentRecommendation.position = trimmedLine
							.replace(/•\s*Position:\s*/, "")
							.trim();
					} else if (trimmedLine.includes("Company:")) {
						currentRecommendation.company = trimmedLine
							.replace(/•\s*Company:\s*/, "")
							.trim();
					}
				}
			});

			if (currentRecommendation) recommendations.push(currentRecommendation);
		}

		return recommendations;
	}

	async saveToJSON() {
		const jsonPath = path.join(__dirname, "cv-data.json");
		try {
			fs.writeFileSync(jsonPath, JSON.stringify(this.cvData, null, 2));
		} catch (error) {
			console.error("Error saving CV data:", error.message);
			throw error;
		}
	}

	getCVData() {
		return this.cvData;
	}
}

module.exports = CVParser;
