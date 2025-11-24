"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubCache = void 0;
// server/src/githubCache.ts
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const GITHUB_USER = process.env.GITHUB_USER;
if (!GITHUB_USER) {
    throw new Error('GITHUB_USER environment variable is not set');
}
const isDev = process.env.NODE_ENV !== 'production';
const CACHE_DIR = isDev
    ? path_1.default.join(process.cwd(), 'data') // Development
    : '/var/www/html/personal-kb/data'; // Production - store in web directory
class GitHubCache {
    constructor() {
        this.cacheDir = CACHE_DIR; // Use the constant you already defined
        console.log(`Running in ${isDev ? 'development' : 'production'} mode`);
        console.log(`Using cache directory: ${this.cacheDir}`);
    }
    async fetchGitHub(endpoint, isRaw = false) {
        const baseUrl = 'https://api.github.com';
        const headers = {
            'Accept': isRaw ? 'application/vnd.github.raw' : 'application/vnd.github.v3+json',
            'User-Agent': 'GitHubCache',
        };
        const response = await (0, node_fetch_1.default)(`${baseUrl}/${endpoint}`, { headers });
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }
        return isRaw ? response.text() : response.json();
    }
    async ensureCacheDir() {
        await promises_1.default.mkdir(path_1.default.join(this.cacheDir, 'readmes'), { recursive: true });
        await promises_1.default.mkdir(path_1.default.join(this.cacheDir, 'languages'), { recursive: true });
        console.log(`Ensured cache directories exist in ${this.cacheDir}`);
    }
    async getFileStats(filePath) {
        try {
            const stats = await promises_1.default.stat(filePath);
            return {
                exists: true,
                lastModified: stats.mtime
            };
        }
        catch {
            return {
                exists: false,
                lastModified: null
            };
        }
    }
    async getRepos() {
        const filePath = path_1.default.join(this.cacheDir, 'repos.json');
        const stats = await this.getFileStats(filePath);
        console.log(`Reading repos from ${filePath}`);
        if (stats.exists) {
            console.log(`Last modified: ${stats.lastModified?.toISOString()}`);
        }
        const data = await promises_1.default.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    }
    async getLanguages(repoName) {
        const filePath = path_1.default.join(this.cacheDir, 'languages', `${repoName}.json`);
        const stats = await this.getFileStats(filePath);
        console.log(`Reading languages from ${filePath}`);
        if (stats.exists) {
            console.log(`Last modified: ${stats.lastModified?.toISOString()}`);
        }
        const data = await promises_1.default.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    }
    async getReadme(repoName) {
        const filePath = path_1.default.join(this.cacheDir, 'readmes', `${repoName}.md`);
        const stats = await this.getFileStats(filePath);
        console.log(`Reading README from ${filePath}`);
        if (stats.exists) {
            console.log(`Last modified: ${stats.lastModified?.toISOString()}`);
        }
        return promises_1.default.readFile(filePath, 'utf-8');
    }
    async getMetadata() {
        const filePath = path_1.default.join(this.cacheDir, 'metadata.json');
        const stats = await this.getFileStats(filePath);
        console.log(`Reading metadata from ${filePath}`);
        if (stats.exists) {
            console.log(`Last modified: ${stats.lastModified?.toISOString()}`);
        }
        const data = await promises_1.default.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    }
    async updateCache() {
        console.log('Starting cache update...');
        console.log(`Cache directory: ${this.cacheDir}`);
        await this.ensureCacheDir();
        try {
            // Fetch repositories
            const repos = await this.fetchGitHub(`users/${GITHUB_USER}/repos?per_page=100`);
            repos.sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime());
            // Save base repository data
            const reposPath = path_1.default.join(this.cacheDir, 'repos.json');
            await promises_1.default.writeFile(reposPath, JSON.stringify(repos, null, 2));
            console.log(`Updated repos.json at ${reposPath}`);
            // Update individual repository data
            for (const repo of repos) {
                console.log(`Processing ${repo.name}...`);
                try {
                    // Fetch and save language data
                    const languages = await this.fetchGitHub(`repos/${GITHUB_USER}/${repo.name}/languages`);
                    await promises_1.default.writeFile(path_1.default.join(this.cacheDir, 'languages', `${repo.name}.json`), JSON.stringify(languages, null, 2));
                    // Fetch and save README
                    try {
                        const readme = await this.fetchGitHub(`repos/${GITHUB_USER}/${repo.name}/readme`, true);
                        await promises_1.default.writeFile(path_1.default.join(this.cacheDir, 'readmes', `${repo.name}.md`), readme);
                    }
                    catch (error) {
                        if (error.status === 404) {
                            console.log(`No README found for ${repo.name} (expected)`);
                            // Write an empty or placeholder README
                            await promises_1.default.writeFile(path_1.default.join(this.cacheDir, 'readmes', `${repo.name}.md`), '# No README available\n\nThis repository does not have a README file.');
                        }
                        else {
                            console.error(`Error fetching README for ${repo.name}:`, error);
                        }
                    }
                }
                catch (error) {
                    console.error(`Error processing ${repo.name}:`, error);
                }
            }
            // Save metadata
            const metadata = {
                last_updated: new Date().toISOString(),
                repo_count: repos.length
            };
            await promises_1.default.writeFile(path_1.default.join(this.cacheDir, 'metadata.json'), JSON.stringify(metadata, null, 2));
            console.log('Cache update completed');
        }
        catch (error) {
            console.error('Cache update failed:', error);
            throw error;
        }
    }
}
exports.GitHubCache = GitHubCache;
