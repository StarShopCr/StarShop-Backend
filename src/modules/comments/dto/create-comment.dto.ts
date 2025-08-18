import { IsUUID, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateCommentDto {
    @IsUUID()
    requestId: string;

    @IsUUID()
    userId: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(1)
    text: string;
}
