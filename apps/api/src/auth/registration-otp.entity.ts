import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'registration_otps' })
export class RegistrationOtp {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 80 })
  displayName!: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  phone!: string;

  // Đây là mật khẩu đã băm, không lưu mật khẩu khách nhập ở dạng rõ
  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  // Chỉ lưu mã OTP đã băm
  @Column({ name: 'otp_hash', type: 'varchar', length: 64 })
  otpHash!: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'attempt_count', type: 'integer', default: 0 })
  attemptCount!: number;

  @Column({
    name: 'consumed_at',
    type: 'timestamptz',
    nullable: true,
  })
  consumedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}