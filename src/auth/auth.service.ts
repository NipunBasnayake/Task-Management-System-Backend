import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response, Request } from 'express';
import * as bcrypt from 'bcryptjs';
import ms, { StringValue } from 'ms';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserDocument } from '../users/schemas/user.schema';
import { UsersService } from 'src/users/user.service';
import { JwtPayload } from './types/jwt-payload';

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await this.hashData(dto.password);

    try {
      const user = await this.usersService.createUser(email, passwordHash);
      return { user: this.safeUser(user) };
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('Email already in use');
      }
      throw error;
    }
  }

  async login(dto: LoginDto, res: Response) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { accessToken, refreshToken } = await this.issueTokens(user);
    const refreshTokenHash = await this.hashData(refreshToken);
    await this.usersService.setRefreshTokenHash(user.id, refreshTokenHash);

    this.setAuthCookies(res, accessToken, refreshToken);

    return { user: this.safeUser(user) };
  }

  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies?.refresh_token as string | undefined;
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!refreshSecret) {
      throw new UnauthorizedException('Server misconfigured: missing refresh secret');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      this.clearAuthCookies(res);
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.refreshTokenHash) {
      this.clearAuthCookies(res);
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isValid) {
      this.clearAuthCookies(res);
      throw new UnauthorizedException('Invalid refresh token');
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.issueTokens(user);

    await this.usersService.setRefreshTokenHash(
      user.id,
      await this.hashData(newRefreshToken),
    );

    this.setAuthCookies(res, accessToken, newRefreshToken);

    return { user: this.safeUser(user) };
  }

  async logout(req: Request, res: Response) {
    const refreshToken = req.cookies?.refresh_token as string | undefined;

    if (refreshToken) {
      try {
        const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
        if (refreshSecret) {
          const payload = await this.jwtService.verifyAsync<JwtPayload>(
            refreshToken,
            { secret: refreshSecret },
          );
          await this.usersService.setRefreshTokenHash(payload.sub, null);
        }
      } catch {
        // Ignore errors during logout token verification
      }
    }

    this.clearAuthCookies(res);
    return { message: 'Logged out' };
  }

  private async issueTokens(user: UserDocument) {
    const payload: JwtPayload = { sub: String(user.id), email: user.email };

    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

    if (!accessSecret || !refreshSecret) {
      throw new UnauthorizedException('Server misconfigured: missing JWT secrets');
    }

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: accessSecret,
      expiresIn: this.getAccessTtl(),
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: refreshSecret,
      expiresIn: this.getRefreshTtl(),
    });

    return { accessToken, refreshToken };
  }

  private async hashData(data: string) {
    return bcrypt.hash(data, this.saltRounds);
  }

  private safeUser(user: UserDocument) {
    return { id: String(user.id), email: user.email };
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    const accessMaxAge = this.parseTtl(this.getAccessTtl());
    const refreshMaxAge = this.parseTtl(this.getRefreshTtl());

    res.cookie('access_token', accessToken, {
      ...this.baseCookieOptions(),
      ...(accessMaxAge ? { maxAge: accessMaxAge } : {}),
    });

    res.cookie('refresh_token', refreshToken, {
      ...this.baseCookieOptions(),
      ...(refreshMaxAge ? { maxAge: refreshMaxAge } : {}),
    });
  }

  private clearAuthCookies(res: Response) {
    const options = this.baseCookieOptions();
    res.clearCookie('access_token', options);
    res.clearCookie('refresh_token', options);
  }

  private baseCookieOptions() {
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: this.isCookieSecure(),
      path: '/',
    };
  }

  private isCookieSecure() {
    return this.configService.get<string>('COOKIE_SECURE', 'false') === 'true';
  }

  private getAccessTtl(): StringValue {
    return this.configService.get<StringValue>('ACCESS_TOKEN_TTL', '15m');
  }

  private getRefreshTtl(): StringValue {
    return this.configService.get<StringValue>('REFRESH_TOKEN_TTL', '7d');
  }

  private parseTtl(ttl: StringValue): number | undefined {
    const parsed = ms(ttl);
    return typeof parsed === 'number' ? parsed : undefined;
  }

  private isDuplicateKeyError(error: unknown) {
    return (
      !!error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    );
  }
}
