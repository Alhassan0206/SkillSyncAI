import type { InsertGithubRepo, GithubRepo } from "@shared/schema";
import type { IStorage } from "./storage";

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  fork: boolean;
  topics: string[];
  pushed_at: string;
  updated_at: string;
}

interface GitHubContributor {
  login: string;
  contributions: number;
}

interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
}

export class GitHubService {
  constructor(private storage: IStorage) {}

  async fetchUserRepos(githubUsername: string): Promise<GitHubRepo[]> {
    try {
      const response = await fetch(
        `https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=100`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'SkillSync-AI',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const repos: GitHubRepo[] = await response.json();
      return repos.filter(repo => !repo.fork);
    } catch (error) {
      console.error('Error fetching GitHub repos:', error);
      throw error;
    }
  }

  async importUserRepos(jobSeekerId: string, githubUsername: string): Promise<GithubRepo[]> {
    try {
      const repos = await this.fetchUserRepos(githubUsername);
      const imported: GithubRepo[] = [];

      const existingRepos = await this.storage.getGithubRepos(jobSeekerId);
      const existingRepoUrls = new Set(existingRepos.map(r => r.repoUrl));

      for (const repo of repos) {
        if (existingRepoUrls.has(repo.html_url)) {
          continue;
        }

        const repoData: InsertGithubRepo = {
          jobSeekerId,
          repoName: repo.name,
          repoUrl: repo.html_url,
          description: repo.description || undefined,
          language: repo.language || undefined,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          topics: repo.topics || [],
          lastUpdated: new Date(repo.pushed_at),
        };

        const created = await this.storage.createGithubRepo(repoData);
        imported.push(created);
      }

      return imported;
    } catch (error) {
      console.error('Error importing GitHub repos:', error);
      throw error;
    }
  }

  async analyzeActivity(githubUsername: string): Promise<{
    totalCommits: number;
    recentActivity: number;
    topLanguages: string[];
    contributionScore: number;
  }> {
    try {
      const repos = await this.fetchUserRepos(githubUsername);
      
      const languages: Record<string, number> = {};
      let totalStars = 0;
      let totalForks = 0;

      for (const repo of repos) {
        if (repo.language) {
          languages[repo.language] = (languages[repo.language] || 0) + 1;
        }
        totalStars += repo.stargazers_count;
        totalForks += repo.forks_count;
      }

      const topLanguages = Object.entries(languages)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([lang]) => lang);

      const recentRepos = repos.filter(repo => {
        const lastUpdate = new Date(repo.pushed_at);
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        return lastUpdate > threeMonthsAgo;
      });

      const recentActivity = recentRepos.length;

      const contributionScore = Math.min(
        100,
        (repos.length * 5) + 
        (totalStars * 2) + 
        (totalForks * 3) + 
        (recentActivity * 10)
      );

      return {
        totalCommits: 0,
        recentActivity,
        topLanguages,
        contributionScore: Math.round(contributionScore),
      };
    } catch (error) {
      console.error('Error analyzing GitHub activity:', error);
      return {
        totalCommits: 0,
        recentActivity: 0,
        topLanguages: [],
        contributionScore: 0,
      };
    }
  }

  async extractSkillsFromRepos(repos: GitHubRepo[]): Promise<string[]> {
    const skills = new Set<string>();
    
    for (const repo of repos) {
      if (repo.language) {
        skills.add(repo.language);
      }
      
      repo.topics.forEach(topic => {
        const skill = topic
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        skills.add(skill);
      });
    }

    const languageSkillMap: Record<string, string[]> = {
      'JavaScript': ['Node.js', 'React', 'Express'],
      'TypeScript': ['TypeScript', 'Node.js', 'React'],
      'Python': ['Python', 'Django', 'Flask'],
      'Java': ['Java', 'Spring Boot', 'Maven'],
      'Go': ['Go', 'Microservices'],
      'Rust': ['Rust', 'Systems Programming'],
      'Ruby': ['Ruby', 'Rails'],
      'PHP': ['PHP', 'Laravel'],
    };

    Array.from(skills).forEach(skill => {
      const relatedSkills = languageSkillMap[skill];
      if (relatedSkills) {
        relatedSkills.forEach(s => skills.add(s));
      }
    });

    return Array.from(skills).slice(0, 20);
  }

  async syncRepoData(jobSeekerId: string, githubUsername: string): Promise<{
    updated: number;
    added: number;
  }> {
    try {
      const remoteRepos = await this.fetchUserRepos(githubUsername);
      const localRepos = await this.storage.getGithubRepos(jobSeekerId);

      const localRepoMap = new Map(localRepos.map(r => [r.repoUrl, r]));
      let updated = 0;
      let added = 0;

      for (const remoteRepo of remoteRepos) {
        const existing = localRepoMap.get(remoteRepo.html_url);
        
        if (existing) {
          updated++;
        } else {
          const repoData: InsertGithubRepo = {
            jobSeekerId,
            repoName: remoteRepo.name,
            repoUrl: remoteRepo.html_url,
            description: remoteRepo.description || undefined,
            language: remoteRepo.language || undefined,
            stars: remoteRepo.stargazers_count,
            forks: remoteRepo.forks_count,
            topics: remoteRepo.topics || [],
            lastUpdated: new Date(remoteRepo.pushed_at),
          };
          await this.storage.createGithubRepo(repoData);
          added++;
        }
      }

      return { updated, added };
    } catch (error) {
      console.error('Error syncing GitHub repo data:', error);
      throw error;
    }
  }
}
