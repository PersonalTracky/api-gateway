import {
  Arg,
  Ctx,
  Field,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { getConnection } from "typeorm";
import { Note } from "../entities/Note";
import { MyContext } from "../types/types";
import { isAuth } from "./middleware/isAuth";

@InputType()
class NoteInput {
  @Field()
  text: string;
}

@ObjectType()
class PaginatedNotes {
  @Field(() => [Note])
  notes: Note[];
  @Field()
  hasMore: boolean;
}

@Resolver(Note)
export class NoteResolver {
  @Query(() => PaginatedNotes)
  async notes(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
    @Ctx() { req }: MyContext
  ): Promise<PaginatedNotes> {
    // Enforcing a maximum limit means that we can not over request even if
    // a high limit is set. Rate limit plus one means that we can look ahead
    // and see if there are more notes in the pagination
    const realLimit = Math.min(50, limit);
    const reaLimitPlusOne = realLimit + 1;
    const qb = getConnection()
      .getRepository(Note)
      .createQueryBuilder("n")
      .where('"creatorId" = :creatorId', { creatorId: req.session.userId })
      .orderBy('"createdAt"', "DESC")
      .take(reaLimitPlusOne);

    if (cursor) {
      qb.where('"createdAt" < :cursor', {
        cursor: new Date(parseInt(cursor)),
      });
    }
    const notes = await qb.getMany();
    return {
      notes: notes.slice(0, realLimit),
      hasMore: notes.length === reaLimitPlusOne,
    };
  }

  @Mutation(() => Note)
  @UseMiddleware(isAuth)
  async createNote(
    @Arg("input") input: NoteInput,
    @Ctx() { req }: MyContext
  ): Promise<Note> {
    return Note.create({
      ...input,
      creatorId: req.session.userId,
    }).save();
  }

  @Mutation(() => Note, { nullable: true })
  @UseMiddleware(isAuth)
  async updateNote(
    @Arg("id", () => Int) id: number,
    @Arg("text") text: string
  ): Promise<Note | null> {
    const note = await Note.findOne(id);
    if (!note) {
      return null;
    }
    await Note.update({ id }, { text });
    return note;
  }

  @Mutation(() => Boolean)
  async deleteNote(@Arg("id") id: number): Promise<boolean> {
    await Note.delete(id);
    return true;
  }
}
