export const transformMissionType = (rawType: string | undefined) =>
  rawType
    ?.toLowerCase()
    .replace(/dark sector/gi, '')
    .replace(/\s/g, '')
    .trim() ?? '';

export type FissureLike = {
  missionTypeKey?: string;
  node?: string;
  nodeKey?: string;
  tierNum?: number;
  isHard?: boolean;
};

/** Stable slug from WS nodeKey / node for custom tracking keys. */
export const fissureNodeSlug = (nodeKey: string | undefined) => {
  if (!nodeKey) return '';
  return nodeKey
    .toLowerCase()
    .replace(/\(/g, '_')
    .replace(/\)/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
};

export const fissureTypeKey = (fissure: FissureLike) => {
  const mission = transformMissionType(fissure.missionTypeKey);
  return `fissures.${fissure.isHard ? 'sp.' : ''}t${fissure.tierNum}.${mission}`;
};

export const fissureNodeTypeKey = (fissure: FissureLike) => {
  const slug = fissureNodeSlug(fissure.nodeKey || fissure.node);
  if (!slug) return undefined;
  return `fissures.${fissure.isHard ? 'sp.' : ''}node.${slug}`;
};

export const FISSURE_NODE_TRACKABLE_PATTERN = /^fissures(\.sp)?\.node\.[a-z0-9_]+$/;
