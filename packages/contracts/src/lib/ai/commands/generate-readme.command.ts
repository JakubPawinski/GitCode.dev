import { IsNotEmpty, IsUUID } from "class-validator";

export class GenerateReadmeCommand {
    @IsUUID()
    @IsNotEmpty()
    userId: string;

    constructor(userId: string) {
        this.userId = userId;
    }
}