import axios from "axios";
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
}

@Resolver(Note)
export class NoteResolver {
  @Query(() => PaginatedNotes)
  async notes(@Ctx() { req }: MyContext): Promise<PaginatedNotes> {
    const res = await axios.post(`${process.env.NOTES_SERVICE_ENDPOINT_PAG}`, {
      creatorId: req.session.userId,
    });
    return {
      notes: res.data.notes,
    };
  }

  @Mutation(() => Note)
  @UseMiddleware(isAuth)
  async createNote(
    @Arg("input") input: NoteInput,
    @Ctx() { req }: MyContext
  ): Promise<Note> {
    const res = await axios.post(`${process.env.NOTES_SERVICE_ENDPOINT}`, {
      text: input.text,
      creatorId: req.session.userId,
    });
    return res.data.note;
  }

  @Mutation(() => Note, { nullable: true })
  @UseMiddleware(isAuth)
  async updateNote(
    @Arg("id", () => Int) id: number,
    @Arg("text") text: string
  ): Promise<Note | null> {
    const res = await axios.put(`${process.env.NOTES_SERVICE_ENDPOINT}`, {
      text: text,
      id: id,
    });
    return res.data.note;
  }

  @Mutation(() => Boolean)
  async deleteNote(@Arg("id") id: number): Promise<boolean> {
    const res = await axios.delete(`${process.env.NOTES_SERVICE_ENDPOINT}`, {
      data: {
        id: id,
      },
    });
    return res.data;
  }
}
