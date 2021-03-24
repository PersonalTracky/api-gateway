declare namespace NodeJS {
  interface ProcessEnv {
    DB_URL: string;
    PORT: string;
    REDIS_URL: string;
    CORS_ORIGIN: string;
    SESSION_SECRET: string;
    EMAIL: string;
    REFRESH_TOKEN: string;
    CLIENT_SECRET: string;
    CLIENT_ID: string;
    REDIS_FORGET_PASSWORD_PREFIX: string;
    PROD_DOMAIN: string;
  }
}