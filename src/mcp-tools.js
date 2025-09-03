class MCPTools {
	constructor(cvData, emailService) {
		this.cvData = cvData;
		this.emailService = emailService;
	}

	// Define all available tools
	getToolDefinitions() {
		return [
			{
				name: "get_personal_info",
				description: "Get personal information from CV",
				inputSchema: {
					type: "object",
					properties: {},
					additionalProperties: false,
				},
			},
			{
				name: "get_work_experience",
				description: "Get work experience from CV",
				inputSchema: {
					type: "object",
					properties: {},
					additionalProperties: false,
				},
			},
			{
				name: "get_education",
				description: "Get education information from CV",
				inputSchema: {
					type: "object",
					properties: {},
					additionalProperties: false,
				},
			},
			{
				name: "get_skills",
				description: "Get skills from CV",
				inputSchema: {
					type: "object",
					properties: {},
					additionalProperties: false,
				},
			},
			{
				name: "search_cv",
				description: "Search CV content for specific information",
				inputSchema: {
					type: "object",
					properties: {
						query: {
							type: "string",
							description: "Search query to find information in CV",
						},
					},
					required: ["query"],
					additionalProperties: false,
				},
			},
			{
				name: "query_cv",
				description: "Query CV information by category",
				inputSchema: {
					type: "object",
					properties: {
						category: {
							type: "string",
							enum: ["personal", "experience", "education", "skills", "all"],
							description: "Category of information to retrieve",
						},
						query: {
							type: "string",
							description: "Specific query within the category",
						},
					},
					required: ["category"],
					additionalProperties: false,
				},
			},
			{
				name: "send_email",
				description: "Send email notification",
				inputSchema: {
					type: "object",
					properties: {
						recipient: {
							type: "string",
							format: "email",
							description: "Email address of the recipient",
						},
						subject: {
							type: "string",
							description: "Subject line of the email",
						},
						body: {
							type: "string",
							description: "Body content of the email",
						},
					},
					required: ["recipient", "subject", "body"],
					additionalProperties: false,
				},
			},
		];
	}

	// Execute tools
	async executeTool(toolName, args = {}) {
		try {
			switch (toolName) {
				case "get_personal_info":
					return this.getPersonalInfo();

				case "get_work_experience":
					return this.getWorkExperience();

				case "get_education":
					return this.getEducation();

				case "get_skills":
					return this.getSkills();

				case "search_cv":
					return this.searchCV(args.query);

				case "query_cv":
					return this.queryCV(args.category, args.query);

				case "send_email":
					return this.sendEmail(args.recipient, args.subject, args.body);

				default:
					throw new Error(`Unknown tool: ${toolName}`);
			}
		} catch (error) {
			console.error("Error executing tool:", error.message);
			return {
				error: error.message,
				toolName,
				timestamp: new Date().toISOString(),
			};
		}
	}

	getPersonalInfo() {
		if (!this.cvData || !this.cvData.personal) {
			return { error: "No personal information available" };
		}

		return {
			success: true,
			data: this.cvData.personal,
			summary: `Personal Information: ${
				this.cvData.personal.name || "Name not found"
			}${this.cvData.personal.email ? ` (${this.cvData.personal.email})` : ""}${
				this.cvData.personal.location
					? `, located in ${this.cvData.personal.location}`
					: ""
			}`,
		};
	}

	getWorkExperience() {
		if (
			!this.cvData ||
			!this.cvData.experience ||
			this.cvData.experience.length === 0
		) {
			return { error: "No work experience information available" };
		}

		const experience = this.cvData.experience;
		const latest = experience[0]; // Assuming first is most recent

		return {
			success: true,
			data: experience,
			summary: `Work Experience: Currently ${
				latest.title || "Position not specified"
			} (${latest.period || "Period not specified"}). Total positions: ${
				experience.length
			}`,
			latest: latest,
		};
	}

	getEducation() {
		if (
			!this.cvData ||
			!this.cvData.education ||
			this.cvData.education.length === 0
		) {
			return { error: "No education information available" };
		}

		const education = this.cvData.education;

		return {
			success: true,
			data: education,
			summary: `Education: ${education
				.map(
					(edu) =>
						`${edu.qualification || "Qualification"} from ${
							edu.institution || "Institution"
						} (${edu.period || "Period not specified"})`
				)
				.join("; ")}`,
		};
	}

	getSkills() {
		if (
			!this.cvData ||
			!this.cvData.skills ||
			this.cvData.skills.length === 0
		) {
			return { error: "No skills information available" };
		}

		return {
			success: true,
			data: this.cvData.skills,
			summary: `Skills: ${this.cvData.skills.join(", ")}`,
			count: this.cvData.skills.length,
		};
	}

	searchCV(query) {
		if (!query) {
			return { error: "Search query is required" };
		}

		if (!this.cvData) {
			return { error: "No CV data available for search" };
		}

		const results = {
			query: query,
			matches: [],
			categories: [],
		};

		const searchTerm = query.toLowerCase();

		// Search in personal info
		if (this.cvData.personal) {
			const personalText = JSON.stringify(this.cvData.personal).toLowerCase();
			if (personalText.includes(searchTerm)) {
				results.matches.push({
					category: "personal",
					data: this.cvData.personal,
					relevance: "personal information",
				});
				results.categories.push("personal");
			}
		}

		// Search in experience
		if (this.cvData.experience) {
			this.cvData.experience.forEach((exp, index) => {
				const expText = JSON.stringify(exp).toLowerCase();
				if (expText.includes(searchTerm)) {
					results.matches.push({
						category: "experience",
						data: exp,
						relevance: `work experience #${index + 1}`,
					});
					if (!results.categories.includes("experience")) {
						results.categories.push("experience");
					}
				}
			});
		}

		// Search in education
		if (this.cvData.education) {
			this.cvData.education.forEach((edu, index) => {
				const eduText = JSON.stringify(edu).toLowerCase();
				if (eduText.includes(searchTerm)) {
					results.matches.push({
						category: "education",
						data: edu,
						relevance: `education #${index + 1}`,
					});
					if (!results.categories.includes("education")) {
						results.categories.push("education");
					}
				}
			});
		}

		// Search in skills
		if (this.cvData.skills) {
			const matchingSkills = this.cvData.skills.filter((skill) =>
				skill.toLowerCase().includes(searchTerm)
			);
			if (matchingSkills.length > 0) {
				results.matches.push({
					category: "skills",
					data: matchingSkills,
					relevance: "matching skills",
				});
				results.categories.push("skills");
			}
		}

		// Search in raw text if available
		if (this.cvData.rawText && results.matches.length === 0) {
			const rawText = this.cvData.rawText.toLowerCase();
			if (rawText.includes(searchTerm)) {
				// Extract context around the match
				const index = rawText.indexOf(searchTerm);
				const start = Math.max(0, index - 100);
				const end = Math.min(rawText.length, index + 100);
				const context = this.cvData.rawText.substring(start, end);

				results.matches.push({
					category: "general",
					data: { context: context.trim() },
					relevance: "found in CV text",
				});
				results.categories.push("general");
			}
		}

		return {
			success: true,
			results: results,
			summary:
				results.matches.length > 0
					? `Found ${
							results.matches.length
					  } matches for "${query}" in categories: ${results.categories.join(
							", "
					  )}`
					: `No matches found for "${query}"`,
		};
	}

	queryCV(category, query = "") {
		if (!this.cvData) {
			return { error: "No CV data available" };
		}

		switch (category) {
			case "personal":
				return this.getPersonalInfo();

			case "experience":
				if (query) {
					// Search within experience
					const results = this.searchCV(query);
					const expMatches = results.results.matches.filter(
						(m) => m.category === "experience"
					);
					return {
						success: true,
						data: expMatches,
						summary: `Experience search for "${query}": ${expMatches.length} matches found`,
					};
				}
				return this.getWorkExperience();

			case "education":
				if (query) {
					const results = this.searchCV(query);
					const eduMatches = results.results.matches.filter(
						(m) => m.category === "education"
					);
					return {
						success: true,
						data: eduMatches,
						summary: `Education search for "${query}": ${eduMatches.length} matches found`,
					};
				}
				return this.getEducation();

			case "skills":
				if (query) {
					const matchingSkills = this.cvData.skills
						? this.cvData.skills.filter((skill) =>
								skill.toLowerCase().includes(query.toLowerCase())
						  )
						: [];
					return {
						success: true,
						data: matchingSkills,
						summary: `Skills matching "${query}": ${matchingSkills.join(", ")}`,
					};
				}
				return this.getSkills();

			case "all":
				return {
					success: true,
					data: {
						personal: this.cvData.personal,
						experience: this.cvData.experience,
						education: this.cvData.education,
						skills: this.cvData.skills,
					},
					summary: "Complete CV information retrieved",
				};

			default:
				return { error: `Unknown category: ${category}` };
		}
	}

	async sendEmail(recipient, subject, body) {
		if (!this.emailService) {
			return { error: "Email service not available" };
		}

		const result = await this.emailService.sendEmail(recipient, subject, body);

		return {
			success: result.success,
			data: result,
			summary: result.success
				? `Email sent successfully to ${recipient}`
				: `Failed to send email: ${result.error}`,
		};
	}

	// Helper method to get available information summary
	getAvailableInfo() {
		if (!this.cvData) {
			return { error: "No CV data loaded" };
		}

		const info = {
			personal:
				!!this.cvData.personal && Object.keys(this.cvData.personal).length > 0,
			experience: !!this.cvData.experience && this.cvData.experience.length > 0,
			education: !!this.cvData.education && this.cvData.education.length > 0,
			skills: !!this.cvData.skills && this.cvData.skills.length > 0,
			emailService: !!this.emailService && this.emailService.isConfigured,
		};

		return {
			success: true,
			data: info,
			summary: `Available information: ${Object.entries(info)
				.filter(([key, value]) => value)
				.map(([key]) => key)
				.join(", ")}`,
		};
	}
}

module.exports = MCPTools;
