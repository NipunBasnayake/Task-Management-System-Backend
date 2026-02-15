import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

@Schema({ timestamps: true })
export class Task {
  @Prop({ type: Types.ObjectId, ref: User.name, index: true, required: true })
  ownerId: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 200 })
  title: string;

  @Prop({ trim: true, maxlength: 1000 })
  description?: string;

  @Prop({ enum: TaskStatus, default: TaskStatus.TODO })
  status: TaskStatus;

  @Prop()
  dueDate?: Date;

  id?: string;
}

export type TaskDocument = HydratedDocument<Task>;
export const TaskSchema = SchemaFactory.createForClass(Task);

TaskSchema.set('toJSON', {
  versionKey: false,
  virtuals: true,
  transform: (_doc, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});
