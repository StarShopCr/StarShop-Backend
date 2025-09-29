import { ApiProperty } from '@nestjs/swagger';

export class ChallengeResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Challenge data',
    example: {
      challenge: 'Please sign this message to authenticate: 1234567890',
      walletAddress: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890123456789012345678901234567890',
      timestamp: 1640995200000,
    },
  })
  data: {
    challenge: string;
    walletAddress: string;
    timestamp: number;
  };
}

export class UserDto {
  @ApiProperty({
    description: 'Stellar wallet address',
    example: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890123456789012345678901234567890',
  })
  walletAddress: string;

  @ApiProperty({
    description: 'User display name',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User role',
    example: 'buyer',
  })
  role: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Authentication data',
    example: {
      user: {
        walletAddress: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890123456789012345678901234567890',
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'buyer',
      },
      expiresIn: 3600,
    },
  })
  data: {
    user: UserDto;
    expiresIn: number;
  };
}

export class UserResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'User data',
    example: {
      walletAddress: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890123456789012345678901234567890',
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'buyer',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  })
  data: {
    walletAddress: string;
    name: string;
    email: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

export class LogoutResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Logout message',
    example: 'Logged out successfully',
  })
  message: string;
}
