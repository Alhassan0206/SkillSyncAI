import OpenAI from "openai";
import type { JobSeeker, Job, Match, LearningPlan } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
// OpenAI client is optional - AI features will return mock data if not configured
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function isAIEnabled(): boolean {
  return openai !== null;
}

interface MatchResult {
  matchScore: number;
  matchingSkills: string[];
  gapSkills: string[];
  explanation: string;
  aiMetadata?: any;
}

interface SkillGapAnalysis {
  currentSkills: string[];
  targetSkills: string[];
  gapSkills: string[];
  matchingSkills: string[];
  recommendations: string[];
}

interface LearningRoadmap {
  skill: string;
  priority: "high" | "medium" | "low";
  estimatedTime: string;
  resources: Array<{ title: string; url: string; type: string }>;
}

export class AIService {
  async analyzeJobMatch(jobSeeker: JobSeeker, job: Job): Promise<MatchResult> {
    // Return mock data if OpenAI is not configured
    if (!openai) {
      const candidateSkills = jobSeeker.skills || [];
      const requiredSkills = job.requiredSkills || [];
      const matchingSkills = candidateSkills.filter(s =>
        requiredSkills.some(r => r.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(r.toLowerCase()))
      );
      const gapSkills = requiredSkills.filter(s =>
        !candidateSkills.some(c => c.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(c.toLowerCase()))
      );
      const matchScore = requiredSkills.length > 0
        ? Math.round((matchingSkills.length / requiredSkills.length) * 100)
        : 50;

      return {
        matchScore,
        matchingSkills,
        gapSkills,
        explanation: `Basic skill matching (AI not configured). ${matchingSkills.length} of ${requiredSkills.length} required skills matched.`,
        aiMetadata: { strengths: matchingSkills, concerns: gapSkills },
      };
    }

    const prompt = `Analyze the match between this candidate and job posting.

Candidate Profile:
- Current Role: ${jobSeeker.currentRole || "Not specified"}
- Skills: ${jobSeeker.skills?.join(", ") || "None listed"}
- Experience: ${jobSeeker.experience || "Not specified"}
- Bio: ${jobSeeker.bio || "Not provided"}

Job Posting:
- Title: ${job.title}
- Description: ${job.description}
- Required Skills: ${job.requiredSkills?.join(", ") || "None listed"}
- Preferred Skills: ${job.preferredSkills?.join(", ") || "None listed"}
- Experience Level: ${job.experienceLevel || "Not specified"}

Provide a comprehensive match analysis in JSON format with:
{
  "matchScore": <number 0-100>,
  "matchingSkills": <array of matching skills>,
  "gapSkills": <array of skills the candidate needs to develop>,
  "explanation": <detailed 2-3 sentence explanation of the match quality and key factors>,
  "strengths": <array of candidate strengths for this role>,
  "concerns": <array of potential gaps or concerns>
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are an expert recruiting AI that analyzes candidate-job matches. Provide accurate, fair, and helpful assessments.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");

      return {
        matchScore: Math.min(100, Math.max(0, result.matchScore || 0)),
        matchingSkills: result.matchingSkills || [],
        gapSkills: result.gapSkills || [],
        explanation: result.explanation || "Match analysis completed",
        aiMetadata: {
          strengths: result.strengths || [],
          concerns: result.concerns || [],
        },
      };
    } catch (error) {
      console.error("AI match analysis error:", error);
      throw new Error("Failed to analyze job match");
    }
  }

  async analyzeSkillGaps(
    currentSkills: string[],
    targetRole: string
  ): Promise<SkillGapAnalysis> {
    // Return mock data if OpenAI is not configured
    if (!openai) {
      return {
        currentSkills,
        targetSkills: [...currentSkills, "Leadership", "Communication"],
        gapSkills: ["Leadership", "Communication"],
        matchingSkills: currentSkills,
        recommendations: [
          `Continue developing your ${currentSkills[0] || 'core'} skills`,
          `Consider courses in leadership for ${targetRole}`,
          "Build a portfolio showcasing your work"
        ],
      };
    }

    const prompt = `Analyze skill gaps for career transition.

Current Skills: ${currentSkills.join(", ")}
Target Role: ${targetRole}

Identify:
1. Which current skills are valuable for the target role
2. What skills are missing or need development
3. Specific recommendations for skill development

Respond in JSON format:
{
  "targetSkills": <array of all skills needed for target role>,
  "matchingSkills": <current skills that apply to target role>,
  "gapSkills": <skills that need to be learned>,
  "recommendations": <array of specific actionable recommendations>
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are a career development expert helping professionals identify skill gaps and growth opportunities.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");

      return {
        currentSkills,
        targetSkills: result.targetSkills || [],
        gapSkills: result.gapSkills || [],
        matchingSkills: result.matchingSkills || [],
        recommendations: result.recommendations || [],
      };
    } catch (error) {
      console.error("Skill gap analysis error:", error);
      throw new Error("Failed to analyze skill gaps");
    }
  }

