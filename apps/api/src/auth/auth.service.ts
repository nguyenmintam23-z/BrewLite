import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import {
  createHmac,
  createHash,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from 'node:crypto';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { RegistrationOtp } from './registration-otp.entity';
import { PasswordResetOtp } from './password-reset-otp.entity';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(RegistrationOtp)
    private readonly otpRepository: Repository<RegistrationOtp>,

    @InjectRepository(PasswordResetOtp)
    private readonly passwordResetOtpRepository: Repository<PasswordResetOtp>,
    private readonly jwtService: JwtService,
  ) {}
  async loginCustomer(phone: string, password: string) {
  const user = await this.userRepository.findOneBy({
    phone,
    role: UserRole.CUSTOMER,
    isActive: true,
  });

  if (!user || !(await compare(password, user.passwordHash))) {
    throw new UnauthorizedException('Số điện thoại hoặc mật khẩu không đúng');
  }

  const accessToken = await this.jwtService.signAsync({
    sub: user.id,
    role: user.role,
  });

  return {
    accessToken,
    tokenType: 'Bearer',
    role: user.role,
    displayName: user.displayName,
  };
}
  async loginInternal(username: string, password: string) {
  const expectedRole =
    username === 'staff' ? UserRole.STAFF : UserRole.MANAGER;

  const user = await this.userRepository.findOneBy({
    username,
    role: expectedRole,
    isActive: true,
  });

  if (!user || !(await compare(password, user.passwordHash))) {
    throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không đúng');
  }

  const accessToken = await this.jwtService.signAsync({
    sub: user.id,
    role: user.role,
  });

  return {
    accessToken,
    tokenType: 'Bearer',
    role: user.role,
    displayName: user.displayName,
  };
}
  async verifyCustomerOtp(phone: string, otp: string) {
  const challenge = await this.otpRepository.findOneBy({ phone });

  if (!challenge || challenge.consumedAt) {
    throw new UnauthorizedException('OTP không hợp lệ hoặc đã được sử dụng');
  }

  if (challenge.expiresAt.getTime() < Date.now()) {
    throw new UnauthorizedException('OTP đã hết hạn, hãy yêu cầu mã mới');
  }

  if (challenge.attemptCount >= 5) {
    throw new UnauthorizedException('Bạn đã nhập sai OTP quá số lần cho phép');
  }

  const secret = process.env.OTP_SECRET;
  if (!secret) {
    throw new Error('Thiếu OTP_SECRET trong file .env');
  }

  const submittedHash = createHmac('sha256', secret)
    .update(`${phone}:${otp}`)
    .digest('hex');

  const savedBuffer = Buffer.from(challenge.otpHash, 'hex');
  const submittedBuffer = Buffer.from(submittedHash, 'hex');

  if (!timingSafeEqual(savedBuffer, submittedBuffer)) {
    challenge.attemptCount += 1;
    await this.otpRepository.save(challenge);
    throw new UnauthorizedException('OTP không đúng');
  }

  const existingUser = await this.userRepository.findOneBy({ phone });
  if (existingUser) {
    throw new ConflictException('Số điện thoại này đã đăng ký');
  }

  const user = this.userRepository.create({
    displayName: challenge.displayName,
    phone: challenge.phone,
    passwordHash: challenge.passwordHash,
    role: UserRole.CUSTOMER,
    isActive: true,
  });

  await this.userRepository.save(user);

  challenge.consumedAt = new Date();
  await this.otpRepository.save(challenge);

  return {
    message: 'Xác minh thành công. Hãy đăng nhập bằng tài khoản vừa tạo.',
  };
}

  async requestCustomerOtp(dto: RegisterCustomerDto) {
    const existingUser = await this.userRepository.findOneBy({
      phone: dto.phone,
    });

    if (existingUser) {
      throw new ConflictException('Số điện thoại này đã đăng ký');
    }

    const secret = process.env.OTP_SECRET;
    if (!secret) {
      throw new Error('Thiếu OTP_SECRET trong file .env');
    }

    const passwordHash = await hash(dto.password, 10);
    const otp = randomInt(100000, 1000000).toString();
    const otpHash = createHmac('sha256', secret)
      .update(`${dto.phone}:${otp}`)
      .digest('hex');

    let pending = await this.otpRepository.findOneBy({
      phone: dto.phone,
    });

    const values = {
      displayName: dto.displayName,
      phone: dto.phone,
      passwordHash,
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attemptCount: 0,
      consumedAt: null,
    };

    if (pending) {
      Object.assign(pending, values);
    } else {
      pending = this.otpRepository.create(values);
    }

    await this.otpRepository.save(pending);

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV OTP] Mã xác minh thử nghiệm: ${otp}`);
    }

    return {
      message: 'Đã tạo OTP thử nghiệm. Xem mã trong terminal NestJS.',
    };
  }

  async requestPasswordResetOtp(phone: string) {
    const user = await this.userRepository.findOneBy({
      phone,
      role: UserRole.CUSTOMER,
      isActive: true,
    });

    if (user) {
      const secret = process.env.OTP_SECRET;
      if (!secret) {
        throw new Error('Thiếu OTP_SECRET trong file .env');
      }

      const otp = randomInt(100000, 1000000).toString();
      const otpHash = createHmac('sha256', secret)
        .update(`${phone}:${otp}`)
        .digest('hex');
      let challenge = await this.passwordResetOtpRepository.findOneBy({ phone });
      const values = {
        otpHash,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        attemptCount: 0,
        consumedAt: null,
        resetTokenHash: null,
        resetTokenExpiresAt: null,
      };

      if (challenge) {
        Object.assign(challenge, values);
      } else {
        challenge = this.passwordResetOtpRepository.create({ phone, ...values });
      }
      await this.passwordResetOtpRepository.save(challenge);

      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV OTP] Mã khôi phục mật khẩu thử nghiệm: ${otp}`);
      }
    }

    return {
      message: 'Nếu số điện thoại có tài khoản khách hàng, mã xác minh sẽ được gửi đến số đó.',
    };
  }

  async verifyPasswordResetOtp(phone: string, otp: string) {
    const challenge = await this.passwordResetOtpRepository.findOneBy({ phone });

    if (!challenge || challenge.consumedAt) {
      throw new UnauthorizedException('OTP không hợp lệ hoặc đã được sử dụng');
    }
    if (challenge.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('OTP đã hết hạn, hãy yêu cầu mã mới');
    }
    if (challenge.attemptCount >= 5) {
      throw new UnauthorizedException('Bạn đã nhập sai OTP quá số lần cho phép');
    }

    const secret = process.env.OTP_SECRET;
    if (!secret) {
      throw new Error('Thiếu OTP_SECRET trong file .env');
    }

    const submittedHash = createHmac('sha256', secret)
      .update(`${phone}:${otp}`)
      .digest('hex');
    const savedBuffer = Buffer.from(challenge.otpHash, 'hex');
    const submittedBuffer = Buffer.from(submittedHash, 'hex');

    if (!timingSafeEqual(savedBuffer, submittedBuffer)) {
      challenge.attemptCount += 1;
      await this.passwordResetOtpRepository.save(challenge);
      throw new UnauthorizedException('OTP không đúng');
    }

    const resetToken = randomBytes(32).toString('hex');
    challenge.consumedAt = new Date();
    challenge.resetTokenHash = createHash('sha256').update(resetToken).digest('hex');
    challenge.resetTokenExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.passwordResetOtpRepository.save(challenge);

    return { resetToken };
  }

  async resetCustomerPassword(phone: string, resetToken: string, password: string) {
    const [user, challenge] = await Promise.all([
      this.userRepository.findOneBy({
        phone,
        role: UserRole.CUSTOMER,
        isActive: true,
      }),
      this.passwordResetOtpRepository.findOneBy({ phone }),
    ]);

    const savedTokenHash = challenge?.resetTokenHash;
    const submittedTokenHash = createHash('sha256').update(resetToken).digest('hex');
    if (
      !user ||
      !challenge ||
      !savedTokenHash ||
      !challenge.resetTokenExpiresAt ||
      challenge.resetTokenExpiresAt.getTime() < Date.now() ||
      !timingSafeEqual(Buffer.from(savedTokenHash, 'hex'), Buffer.from(submittedTokenHash, 'hex'))
    ) {
      throw new UnauthorizedException('Yêu cầu đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
    }

    user.passwordHash = await hash(password, 10);
    await this.userRepository.save(user);
    challenge.resetTokenHash = null;
    challenge.resetTokenExpiresAt = null;
    await this.passwordResetOtpRepository.save(challenge);

    return { message: 'Đổi mật khẩu thành công. Hãy đăng nhập bằng mật khẩu mới.' };
  }
}