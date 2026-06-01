import type { Request, Response } from "express";
import type { ItemService } from "./item.service";
import { itemService } from "./item.service";
import type { ItemPathResponse, NodeResponse } from "../../types/api";
import { toNodeDto } from "../../utils/node-response";
import { requireNonEmptyString, requireObjectBody } from "../../utils/validation";

export class ItemController {
  constructor(private readonly service: ItemService = itemService) {}

  async createItem(req: Request, res: Response<NodeResponse>): Promise<void> {
    const body = requireObjectBody(req.body);
    const item = await this.service.createItem({
      name: body.name,
      parentId: body.parentId,
      metadata: body.metadata,
      images: body.images
    });

    res.status(201).json({ data: toNodeDto(item) });
  }

  async getItem(req: Request, res: Response<NodeResponse>): Promise<void> {
    const itemId = requireNonEmptyString(req.params.itemId, "itemId");
    const item = await this.service.getItem(itemId);

    res.status(200).json({ data: toNodeDto(item) });
  }

  async updateItem(req: Request, res: Response<NodeResponse>): Promise<void> {
    const itemId = requireNonEmptyString(req.params.itemId, "itemId");
    const body = requireObjectBody(req.body);
    const item = await this.service.updateItem(itemId, {
      name: body.name,
      metadata: body.metadata,
      images: body.images
    });

    res.status(200).json({ data: toNodeDto(item) });
  }

  async moveItem(req: Request, res: Response<NodeResponse>): Promise<void> {
    const itemId = requireNonEmptyString(req.params.itemId, "itemId");
    const body = requireObjectBody(req.body);
    const item = await this.service.moveItem(itemId, {
      parentId: body.parentId
    });

    res.status(200).json({ data: toNodeDto(item) });
  }

  async deleteItem(req: Request, res: Response): Promise<void> {
    const itemId = requireNonEmptyString(req.params.itemId, "itemId");

    await this.service.deleteItem(itemId);

    res.status(204).send();
  }

  async getItemPath(req: Request, res: Response<ItemPathResponse>): Promise<void> {
    const itemId = requireNonEmptyString(req.params.itemId, "itemId");
    const itemPath = await this.service.getItemPath(itemId);

    res.status(200).json({ data: itemPath });
  }
}

export const itemController = new ItemController();
