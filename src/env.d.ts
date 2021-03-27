declare namespace NodeJS {
  interface ProcessEnv {
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
    NOTES_SERVICE_ENDPOINT: string;
    NOTES_SERVICE_ENDPOINT_PAG: string;
    USER_SERVICE_ENDPOINT: string;
    USER_SERVICE_ENDPOINT_ME: string;
    USER_SERVICE_ENDPOINT_UBID: string;
    USER_SERVICE_ENDPOINT_UBEU: string;
  }
}