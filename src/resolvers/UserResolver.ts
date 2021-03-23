import { MyContext } from "../types/types";
import { validateRegister } from "../validation/RegisterValidation";
import {
  ObjectType,
  Field,
  Resolver,
  Arg,
  Ctx,
  Mutation,
  InputType,
  Query,
  FieldResolver,
  Root,
} from "type-graphql";
import { getConnection } from "typeorm";
import { FieldError } from "./FieldError";
import argon2 from "argon2";
import { COOKIE_NAME } from "../constants/constants";
import { User } from "../entities/User";
import { v4 } from "uuid";
import { sendEmail } from "../email/sendEmail";

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@InputType()
export class UsernamePasswordInput {
  @Field()
  email: string;
  @Field()
  username: string;
  @Field()
  password: string;
  @Field()
  profilePictureUrl: string;
}

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: MyContext) {
    if (req.session.userId === user.id) {
      return user.email;
    }
    return "";
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { redis }: MyContext
  ) {
    console.log(email);
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // the email is not in the db so we can just return true without sending
      // if we return false and display that the email is not in the db then
      // someone could potentially brute force to find emails that ARE in the db
      // so we can just return true
      return true;
    }

    const token = v4();
    const username = user.username;

    // give the user a day to reset their password, then the link becomes expired
    await redis.set(
      process.env.REDIS_FORGET_PASSWORD_PREFIX + token,
      user.id,
      "ex",
      1000 * 60 * 60 * 24 * 1
    );

    // TODO: change url to non hardcoded dev url when deploying to prod
    await sendEmail({
      from: process.env.EMAIL,
      to: email,
      subject: "Tracky password reset",
      text: `Hello, ${username}, here is your password reset link: ${token}`,
      html: `<b>Hello, <strong>${username}</strong>, here is your password reset link:\n<b><a href="http://localhost:3000/change-password/${token}">http://localhost:3000/change-password/${token}</a></b>`,
    });

    return true;
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { redis, req }: MyContext
  ): Promise<UserResponse> {
    if (newPassword.length <= 2) {
      return {
        errors: [
          {
            field: "newPassword",
            message: "Length must be greater than 2",
          },
        ],
      };
    }

    const key = process.env.REDIS_FORGET_PASSWORD_PREFIX + token;
    const userId = await redis.get(key);
    if (!userId) {
      return {
        errors: [
          {
            field: "token",
            message: "Token has expired",
          },
        ],
      };
    }

    const userIdNum = parseInt(userId);
    const user = await User.findOne(userIdNum);

    if (!user) {
      return {
        errors: [
          {
            field: "token",
            message: "User no longer exists",
          },
        ],
      };
    }

    await User.update(
      { id: userIdNum },
      {
        password: await argon2.hash(newPassword),
      }
    );

    await redis.del(key);
    return { user };
  }

  @Query(() => User, { nullable: true })
  me(@Ctx() { req }: MyContext) {
    if (!req.session.userId) {
      return null;
    }
    return User.findOne(req.session.userId);
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const errors = validateRegister(options);
    if (errors) {
      return { errors };
    }
    const hashedPassword = await argon2.hash(options.password);
    let user;
    try {
      const result = await getConnection()
        .createQueryBuilder()
        .insert()
        .into(User)
        .values({
          username: options.username,
          email: options.email,
          password: hashedPassword,
          profilePictureUrl: options.profilePictureUrl,
        })
        .returning("*")
        .execute();
      user = result.raw[0];
    } catch (err) {
      if (err.code === "23505") {
        return {
          errors: [
            {
              field: "username",
              message: "username already taken",
            },
          ],
        };
      }
    }
    // when user is registered, store the user is in the session and set
    // their cookie
    req.session.userId = user.id;
    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const user = await User.findOne(
      usernameOrEmail.includes("@")
        ? { where: { email: usernameOrEmail } }
        : { where: { username: usernameOrEmail } }
    );
    if (!user) {
      return {
        errors: [
          {
            field: "usernameOrEmail",
            message: "Username does not exist",
          },
        ],
      };
    }
    const valid = await argon2.verify(user.password, password);
    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            message: "Incorrect password",
          },
        ],
      };
    }
    req.session.userId = user.id;
    return {
      user,
    };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }
        resolve(true);
      })
    );
  }
}
