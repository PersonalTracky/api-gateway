import { ObjectType, Field } from "type-graphql";
import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  BaseEntity,
  ManyToOne,
} from "typeorm";
import { Category } from "./Category";
import { User } from "./User";

@ObjectType()
@Entity()
export class Log extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column({ unique: true })
  body: string;

  @Field(() => String)
  @CreateDateColumn()
  dateStart!: Date;

  @Field(() => String)
  @CreateDateColumn()
  dateEnd: Date;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Category, (category) => category.logs, {
    onDelete:"CASCADE"
  })
  category: Category;

  @ManyToOne(() => User, (user) => user.logs)
  creator: User;
}
