// server/src/githubCache.ts
import fs from 'fs/promises';
import path from 'path';
import { Repository, CacheMetadata } from './types';
import fetch from 'node-fetch';
const GITHUB_USER = process.env.GITHUB_USER;
if (!GITHUB_USER) {
    throw new Error('GITHUB_USER environment variable is not set');
}

const isDev = process.env.NODE_ENV !== 'production';
const CACHE_DIR = isDev 
    ? path.join(process.cwd(), 'data')  // Development
    : '/var/www/html/personal-kb/data';  // Production - store in web directory

export class GitHubCache {
    private cacheDir: string;

    constructor() {
        this.cacheDir = CACHE_DIR;  // Use the constant you already defined
        console.log(`Running in ${isDev ? 'development' : 'production'} mode`);
        console.log(`Using cache directory: ${this.cacheDir}`);
    }

    private async fetchGitHub(endpoint: string, isRaw: boolean = false): Promise<any> {
        const baseUrl = 'https://api.github.com';
        const headers = {
            'Accept': isRaw ? 'application/vnd.github.raw' : 'application/vnd.github.v3+json',
            'User-Agent': 'GitHubCache',
        };

        const response = await fetch(`${baseUrl}/${endpoint}`, { headers });

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }

        return isRaw ? response.text() : response.json();
    }

    private async ensureCacheDir() {
        await fs.mkdir(path.join(this.cacheDir, 'readmes'), { recursive: true });
        await fs.mkdir(path.join(this.cacheDir, 'languages'), { recursive: true });
        console.log(`Ensured cache directories exist in ${this.cacheDir}`);
    }

    private async getFileStats(filePath: string) {
        try {
            const stats = await fs.stat(filePath);
            return {
                exists: true,
                lastModified: stats.mtime
            };
        } catch {
            return {
                exists: false,
                lastModified: null
            };
        }
    }

    async getRepos(): Promise<Repository[]> {
        const filePath = path.join(this.cacheDir, 'repos.json');
        const stats = await this.getFileStats(filePath);

        console.log(`Reading repos from ${filePath}`);
        if (stats.exists) {
            console.log(`Last modified: ${stats.lastModified?.toISOString()}`);
        }

        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    }

    async getLanguages(repoName: string): Promise<Record<string, number>> {
        const filePath = path.join(this.cacheDir, 'languages', `${repoName}.json`);
        const stats = await this.getFileStats(filePath);

        console.log(`Reading languages from ${filePath}`);
        if (stats.exists) {
            console.log(`Last modified: ${stats.lastModified?.toISOString()}`);
        }

        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    }

    async getReadme(repoName: string): Promise<string> {
        const filePath = path.join(this.cacheDir, 'readmes', `${repoName}.md`);
        const stats = await this.getFileStats(filePath);

        console.log(`Reading README from ${filePath}`);
        if (stats.exists) {
            console.log(`Last modified: ${stats.lastModified?.toISOString()}`);
        }

        return fs.readFile(filePath, 'utf-8');
    }

    async getMetadata(): Promise<CacheMetadata> {
        const filePath = path.join(this.cacheDir, 'metadata.json');
        const stats = await this.getFileStats(filePath);

        console.log(`Reading metadata from ${filePath}`);
        if (stats.exists) {
            console.log(`Last modified: ${stats.lastModified?.toISOString()}`);
        }

        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    }

    async updateCache() {
        console.log('Starting cache update...');
        console.log(`Cache directory: ${this.cacheDir}`);
        await this.ensureCacheDir();

        try {
            // Fetch repositories
            const repos = await this.fetchGitHub(`users/${GITHUB_USER}/repos?per_page=100`) as Repository[];
            repos.sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime());

            // Save base repository data
            const reposPath = path.join(this.cacheDir, 'repos.json');
            await fs.writeFile(reposPath, JSON.stringify(repos, null, 2));
            console.log(`Updated repos.json at ${reposPath}`);

            // Update individual repository data
            for (const repo of repos) {
                console.log(`Processing ${repo.name}...`);

                try {
                    // Fetch and save language data
                    const languages = await this.fetchGitHub(`repos/${GITHUB_USER}/${repo.name}/languages`);
                    await fs.writeFile(
                        path.join(this.cacheDir, 'languages', `${repo.name}.json`),
                        JSON.stringify(languages, null, 2)
                    );

                    // Fetch and save README
                    try {
                        const readme = await this.fetchGitHub(
                            `repos/${GITHUB_USER}/${repo.name}/readme`,
                            true
                        );
                        await fs.writeFile(
                            path.join(this.cacheDir, 'readmes', `${repo.name}.md`),
                            readme
                        );
                    } catch (error) {
                        if ((error as any).status === 404) {
                            console.log(`No README found for ${repo.name} (expected)`);
                            // Write an empty or placeholder README
                            await fs.writeFile(
                                path.join(this.cacheDir, 'readmes', `${repo.name}.md`),
                                '# No README available\n\nThis repository does not have a README file.'
                            );
                        } else {
                            console.error(`Error fetching README for ${repo.name}:`, error);
                        }
                    }
                } catch (error) {
                    console.error(`Error processing ${repo.name}:`, error);
                }
            }

            // Save metadata
            const metadata: CacheMetadata = {
                last_updated: new Date().toISOString(),
                repo_count: repos.length
            };

            await fs.writeFile(
                path.join(this.cacheDir, 'metadata.json'),
                JSON.stringify(metadata, null, 2)
            );

            console.log('Cache update completed');
        } catch (error) {
            console.error('Cache update failed:', error);
            throw error;
        }
    }
}