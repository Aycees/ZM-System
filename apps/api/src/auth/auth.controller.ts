import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, SignupDto } from './dto';

@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('auth/login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }

  // Hidden signup route - only accessible if you know the URL
  @Post('coca-cola')
  async signup(@Body() dto: SignupDto) {
    const user = await this.authService.signup(
      dto.username,
      dto.password,
      dto.role,
    );
    return { success: true, data: user, message: 'Account created successfully' };
  }
}
