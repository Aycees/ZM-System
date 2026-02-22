import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(username: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, username: user.username, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }

  async signup(username: string, password: string, role: UserRole, employeeId?: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // If linking to an employee, verify the employee exists
    if (employeeId) {
      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId },
      });
      if (!employee) {
        throw new UnauthorizedException('Employee not found');
      }
      // Check if employee is already linked to a user
      const existingLink = await this.prisma.user.findUnique({
        where: { employeeId },
      });
      if (existingLink) {
        throw new ConflictException('Employee already linked to a user account');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        username,
        passwordHash: hashedPassword,
        role,
        employeeId: role === 'MANAGER' ? employeeId : null,
      },
    });

    return {
      id: user.id,
      username: user.username,
      role: user.role,
    };
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, role: true, employeeId: true },
    });
  }
}
