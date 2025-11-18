import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SubmissionService } from './submission.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('problems/submission')
export class SubmissionController {
  constructor(private readonly submissionService: SubmissionService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createSubmissionDto: CreateSubmissionDto, @Req() req) {
    const userId = req.user.id;
    return this.submissionService.create(createSubmissionDto, userId);
  }
}
