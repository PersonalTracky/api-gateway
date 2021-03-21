declare namespace NodeJS {
  interface ProcessEnv {
    DB_URL: string;
    PORT: string;
    REDIS_URL: string;
    CORS_ORIGIN: string;
    SESSION_SECRET: string;
  }
}