import OpenAI from "openai";
import type { JobSeeker, Job, Match, LearningPlan } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
}

export const aiService = new AIService();
