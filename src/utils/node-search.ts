import type { NodeRecord, NodeType } from "../types/node";

export interface NodeSearchCriteria {
  query: string;
  types?: NodeType[];
  limit: number;
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function nodeMatchesSearch(
  node: NodeRecord,
  criteria: Omit<NodeSearchCriteria, "limit">
): boolean {
  if (criteria.types?.length && !criteria.types.includes(node.type)) {
    return false;
  }

  return nodeMatchesQuery(node, criteria.query);
}

export function nodeMatchesQuery(node: NodeRecord, query: string): boolean {
  if (includesCaseInsensitive(node.name, query)) {
    return true;
  }

  if (node.description && includesCaseInsensitive(node.description, query)) {
    return true;
  }

  return (node.tags ?? []).some((tag) => includesCaseInsensitive(tag, query));
}

export function sortNodesByRecency(nodes: NodeRecord[]): NodeRecord[] {
  return [...nodes].sort((left, right) => {
    const updatedDiff = right.updatedAt.getTime() - left.updatedAt.getTime();

    if (updatedDiff !== 0) {
      return updatedDiff;
    }

    const createdDiff = right.createdAt.getTime() - left.createdAt.getTime();

    if (createdDiff !== 0) {
      return createdDiff;
    }

    return right._id.localeCompare(left._id);
  });
}

function includesCaseInsensitive(value: string, query: string): boolean {
  return value.toLowerCase().includes(query.toLowerCase());
}

export function buildMongooseSearchFilter(
  userId: string,
  criteria: Omit<NodeSearchCriteria, "limit">
): Record<string, unknown> {
  const regex = escapeRegex(criteria.query);
  const filter: Record<string, unknown> = {
    userId,
    $or: [
      { name: { $regex: regex, $options: "i" } },
      { description: { $regex: regex, $options: "i" } },
      { tags: { $regex: regex, $options: "i" } }
    ]
  };

  if (criteria.types?.length) {
    filter.type = criteria.types.length === 1 ? criteria.types[0] : { $in: criteria.types };
  }

  return filter;
}
