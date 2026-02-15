import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task, TaskDocument } from './schemas/task.schema';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
  ) {}

  private toObjectId(id: string, name: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${name}`);
    }
    return new Types.ObjectId(id);
  }

  findAllForUser(userId: string) {
    const ownerObjectId = this.toObjectId(userId, 'user id');

    return this.taskModel
      .find({ ownerId: ownerObjectId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async createForUser(userId: string, dto: CreateTaskDto) {
    const ownerObjectId = this.toObjectId(userId, 'user id');

    const task = new this.taskModel({
      ...dto,
      ownerId: ownerObjectId,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
    });

    return task.save();
  }

  async updateForUser(userId: string, id: string, dto: UpdateTaskDto) {
    const taskObjectId = this.toObjectId(id, 'task id');
    const ownerObjectId = this.toObjectId(userId, 'user id');

    const update: Partial<Task> = { ...dto } as Partial<Task>;
    if (dto.dueDate !== undefined) {
      update.dueDate = dto.dueDate ? new Date(dto.dueDate) : undefined;
    }

    const task = await this.taskModel
      .findOneAndUpdate(
        { _id: taskObjectId, ownerId: ownerObjectId },
        update,
        { new: true, runValidators: true },
      )
      .exec();

    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async deleteForUser(userId: string, id: string) {
    const taskObjectId = this.toObjectId(id, 'task id');
    const ownerObjectId = this.toObjectId(userId, 'user id');

    const task = await this.taskModel
      .findOneAndDelete({ _id: taskObjectId, ownerId: ownerObjectId })
      .exec();

    if (!task) throw new NotFoundException('Task not found');
    return task;
  }
}
