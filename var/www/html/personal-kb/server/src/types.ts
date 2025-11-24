// server/src/types.ts
export interface Repository {
    id: number;
    name: string;
    description: string | null;
    html_url: string;
    language: string | null;
    languages_url: string;
    pushed_at: string;
    default_branch: string;
    readme_preview: string | null;
  }
  
  export interface CacheMetadata {
    last_updated: string;
    repo_count: number;
  }