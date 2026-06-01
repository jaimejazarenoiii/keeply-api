import type { Request, Response } from "express";
import type { AuthService } from "./auth.service";
import { authService } from "./auth.service";
import type { AuthTokenResponse, AuthUserResponse } from "../../types/api";
import { requireAuthenticatedUser, requireObjectBody } from "../../utils/validation";

export class AuthController {
  constructor(private readonly service: AuthService = authService) {}

  async register(req: Request, res: Response<AuthTokenResponse>): Promise<void> {
    const body = requireObjectBody(req.body);
    const result = await this.service.register({
      email: body.email,
      password: body.password,
      name: body.name,
      profileImageUrl: body.profileImageUrl,
      userAgent: req.header("user-agent"),
      ipAddress: req.ip
    });

    res.status(201).json({ data: result });
  }

  async login(req: Request, res: Response<AuthTokenResponse>): Promise<void> {
    const body = requireObjectBody(req.body);
    const result = await this.service.login({
      email: body.email,
      password: body.password,
      userAgent: req.header("user-agent"),
      ipAddress: req.ip
    });

    res.status(200).json({ data: result });
  }

  async refresh(req: Request, res: Response<AuthTokenResponse>): Promise<void> {
    const body = requireObjectBody(req.body);
    const result = await this.service.refresh({
      refreshToken: body.refreshToken,
      userAgent: req.header("user-agent"),
      ipAddress: req.ip
    });

    res.status(200).json({ data: result });
  }

  async logout(req: Request, res: Response): Promise<void> {
    const body = requireObjectBody(req.body);

    await this.service.logout({
      refreshToken: body.refreshToken
    });

    res.status(204).send();
  }

  async me(req: Request, res: Response<AuthUserResponse>): Promise<void> {
    const user = requireAuthenticatedUser(req.user);
    const currentUser = await this.service.getCurrentUser(user.id);

    res.status(200).json({ data: currentUser });
  }
}

export const authController = new AuthController();
