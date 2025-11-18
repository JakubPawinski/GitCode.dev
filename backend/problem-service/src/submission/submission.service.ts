import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SubmissionService {
  constructor(private prisma: PrismaService) {}

  async create(createSubmissionDto: CreateSubmissionDto, userId: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { problemId: createSubmissionDto.problemId },
      include: { testCases: true },
    });

    if (!problem) {
      throw new NotFoundException(
        `Problem with ID ${createSubmissionDto.problemId} does not exist in database.`,
      );
    }
    const languages = process.env.LANGUAGES_SUPPORTED?.split(',');
    if (!languages?.includes(createSubmissionDto.language.toLocaleLowerCase()))
      throw new BadRequestException(`Submission language not supported.`);

    const userSubmission = await this.prisma.userSubmission.upsert({
      where: {
        userId_problemId: {
          userId,
          problemId: createSubmissionDto.problemId,
        },
      },
      update: {
        currentCode: createSubmissionDto.code,
        currentLanguage: createSubmissionDto.language.toLocaleLowerCase(),
        status: 'in_progress',
        updatedAt: new Date(),
      },
      create: {
        userId,
        problemId: createSubmissionDto.problemId,
        currentCode: createSubmissionDto.code,
        currentLanguage: createSubmissionDto.language,
        status: 'in_progress',
        totalTestCases: problem.testCases.length,
      },
    });

    const attempt = await this.prisma.solutionAttempt.create({
      data: {
        submissionId: userSubmission.id,
        code: createSubmissionDto.code,
        language: createSubmissionDto.language,
        attemptNumber:
          (await this.prisma.solutionAttempt.count({
            where: { submissionId: userSubmission.id },
          })) + 1,
        status: 'pending',
        totalTests: problem.testCases.length,
      },
    });
    return attempt;
  }
}
