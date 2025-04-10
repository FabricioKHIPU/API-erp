import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    validateToken(token: string): any {
        try {
            const decoded = this.jwtService.decode(token);
            // console.log('Decoded token:', decoded);
            return decoded;
        } catch (error) {
            throw new UnauthorizedException('Token inválido');
        }
    }


}
