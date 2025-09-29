import * as env from "env-var"; 

export const ENV = {
  NODE_ENV: env.get("NODE_ENV").default("development").asString(),
  PORT: env.get("PORT").default("3000").asPortNumber(),

  // Database
  DATABASE_URL: env.get("DATABASE_URL").required().asString(), 

  // JWT / Security
  JWT_SECRET: env.get("JWT_SECRET").required().asString(),

  // Supabase
  SUPABASE_URL: env.get("SUPABASE_URL").required().asString(), 
  SUPABASE_ANON_KEY: env.get("SUPABASE_ANON_KEY").required().asString(),

  // Redis
  REDIS_URL: env.get("REDIS_URL").default("redis://localhost:6379").asString(),

  // Stellar / Horizon
  HORIZON_URL: env.get("HORIZON_URL").default("https://horizon-testnet.stellar.org").asString(), 
  STELLAR_NETWORK: env.get("STELLAR_NETWORK").default("testnet").asString(),

  // Email
  EMAIL_SERVICE: env.get("EMAIL_SERVICE").default("gmail").asString(),
  EMAIL_USER: env.get("EMAIL_USER").required().asString(),
  EMAIL_PASSWORD: env.get("EMAIL_PASSWORD").required().asString(),
  BASE_URL: env.get("BASE_URL").default("http://localhost:3000").asString(), 
};