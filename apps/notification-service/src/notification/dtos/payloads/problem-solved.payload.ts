import { IsString, IsUUID } from "class-validator";

export class ProblemSolvedPayload {
    @IsUUID()
    problemId: string;

    @IsString()
    slug: string;

    @IsString()
    title: string;
}