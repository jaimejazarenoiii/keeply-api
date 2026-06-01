import type { Request, Response } from "express";
import type { SpaceService } from "./space.service";
import { spaceService } from "./space.service";
import type { NodeResponse, SpaceListResponse, TreeResponse } from "../../types/api";
import { toNodeDto } from "../../utils/node-response";
import { requireNonEmptyString, requireObjectBody } from "../../utils/validation";

export class SpaceController {
  constructor(private readonly service: SpaceService = spaceService) {}

  async createSpace(req: Request, res: Response<NodeResponse>): Promise<void> {
    const body = requireObjectBody(req.body);
    const space = await this.service.createSpace({
      name: body.name,
      metadata: body.metadata,
      images: body.images
    });

    res.status(201).json({ data: toNodeDto(space) });
  }

  async listSpaces(_req: Request, res: Response<SpaceListResponse>): Promise<void> {
    const spaces = await this.service.listSpaces();

    res.status(200).json({ data: spaces.map(toNodeDto) });
  }

  async getSpaceTree(req: Request, res: Response<TreeResponse>): Promise<void> {
    const spaceId = requireNonEmptyString(req.params.spaceId, "spaceId");
    const tree = await this.service.getSpaceTree(spaceId);

    res.status(200).json({ data: tree });
  }

  async updateSpace(req: Request, res: Response<NodeResponse>): Promise<void> {
    const spaceId = requireNonEmptyString(req.params.spaceId, "spaceId");
    const body = requireObjectBody(req.body);
    const space = await this.service.updateSpace(spaceId, {
      name: body.name,
      metadata: body.metadata,
      images: body.images
    });

    res.status(200).json({ data: toNodeDto(space) });
  }

  async deleteSpace(req: Request, res: Response): Promise<void> {
    const spaceId = requireNonEmptyString(req.params.spaceId, "spaceId");

    await this.service.deleteSpace(spaceId);

    res.status(204).send();
  }
}

export const spaceController = new SpaceController();
