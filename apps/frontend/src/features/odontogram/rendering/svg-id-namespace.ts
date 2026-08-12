export interface SvgIdNamespaceOptions {
  readonly namespacePrefix: string;
  readonly toothPosition: number;
  readonly view: string;
}

export interface NamespacedSvgTemplate {
  readonly svg: SVGSVGElement;
  readonly layerIdByOriginalId: ReadonlyMap<string, string>;
}

const URL_FRAGMENT_REFERENCE_PATTERN = /url\(\s*(['"]?)#([^)'"\s]+)\1\s*\)/gu;
const DIRECT_FRAGMENT_REFERENCE_PATTERN = /^#(.+)$/u;
const TOKENIZED_FRAGMENT_ATTRIBUTES = new Set([
  'aria-labelledby',
  'aria-describedby',
]);

export function namespaceSvgIds(
  svg: SVGSVGElement,
  options: SvgIdNamespaceOptions,
): NamespacedSvgTemplate {
  const clonedSvg = svg.cloneNode(true) as SVGSVGElement;
  const layerIdByOriginalId = buildLayerIdMap(clonedSvg, options);

  rewriteFragmentReferences(clonedSvg, layerIdByOriginalId);
  rewriteElementIds(clonedSvg, layerIdByOriginalId);

  return {
    svg: clonedSvg,
    layerIdByOriginalId,
  };
}

export function buildSvgNamespacePrefix(
  options: SvgIdNamespaceOptions,
): string {
  return [
    sanitizeNamespacePart(options.namespacePrefix),
    `tooth-${options.toothPosition}`,
    sanitizeNamespacePart(options.view),
  ].join('__');
}

function buildLayerIdMap(
  svg: SVGSVGElement,
  options: SvgIdNamespaceOptions,
): ReadonlyMap<string, string> {
  const namespacePrefix = buildSvgNamespacePrefix(options);
  const layerIdByOriginalId = new Map<string, string>();

  for (const element of getElementsWithIds(svg)) {
    const originalId = element.getAttribute('id');
    if (originalId === null) {
      continue;
    }

    if (layerIdByOriginalId.has(originalId)) {
      throw new Error(`Duplicate SVG id cannot be namespaced: ${originalId}`);
    }

    layerIdByOriginalId.set(originalId, `${namespacePrefix}__${originalId}`);
  }

  return layerIdByOriginalId;
}

function rewriteElementIds(
  svg: SVGSVGElement,
  layerIdByOriginalId: ReadonlyMap<string, string>,
): void {
  for (const element of getElementsWithIds(svg)) {
    const originalId = element.getAttribute('id');
    if (originalId === null) {
      continue;
    }

    const namespacedId = layerIdByOriginalId.get(originalId);
    if (namespacedId !== undefined) {
      element.setAttribute('id', namespacedId);
      element.setAttribute('data-odontogram-layer', originalId);
    }
  }
}

function rewriteFragmentReferences(
  svg: SVGSVGElement,
  layerIdByOriginalId: ReadonlyMap<string, string>,
): void {
  for (const element of [svg, ...Array.from(svg.querySelectorAll('*'))]) {
    for (const attribute of Array.from(element.attributes)) {
      const rewrittenValue = rewriteAttributeValue(
        attribute.name,
        attribute.value,
        layerIdByOriginalId,
      );

      if (rewrittenValue !== attribute.value) {
        element.setAttribute(attribute.name, rewrittenValue);
      }
    }
  }
}

function rewriteAttributeValue(
  attributeName: string,
  value: string,
  layerIdByOriginalId: ReadonlyMap<string, string>,
): string {
  const urlRewrittenValue = value.replace(
    URL_FRAGMENT_REFERENCE_PATTERN,
    (match: string, quote: string, originalId: string) => {
      const namespacedId = layerIdByOriginalId.get(originalId);
      if (namespacedId === undefined) {
        return match;
      }

      return `url(${quote}#${namespacedId}${quote})`;
    },
  );

  const directReference = urlRewrittenValue.match(
    DIRECT_FRAGMENT_REFERENCE_PATTERN,
  );
  if (directReference !== null) {
    const namespacedId = layerIdByOriginalId.get(directReference[1] ?? '');
    return namespacedId === undefined ? urlRewrittenValue : `#${namespacedId}`;
  }

  if (TOKENIZED_FRAGMENT_ATTRIBUTES.has(attributeName.toLowerCase())) {
    return urlRewrittenValue
      .split(/\s+/u)
      .map((token) => layerIdByOriginalId.get(token) ?? token)
      .join(' ');
  }

  return urlRewrittenValue;
}

function getElementsWithIds(svg: SVGSVGElement): readonly Element[] {
  return [svg, ...Array.from(svg.querySelectorAll('[id]'))];
}

function sanitizeNamespacePart(value: string): string {
  const sanitized = value.trim().replace(/[^a-zA-Z0-9_-]+/gu, '-');

  return sanitized.length > 0 ? sanitized : 'odontogram';
}
