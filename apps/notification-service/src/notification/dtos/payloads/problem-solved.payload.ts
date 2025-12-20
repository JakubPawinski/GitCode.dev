import { IsString, IsUUID } from "class-validator";
import { GenericNotificationPayload } from "./generic.payload";

export class ProblemSolvedPayload extends GenericNotificationPayload {
    @IsUUID()
    problemId: string;

    @IsString()
    slug: string;

}