import type { Request, Response } from "express";
import type { ItemService } from "./item.service";
import { itemService } from "./item.service";
import type { ItemPathResponse, NodeResponse } from "../../types/api";
import { toNodeDto } from "../../utils/node-response";
import {
  requireAuthenticatedUser,
  requireNonEmptyString,
  requireObjectBody
} from "../../utils/validation";

export class ItemController {
  constructor(private readonly service: ItemService = itemService) {}

  async createItem(req: Request, res: Response<NodeResponse>): Promise<void> {
    const user = requireAuthenticatedUser(req.user);
    const body = requireObjectBody(req.body);
    const item = await this.service.createItem({
      userId: user.id,
      name: body.name,
      parentId: body.parentId,
      metadata: body.metadata,
      images: body.images,
      tags: body.tags,
      description: body.description,
      quantity: body.quantity
    });

    res.status(201).json({ data: toNodeDto(item) });
  }

  async getItem(req: Request, res: Response<NodeResponse>): Promise<void> {
    const itemId = requireNonEmptyString(req.params.itemId, "itemId");
    const user = requireAuthenticatedUser(req.user);
    const item = await this.service.getItem(itemId, user.id);

    res.status(200).json({ data: toNodeDto(item) });
  }

  async updateItem(req: Request, res: Response<NodeResponse>): Promise<void> {
    const itemId = requireNonEmptyString(req.params.itemId, "itemId");
    const user = requireAuthenticatedUser(req.user);
    const body = requireObjectBody(req.body);
    const item = await this.service.updateItem(itemId, user.id, {
      name: body.name,
      metadata: body.metadata,
      images: body.images,
      tags: body.tags,
      description: body.description,
      quantity: body.quantity
    });

    res.status(200).json({ data: toNodeDto(item) });
  }

  async moveItem(req: Request, res: Response<NodeResponse>): Promise<void> {
    const itemId = requireNonEmptyString(req.params.itemId, "itemId");
    const user = requireAuthenticatedUser(req.user);
    const body = requireObjectBody(req.body);
    const item = await this.service.moveItem(itemId, user.id, {
      parentId: body.parentId
    });

    res.status(200).json({ data: toNodeDto(item) });
  }

  async deleteItem(req: Request, res: Response): Promise<void> {
    const itemId = requireNonEmptyString(req.params.itemId, "itemId");
    const user = requireAuthenticatedUser(req.user);

    await this.service.deleteItem(itemId, user.id);

    res.status(204).send();
  }

  async getItemPath(req: Request, res: Response<ItemPathResponse>): Promise<void> {
    const itemId = requireNonEmptyString(req.params.itemId, "itemId");
    const user = requireAuthenticatedUser(req.user);
    const itemPath = await this.service.getItemPath(itemId, user.id);

    res.status(200).json({ data: itemPath });
  }
}

export const itemController = new ItemController();
