import { ObjectType, Field } from "type-graphql";
import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  BaseEntity,
  OneToMany,
  ManyToOne,
} from "typeorm";
import { Log } from "./Log";
import { User } from "./User";

@ObjectType()
@Entity()
export class Category extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column({ unique: true })
  colour!: string;

  @Field()
  @Column({ unique: true })
  tag!: string;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => [String])
  @Column("text", { array: true })
  possibleValues: string[];

  @Field()
  @Column()
  type: string;

  @OneToMany(() => Log, (log) => log.category)
  logs: Log[];

  @ManyToOne(() => User, (user) => user.categories)
  creator: User;
}
