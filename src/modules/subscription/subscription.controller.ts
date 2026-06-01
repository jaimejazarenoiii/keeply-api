import type { Request, Response } from "express";
import type { SubscriptionService } from "./subscription.service";
import { subscriptionService } from "./subscription.service";
import type {
  SubscriptionEventAcceptedResponse,
  SubscriptionStatusResponse
} from "../../types/api";
import { ApiError } from "../../utils/errors";
import { requireAuthenticatedUser, requireObjectBody } from "../../utils/validation";

export class SubscriptionController {
  constructor(
    private readonly service: SubscriptionService = subscriptionService,
    private readonly webhookAuthToken = ""
  ) {}

  async getStatus(req: Request, res: Response<SubscriptionStatusResponse>): Promise<void> {
    const user = requireAuthenticatedUser(req.user);
    const status = await this.service.getStatus(user.id);

    res.status(200).json({ data: status });
  }

  async receiveRevenueCatWebhook(
    req: Request,
    res: Response<SubscriptionEventAcceptedResponse>
  ): Promise<void> {
    this.requireValidWebhookAuthorization(req.header("authorization"));
    const body = requireObjectBody(req.body);
    const result = await this.service.processRevenueCatWebhook({ payload: body });

    res.status(202).json({ data: result });
  }

  private requireValidWebhookAuthorization(headerValue: string | undefined): void {
    if (!this.webhookAuthToken || !headerValue) {
      throw new ApiError(401, "AUTHENTICATION_REQUIRED", "Valid webhook authorization is required");
    }

    const expectedBearer = `Bearer ${this.webhookAuthToken}`;

    if (headerValue !== this.webhookAuthToken && headerValue !== expectedBearer) {
      throw new ApiError(401, "AUTHENTICATION_REQUIRED", "Valid webhook authorization is required");
    }
  }
}

export const subscriptionController = new SubscriptionController();
