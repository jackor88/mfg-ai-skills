import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContextService } from '../context/tenant-context.service';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly tenantContextService: TenantContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user?.tenantId) {
      return new Observable((subscriber) => {
        this.tenantContextService.run(
          {
            tenantId: user.tenantId,
            userId: user.userId,
            username: user.username,
          },
          () => {
            next.handle().subscribe({
              next: (val) => subscriber.next(val),
              error: (err) => subscriber.error(err),
              complete: () => subscriber.complete(),
            });
          },
        );
      });
    }

    return next.handle();
  }
}
