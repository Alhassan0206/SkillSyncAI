import OpenAI from "openai";
import type { JobSeeker, Job, SkillEmbedding, MatchingWeight } from "@shared/schema";
import { storage } from "./storage";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface EnhancedMatchResult {
  matchScore: number;
  semanticScore: number;
  keywordScore: number;
  experienceScore: number;
  matchingSkills: string[];
  gapSkills: string[];
  explanation: string;
  breakdown: {
    factor: string;
    score: number;
    weight: number;
    contribution: number;
  }[];
  aiMetadata?: any;
}

export class MatchingService {
  private async getEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error("Embedding generation error:", error);
      throw new Error("Failed to generate embedding");
    }
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error("Vectors must have the same length");
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  async generateAndStoreEmbedding(
    entityType: string,
    entityId: string,
    text: string
  ): Promise<SkillEmbedding> {
    const embedding = await this.getEmbedding(text);
    
    const existing = await storage.getSkillEmbedding(entityType, entityId);
    
    if (existing) {
      return await storage.updateSkillEmbedding(existing.id, {
        skillText: text,
        embedding: JSON.stringify(embedding),
        model: "text-embedding-3-small",
      });
    }
    
    return await storage.createSkillEmbedding({
      entityType,
      entityId,
      skillText: text,
      embedding: JSON.stringify(embedding),
      model: "text-embedding-3-small",
    });
  }

  async getOrGenerateEmbedding(
    entityType: string,
    entityId: string,
    text: string
  ): Promise<number[]> {
    const existing = await storage.getSkillEmbedding(entityType, entityId);
    
    if (existing && existing.skillText === text) {
      return JSON.parse(existing.embedding);
    }
    
    const newEmbedding = await this.generateAndStoreEmbedding(entityType, entityId, text);
    return JSON.parse(newEmbedding.embedding);
  }

  private calculateKeywordMatch(
    candidateSkills: string[],
    requiredSkills: string[],
    preferredSkills: string[]
  ): { score: number; matching: string[]; gaps: string[] } {
    const normalizedCandidate = candidateSkills.map(s => s.toLowerCase().trim());
    const normalizedRequired = requiredSkills.map(s => s.toLowerCase().trim());
    const normalizedPreferred = preferredSkills.map(s => s.toLowerCase().trim());
    
    const allJobSkills = [...normalizedRequired, ...normalizedPreferred];
    
    const matching = candidateSkills.filter(skill => 
      allJobSkills.some(js => 
        js.includes(skill.toLowerCase()) || skill.toLowerCase().includes(js)
      )
    );
    
    const gaps = [...requiredSkills, ...preferredSkills].filter(skill => 
      !normalizedCandidate.some(cs => 
        cs.includes(skill.toLowerCase()) || skill.toLowerCase().includes(cs)
      )
    );
    
    const requiredMatches = normalizedRequired.filter(rs =>
      normalizedCandidate.some(cs => cs.includes(rs) || rs.includes(cs))
    ).length;
    
    const preferredMatches = normalizedPreferred.filter(ps =>
      normalizedCandidate.some(cs => cs.includes(ps) || ps.includes(cs))
    ).length;
    
    const requiredScore = normalizedRequired.length > 0 
      ? (requiredMatches / normalizedRequired.length) * 100 
      : 100;
    
    const preferredScore = normalizedPreferred.length > 0 
      ? (preferredMatches / normalizedPreferred.length) * 100 
      : 100;
    
    const score = (requiredScore * 0.7) + (preferredScore * 0.3);
    
    return { score, matching, gaps };
  }

  private calculateExperienceMatch(
    candidateExperience: string | null,
    jobLevel: string | null
  ): number {
    if (!candidateExperience || !jobLevel) {
      return 50;
    }

    const experienceYears = this.extractYears(candidateExperience);
    const levelMap: { [key: string]: { min: number; max: number } } = {
      'entry': { min: 0, max: 2 },
      'mid': { min: 2, max: 5 },
      'senior': { min: 5, max: 10 },
      'lead': { min: 8, max: 15 },
      'principal': { min: 10, max: 20 },
    };

    const level = levelMap[jobLevel.toLowerCase()] || { min: 0, max: 20 };
    
    if (experienceYears >= level.min && experienceYears <= level.max) {
      return 100;
    } else if (experienceYears < level.min) {
      const gap = level.min - experienceYears;
      return Math.max(0, 100 - (gap * 15));
    } else {
      const excess = experienceYears - level.max;
      return Math.max(70, 100 - (excess * 5));
    }
  }

  private extractYears(experienceText: string): number {
    const yearMatch = experienceText.match(/(\d+)\s*(year|yr)/i);
    if (yearMatch) {
      return parseInt(yearMatch[1], 10);
    }
    
    if (experienceText.toLowerCase().includes('entry') || 
        experienceText.toLowerCase().includes('junior')) {
      return 1;
    }
    if (experienceText.toLowerCase().includes('senior')) {
      return 7;
    }
    if (experienceText.toLowerCase().includes('lead')) {
      return 10;
    }
    
    return 3;
  }

  async analyzeEnhancedMatch(
    jobSeeker: JobSeeker,
    job: Job
  ): Promise<EnhancedMatchResult> {
    const candidateText = `${jobSeeker.skills?.join(", ") || ""} ${jobSeeker.bio || ""} ${jobSeeker.currentRole || ""}`.trim();
    const jobText = `${job.title} ${job.description} ${job.requiredSkills?.join(", ") || ""} ${job.preferredSkills?.join(", ") || ""}`.trim();
    
    const [candidateEmbedding, jobEmbedding] = await Promise.all([
      this.getOrGenerateEmbedding("job_seeker", jobSeeker.id, candidateText),
      this.getOrGenerateEmbedding("job", job.id, jobText),
    ]);
    
    const semanticScore = this.cosineSimilarity(candidateEmbedding, jobEmbedding) * 100;
    
    const keywordMatch = this.calculateKeywordMatch(
      jobSeeker.skills || [],
      job.requiredSkills || [],
      job.preferredSkills || []
    );
    
    const experienceScore = this.calculateExperienceMatch(
      jobSeeker.experience,
      job.experienceLevel
    );
    
    const weights = await this.getMatchingWeights();
    const defaultWeights = {
      semantic: weights.find(w => w.factor === 'semantic')?.weight || 35,
      keyword: weights.find(w => w.factor === 'keyword')?.weight || 40,
      experience: weights.find(w => w.factor === 'experience')?.weight || 25,
    };
    
    const totalWeight = defaultWeights.semantic + defaultWeights.keyword + defaultWeights.experience;
    
    const breakdown = [
      {
        factor: 'Semantic Similarity (AI)',
        score: Math.round(semanticScore),
        weight: defaultWeights.semantic,
        contribution: (semanticScore * defaultWeights.semantic) / totalWeight,
      },
      {
        factor: 'Keyword Match',
        score: Math.round(keywordMatch.score),
        weight: defaultWeights.keyword,
        contribution: (keywordMatch.score * defaultWeights.keyword) / totalWeight,
      },
      {
        factor: 'Experience Level',
        score: Math.round(experienceScore),
        weight: defaultWeights.experience,
        contribution: (experienceScore * defaultWeights.experience) / totalWeight,
      },
    ];
    
    const matchScore = Math.round(
      breakdown.reduce((sum, b) => sum + b.contribution, 0)
    );
    
    const explanation = this.generateExplanation(matchScore, breakdown, keywordMatch.matching, keywordMatch.gaps);
    
    return {
      matchScore,
      semanticScore: Math.round(semanticScore),
      keywordScore: Math.round(keywordMatch.score),
      experienceScore: Math.round(experienceScore),
      matchingSkills: keywordMatch.matching,
      gapSkills: keywordMatch.gaps,
      explanation,
      breakdown,
      aiMetadata: {
        candidateStrengths: keywordMatch.matching,
        improvementAreas: keywordMatch.gaps,
      },
    };
  }

  private generateExplanation(
    score: number,
    breakdown: any[],
    matching: string[],
    gaps: string[]
  ): string {
    if (score >= 80) {
      return `Excellent match (${score}%). Strong alignment across ${matching.length} key skills. ${gaps.length > 0 ? `Minor gaps in ${gaps.slice(0, 2).join(", ")}.` : ""}`;
    } else if (score >= 60) {
      return `Good match (${score}%). Solid foundation with ${matching.length} matching skills. Consider developing ${gaps.slice(0, 3).join(", ")} to strengthen fit.`;
    } else if (score >= 40) {
      return `Moderate match (${score}%). Some relevant skills (${matching.slice(0, 3).join(", ")}), but significant gaps in ${gaps.slice(0, 3).join(", ")}.`;
    } else {
      return `Limited match (${score}%). Considerable skill development needed in ${gaps.slice(0, 4).join(", ")}.`;
    }
  }

  private async getMatchingWeights(): Promise<MatchingWeight[]> {
    const weights = await storage.getMatchingWeights();
    
    if (weights.length === 0) {
      const defaultWeights = [
        {
          weightType: "match_algorithm",
          factor: "semantic",
          weight: 35,
          description: "AI-powered semantic similarity between candidate and job",
          isActive: true,
        },
        {
          weightType: "match_algorithm",
          factor: "keyword",
          weight: 40,
          description: "Direct skill keyword matching",
          isActive: true,
        },
        {
          weightType: "match_algorithm",
          factor: "experience",
          weight: 25,
          description: "Experience level alignment",
          isActive: true,
        },
      ];
      
      for (const weight of defaultWeights) {
        await storage.createMatchingWeight(weight);
      }
      
      return await storage.getMatchingWeights();
    }
    
    return weights;
  }

  async updateMatchingWeights(feedback: {
    matchId: string;
    feedbackType: 'accept' | 'reject';
    factors: string[];
  }): Promise<void> {
    const weights = await storage.getMatchingWeights();
    
    if (feedback.feedbackType === 'accept') {
      for (const factor of feedback.factors) {
        const weight = weights.find(w => w.factor === factor);
        if (weight) {
          const newWeight = Math.min(100, weight.weight + 2);
          await storage.updateMatchingWeight(weight.id, { weight: newWeight });
        }
      }
    } else if (feedback.feedbackType === 'reject') {
      for (const factor of feedback.factors) {
        const weight = weights.find(w => w.factor === factor);
        if (weight) {
          const newWeight = Math.max(10, weight.weight - 2);
          await storage.updateMatchingWeight(weight.id, { weight: newWeight });
        }
      }
    }
  }
}

export const matchingService = new MatchingService();
