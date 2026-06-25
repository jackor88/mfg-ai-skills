import { Injectable, Scope } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

interface TenantContext {
  tenantId: string;
  userId: string;
  username: string;
}

@Injectable({ scope: Scope.DEFAULT })
export class TenantContextService {
  private readonly storage = new AsyncLocalStorage<TenantContext>();

  run(context: TenantContext, callback: () => void) {
    this.storage.run(context, callback);
  }

  get(): TenantContext | undefined {
    return this.storage.getStore();
  }

  getTenantId(): string | undefined {
    return this.storage.getStore()?.tenantId;
  }

  getUserId(): string | undefined {
    return this.storage.getStore()?.userId;
  }
}