  async generateLearningPlan(
    currentSkills: string[],
    targetSkills: string[],
    targetRole: string
  ): Promise<LearningRoadmap[]> {
    const gapSkills = targetSkills.filter(skill =>
      !currentSkills.some(cs => cs.toLowerCase().includes(skill.toLowerCase()))
    );

    // Return mock data if OpenAI is not configured
    if (!openai) {
      return gapSkills.slice(0, 3).map((skill, i) => ({
        skill,
        priority: (i === 0 ? "high" : i === 1 ? "medium" : "low") as "high" | "medium" | "low",
        estimatedTime: `${2 + i}-${4 + i} weeks`,
        resources: [
          { title: `${skill} Tutorial`, url: `https://www.google.com/search?q=${encodeURIComponent(skill + ' tutorial')}`, type: "tutorial" },
          { title: `${skill} Documentation`, url: `https://www.google.com/search?q=${encodeURIComponent(skill + ' documentation')}`, type: "documentation" },
        ],
      }));
    }

    const prompt = `Create a personalized learning roadmap for skill development.

Target Role: ${targetRole}
Current Skills: ${currentSkills.join(", ")}
Skills to Learn: ${gapSkills.join(", ")}

For each skill to learn, provide:
1. Priority level (high/medium/low) based on importance for the role
2. Estimated time to learn (e.g., "2-4 weeks", "1-2 months")
3. Recommended learning resources (courses, tutorials, documentation)

Respond in JSON format:
{
  "roadmap": [
    {
      "skill": <skill name>,
      "priority": <"high"|"medium"|"low">,
      "estimatedTime": <time estimate>,
      "resources": [
        {"title": <resource name>, "url": <url or "Search: keyword">, "type": <"course"|"tutorial"|"documentation"|"practice">}
      ]
    }
  ]
}

Prioritize free, high-quality resources. Use "Search: [keyword]" for URL when suggesting searches.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are an expert learning advisor creating personalized skill development roadmaps.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result.roadmap || [];
    } catch (error) {
      console.error("Learning plan generation error:", error);
      throw new Error("Failed to generate learning plan");
    }
  }

  async extractResumeSkills(resumeText: string): Promise<string[]> {
    // Return basic extraction if OpenAI is not configured
    if (!openai) {
      const commonSkills = ["JavaScript", "Python", "React", "Node.js", "SQL", "Git", "AWS", "Docker", "TypeScript", "Java"];
      const foundSkills = commonSkills.filter(skill =>
        resumeText.toLowerCase().includes(skill.toLowerCase())
      );
      return foundSkills.length > 0 ? foundSkills : ["Communication", "Problem Solving", "Teamwork"];
    }

    const prompt = `Extract all technical and professional skills from this resume text.

Resume:
${resumeText}

Return ONLY a JSON object with:
{
  "skills": <array of distinct skills, technologies, tools, and competencies>
}

Focus on:
- Programming languages
- Frameworks and libraries
- Tools and platforms
- Soft skills
- Domain expertise`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are an expert at analyzing resumes and extracting professional skills.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result.skills || [];
    } catch (error) {
      console.error("Resume skill extraction error:", error);
      return [];
    }
  }

  async parseJobDescription(title: string, description: string): Promise<{
    extractedSkills: string[];
    extractedSeniority: string;
    suggestedSalaryMin: number;
    suggestedSalaryMax: number;
    confidence: number;
  }> {
    // Return basic extraction if OpenAI is not configured
    if (!openai) {
      const commonSkills = ["JavaScript", "Python", "React", "Node.js", "SQL", "Git", "AWS", "Docker", "TypeScript"];
      const foundSkills = commonSkills.filter(skill =>
        description.toLowerCase().includes(skill.toLowerCase())
      );
      const seniorityMap: Record<string, string> = { senior: "senior", lead: "lead", junior: "entry", principal: "principal" };
      let seniority = "mid";
      for (const [key, value] of Object.entries(seniorityMap)) {
        if (title.toLowerCase().includes(key) || description.toLowerCase().includes(key)) {
          seniority = value;
          break;
        }
      }
      return {
        extractedSkills: foundSkills.length > 0 ? foundSkills : ["Problem Solving", "Communication"],
        extractedSeniority: seniority,
        suggestedSalaryMin: seniority === "senior" ? 120000 : seniority === "lead" ? 150000 : 70000,
        suggestedSalaryMax: seniority === "senior" ? 180000 : seniority === "lead" ? 220000 : 100000,
        confidence: 50,
      };
    }

    const prompt = `Analyze this job posting and extract key information.

Job Title: ${title}
Description: ${description}

Extract and analyze:
1. Required and preferred skills/technologies
2. Seniority level (entry, mid, senior, lead, principal)
3. Suggested salary range in USD based on market standards for this role and seniority
4. Your confidence in these predictions (0-100)

Respond in JSON format:
{
  "extractedSkills": <array of all skills, technologies, and tools mentioned or implied>,
  "extractedSeniority": <"entry"|"mid"|"senior"|"lead"|"principal">,
  "suggestedSalaryMin": <minimum annual salary in USD>,
  "suggestedSalaryMax": <maximum annual salary in USD>,
  "confidence": <0-100 number indicating confidence in these predictions>
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are an expert recruiter and compensation analyst with deep knowledge of tech job markets and salary trends.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return {
        extractedSkills: result.extractedSkills || [],
        extractedSeniority: result.extractedSeniority || "mid",
        suggestedSalaryMin: result.suggestedSalaryMin || 0,
        suggestedSalaryMax: result.suggestedSalaryMax || 0,
        confidence: Math.min(100, Math.max(0, result.confidence || 70)),
      };
    } catch (error) {
      console.error("Job description parsing error:", error);
      throw new Error("Failed to parse job description");
    }
  }

