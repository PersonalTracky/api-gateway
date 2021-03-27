import { ApolloServer } from "apollo-server-express";
import connectRedis from "connect-redis";
import cors from "cors";
import express from "express";
import session from "express-session";
import Redis from "ioredis";
import "reflect-metadata";
import { buildSchema } from "type-graphql";
import { COOKIE_NAME, __prod__ } from "./constants/constants";
import { NoteResolver } from "./resolvers/NoteResolver";
import { PingResolver } from "./resolvers/PingResolver";
import { UserResolver } from "./resolvers/UserResolver";

const main = async () => {
  require("dotenv").config();

  const app = express();
  const RedisStore = connectRedis(session);
  const redis = new Redis(process.env.REDIS_URL);
  app.set("trust proxy", true);
  console.log("allowing CORS origin:", process.env.CORS_ORIGIN);
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN,
      credentials: true,
      methods: ["POST", "GET"],
      allowedHeaders: [
        "access-control-allow-origin",
        "authorization",
        "content-type",
      ],
    })
  );
  app.use(
    session({
      name: COOKIE_NAME,
      proxy: __prod__,
      store: new RedisStore({
        client: redis,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 2,
        httpOnly: true,
        sameSite: __prod__ ? "none" : "lax",
        secure: __prod__,
      },
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET,
      resave: false,
    })
  );
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PingResolver, UserResolver, NoteResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({
      req,
      res,
      redis,
    }),
  });
  app.enable("trust proxy");
  apolloServer.applyMiddleware({ app, cors: false });

  app.listen(parseInt(process.env.PORT!), () => {
    console.log(`Server started on port ${process.env.PORT}`);
  });
};

main().catch((err) => {
  console.error(err);
});
