import type { Request, Response } from "express";
import type { ContainerService } from "./container.service";
import { containerService } from "./container.service";
import type { NodeListResponse, NodeResponse, TreeResponse } from "../../types/api";
import { toNodeDto } from "../../utils/node-response";
import { requireNonEmptyString, requireObjectBody } from "../../utils/validation";

export class ContainerController {
  constructor(private readonly service: ContainerService = containerService) {}

  async createContainer(req: Request, res: Response<NodeResponse>): Promise<void> {
    const body = requireObjectBody(req.body);
    const container = await this.service.createContainer({
      name: body.name,
      parentId: body.parentId,
      metadata: body.metadata,
      images: body.images
    });

    res.status(201).json({ data: toNodeDto(container) });
  }

  async getContainerTree(req: Request, res: Response<TreeResponse>): Promise<void> {
    const containerId = requireNonEmptyString(req.params.containerId, "containerId");
    const tree = await this.service.getContainerTree(containerId);

    res.status(200).json({ data: tree });
  }

  async listSubtreeItems(req: Request, res: Response<NodeListResponse>): Promise<void> {
    const containerId = requireNonEmptyString(req.params.containerId, "containerId");
    const items = await this.service.listSubtreeItems(containerId);

    res.status(200).json({ data: items.map(toNodeDto) });
  }

  async updateContainer(req: Request, res: Response<NodeResponse>): Promise<void> {
    const containerId = requireNonEmptyString(req.params.containerId, "containerId");
    const body = requireObjectBody(req.body);
    const container = await this.service.updateContainer(containerId, {
      name: body.name,
      metadata: body.metadata,
      images: body.images
    });

    res.status(200).json({ data: toNodeDto(container) });
  }

  async moveContainer(req: Request, res: Response<NodeResponse>): Promise<void> {
    const containerId = requireNonEmptyString(req.params.containerId, "containerId");
    const body = requireObjectBody(req.body);
    const container = await this.service.moveContainer(containerId, {
      parentId: body.parentId
    });

    res.status(200).json({ data: toNodeDto(container) });
  }
}

export const containerController = new ContainerController();
