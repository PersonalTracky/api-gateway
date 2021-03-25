import "reflect-metadata";
import { __prod__, COOKIE_NAME } from "./constants/constants";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import cors from "cors";
import { createConnection } from "typeorm";
import path from "path";
import { PingResolver } from "./resolvers/PingResolver";
import { Category } from "./entities/Category";
import { Log } from "./entities/Log";
import { User } from "./entities/User";
import { UserResolver } from "./resolvers/UserResolver";
import { Note } from "./entities/Note";
import { NoteResolver } from "./resolvers/NoteResolver";

const main = async () => {
  require("dotenv").config();
  await createConnection({
    type: "postgres",
    url: process.env.DB_URL,
    logging: !__prod__,
    synchronize: !__prod__,
    migrations: [path.join(__dirname, "./migrations/*")],
    entities: [Category, Log, User, Note],
    cli: { migrationsDir: "migrations" },
  });

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
