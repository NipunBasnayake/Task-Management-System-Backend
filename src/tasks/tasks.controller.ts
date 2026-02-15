import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@UseGuards(JwtAuthGuard)
@Controller('api/v1/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  async getTasks(@CurrentUser() user: AuthUser) {
    const tasks = await this.tasksService.findAllForUser(user.userId);
    return { tasks };
  }

  @Post()
  async createTask(@CurrentUser() user: AuthUser, @Body() dto: CreateTaskDto) {
    const task = await this.tasksService.createForUser(user.userId, dto);
    return { task };
  }

  @Put(':id')
  async updateTask(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    const task = await this.tasksService.updateForUser(user.userId, id, dto);
    return { task };
  }

  @Delete(':id')
  async deleteTask(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.tasksService.deleteForUser(user.userId, id);
    return { message: 'Task deleted' };
  }
}
