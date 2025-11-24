import { z } from 'zod';
declare const envSchema: z.ZodObject<{
    CHAT_PASSWORD: z.ZodString;
    SERVICE_TOKEN: z.ZodString;
    PORT: z.ZodDefault<z.ZodNumber>;
    LOG_LEVEL: z.ZodDefault<z.ZodString>;
    CHAT_TTL_HOURS: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    CHAT_PASSWORD: string;
    SERVICE_TOKEN: string;
    PORT: number;
    LOG_LEVEL: string;
    CHAT_TTL_HOURS: number;
}, {
    CHAT_PASSWORD: string;
    SERVICE_TOKEN: string;
    PORT?: number | undefined;
    LOG_LEVEL?: string | undefined;
    CHAT_TTL_HOURS?: number | undefined;
}>;
export type Env = z.infer<typeof envSchema>;
export declare function loadEnv(): Env;
export {};
//# sourceMappingURL=env.d.ts.map