  async parseResumeText(resumeText: string): Promise<{
    skills: string[];
    experience: string;
    education: string[];
    summary: string;
  }> {
    // Return basic extraction if OpenAI is not configured
    if (!openai) {
      const skills = await this.extractResumeSkills(resumeText);
      return {
        skills,
        experience: "Not specified (AI not configured)",
        education: ["Education details require AI parsing"],
        summary: resumeText.slice(0, 200) + "...",
      };
    }

    const prompt = `Parse this resume and extract structured information.

Resume:
${resumeText}

Extract:
1. All technical and professional skills
2. Years of experience and current role
3. Education background (degrees, institutions)
4. Professional summary (2-3 sentences)

Respond in JSON format:
{
  "skills": <array of distinct skills>,
  "experience": <"X years" or "Entry-level" or description of experience>,
  "education": <array of education entries like "BS Computer Science - MIT">,
  "summary": <2-3 sentence professional summary>
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are an expert resume parser that extracts structured data from resumes accurately.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return {
        skills: result.skills || [],
        experience: result.experience || "Not specified",
        education: result.education || [],
        summary: result.summary || "",
      };
    } catch (error) {
      console.error("Resume parsing error:", error);
      throw new Error("Failed to parse resume");
    }
  }

  async generateSkillTest(skill: string, testType: string): Promise<Array<{
    question: string;
    options: string[];
    correctAnswer: string;
    difficulty: string;
  }>> {
    // Return mock test if OpenAI is not configured
    if (!openai) {
      return [
        {
          question: `What is a key concept in ${skill}?`,
          options: ["Concept A", "Concept B", "Concept C", "Concept D"],
          correctAnswer: "Concept A",
          difficulty: "easy"
        },
        {
          question: `Which best describes ${skill} in practice?`,
          options: ["Description 1", "Description 2", "Description 3", "Description 4"],
          correctAnswer: "Description 1",
          difficulty: "medium"
        },
        {
          question: `What is an advanced use case for ${skill}?`,
          options: ["Use Case A", "Use Case B", "Use Case C", "Use Case D"],
          correctAnswer: "Use Case A",
          difficulty: "hard"
        }
      ];
    }

    const prompt = `Generate a ${testType} skill assessment test for "${skill}".

Create 10 questions that test practical knowledge and understanding of ${skill}.
Questions should be:
- Realistic and job-relevant
- Mix of difficulty levels (easy, medium, hard)
- Testing both theoretical knowledge and practical application

Respond in JSON format:
{
  "questions": [
    {
      "question": <question text>,
      "options": [<option 1>, <option 2>, <option 3>, <option 4>],
      "correctAnswer": <the correct option exactly as written>,
      "difficulty": <"easy"|"medium"|"hard">
    }
  ]
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are an expert technical interviewer creating fair, accurate, and insightful skill assessments.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result.questions || [];
    } catch (error) {
      console.error("Skill test generation error:", error);
      throw new Error("Failed to generate skill test");
    }
  }

  async parseResume(resumeUrl: string): Promise<{
    skills: string[];
    experience: string;
    education: string[];
    summary: string;
    rawText: string;
  } | null> {
    try {
      // In a real implementation, this would:
      // 1. Download the file from resumeUrl
      // 2. Parse PDF/DOCX to extract text
      // 3. Use the existing parseResumeText method

      // For now, return mock data as actual file parsing would require additional libraries
      console.log(`[AI SERVICE] Parsing resume from: ${resumeUrl}`);

      // Simulate parsing with mock data
      return {
        skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL'],
        experience: '3 years',
        education: ['BS Computer Science'],
        summary: 'Experienced software developer with expertise in full-stack development.',
        rawText: 'Mock resume text - actual parsing would extract from document',
      };
    } catch (error) {
      console.error("Resume parsing error:", error);
      return null;
    }
  }
}

export const aiService = new AIService();
