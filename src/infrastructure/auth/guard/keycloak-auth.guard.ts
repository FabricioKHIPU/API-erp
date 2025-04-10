import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class KeycloakAuthGuard implements CanActivate {
    constructor(private authService: AuthService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'];

        try {
            if (!authHeader) {
                throw new UnauthorizedException('Token no proporcionado');
            }
            const [bearer, token] = authHeader.split(' ');
            if (bearer !== 'Bearer' || !token) {
                throw new UnauthorizedException('Formato del token inválido');
            }
            console.log('Token:', token);
            const decodedToken = this.authService.validateToken(token);
            console.log('Decoded token:', decodedToken);
            request.user = decodedToken;
            // console.log('User:', request.user);

            if (!decodedToken) {
                throw new UnauthorizedException('Token inválido o expirado');
            } else if (!decodedToken.realm_access || !decodedToken.realm_access.roles.includes('default-roles-master')) {
                throw new UnauthorizedException('No tienes permisos para acceder a este recurso');
            }
            return true;
        } catch (error) {
            console.error('Error en la validación del token:', error);
            throw new UnauthorizedException('Token inválido o expirado');
        }
    }
}
