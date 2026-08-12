// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Created by Zoltan Dul (https://github.com/ZoliQua) 2025-2026
// Adapted for Clinora in 2026: trusted static SVG template loading and in-memory normalization only.

export type ToothSvgTemplateId =
  | '11'
  | '13'
  | '14'
  | '16'
  | '14_occl'
  | '16_occl';
export type ToothSvgTemplateView = 'side' | 'occlusal';

export interface ToothSvgTemplateManifestEntry {
  readonly id: ToothSvgTemplateId;
  readonly view: ToothSvgTemplateView;
  readonly fileName: `${ToothSvgTemplateId}.svg`;
  readonly publicPath: `/odontogram/teeth/${ToothSvgTemplateId}.svg`;
  readonly sha256: string;
}

export interface OdontogramPublicAssetUrlOptions {
  readonly basePath?: string;
  readonly assetPrefix?: string;
}

export interface LoadToothSvgTemplateOptions {
  readonly basePath?: string;
  readonly assetPrefix?: string;
  readonly fetcher?: typeof fetch;
}

export interface LoadToothSvgTemplatesOptions
  extends LoadToothSvgTemplateOptions {
  readonly includeOcclusal?: boolean;
}

export interface LoadedToothSvgTemplate {
  readonly id: ToothSvgTemplateId;
  readonly manifest: ToothSvgTemplateManifestEntry;
  readonly svg: SVGSVGElement;
}

export interface NormalizedSvgTemplate {
  readonly svg: SVGSVGElement;
  readonly switchableLayerIds: readonly string[];
  readonly removedStyleElementCount: number;
}

export type SvgTemplateLoaderErrorCode =
  | 'missing-browser-api'
  | 'fetch-failed'
  | 'malformed-svg'
  | 'unsafe-svg'
  | 'unknown-template';

export class SvgTemplateLoaderError extends Error {
  readonly code: SvgTemplateLoaderErrorCode;
  readonly templateId?: ToothSvgTemplateId;

  constructor(
    code: SvgTemplateLoaderErrorCode,
    message: string,
    templateId?: ToothSvgTemplateId,
  ) {
    super(message);
    this.name = 'SvgTemplateLoaderError';
    this.code = code;
    this.templateId = templateId;
  }
}

export const ODONTOGRAM_TEMPLATE_ROOT_ATTRIBUTE =
  'data-odontogram-template-root';
export const ODONTOGRAM_INACTIVE_LAYER_SELECTOR = `[${ODONTOGRAM_TEMPLATE_ROOT_ATTRIBUTE}] [data-active="0"]`;

export const TOOTH_SVG_TEMPLATE_MANIFEST = Object.freeze({
  '11': Object.freeze({
    id: '11',
    view: 'side',
    fileName: '11.svg',
    publicPath: '/odontogram/teeth/11.svg',
    sha256: '83db8558718d419d40221bd78ac01be7301934ec9a5789357531c23d7c7bde11',
  }),
  '13': Object.freeze({
    id: '13',
    view: 'side',
    fileName: '13.svg',
    publicPath: '/odontogram/teeth/13.svg',
    sha256: '87ccfddbb04d5d4cb67abacfedbb0a3e9fbaa502929f180245c00367ffaddc62',
  }),
  '14': Object.freeze({
    id: '14',
    view: 'side',
    fileName: '14.svg',
    publicPath: '/odontogram/teeth/14.svg',
    sha256: '7d8f63a3e42960c0e8c39463aedb45f28a03194eecc76c278770e74bca6bef18',
  }),
  '16': Object.freeze({
    id: '16',
    view: 'side',
    fileName: '16.svg',
    publicPath: '/odontogram/teeth/16.svg',
    sha256: 'e75d3e88f3d7ecf6bf10f209039f7dc0a3caa775a5874f80e098d2c5e189b0d4',
  }),
  '14_occl': Object.freeze({
    id: '14_occl',
    view: 'occlusal',
    fileName: '14_occl.svg',
    publicPath: '/odontogram/teeth/14_occl.svg',
    sha256: '3cba976ff9392f21369c513da9455448b8685d6868fac125bf2758131149d04b',
  }),
  '16_occl': Object.freeze({
    id: '16_occl',
    view: 'occlusal',
    fileName: '16_occl.svg',
    publicPath: '/odontogram/teeth/16_occl.svg',
    sha256: '268f59d200f0194663eec9136c5a8c2b833501e65623ec29693ca4672ca1c13e',
  }),
} satisfies Record<ToothSvgTemplateId, ToothSvgTemplateManifestEntry>);

export const SIDE_TOOTH_SVG_TEMPLATE_IDS = Object.freeze([
  '11',
  '13',
  '14',
  '16',
] as const satisfies readonly ToothSvgTemplateId[]);

export const OCCLUSAL_TOOTH_SVG_TEMPLATE_IDS = Object.freeze([
  '14_occl',
  '16_occl',
] as const satisfies readonly ToothSvgTemplateId[]);

const ALL_TOOTH_SVG_TEMPLATE_IDS = Object.freeze([
  ...SIDE_TOOTH_SVG_TEMPLATE_IDS,
  ...OCCLUSAL_TOOTH_SVG_TEMPLATE_IDS,
] as const satisfies readonly ToothSvgTemplateId[]);

const SWITCHABLE_GROUP_IDS = Object.freeze([
  'mods',
  'tooth-variants',
  'endos',
  'surfaces',
  'restorations',
  'specials',
] as const);

const SWITCHABLE_SINGLETON_IDS = Object.freeze([
  'tooth-base',
  'tooth-healthy-pulp',
  'tooth-inflam-pulp',
  'milktooth-base',
  'milktooth-beauty',
  'milktooth-healthy-pulp',
  'milktooth-inflam-pulp',
  'tooth-bruxism-wear',
  'tooth-bruxism-neck-wear',
] as const);

const EXPECTED_EMBEDDED_STYLE_PATTERN =
  /^\s*\[data-active="0"\]\s*\{\s*display\s*:\s*none\s*;\s*\}\s*$/i;
const REMOTE_URL_PATTERN = /url\(\s*['"]?(?:https?:|data:|\/\/)/i;
const CSS_IMPORT_PATTERN = /@import\b/i;
const DISPLAY_NONE_DECLARATION_PATTERN = /(?:^|;)\s*display\s*:\s*none\s*;?/gi;
const FRAGMENT_URL_PATTERN = /url\(\s*['"]?#([^)'" ]+)['"]?\s*\)/i;
const STRICT_URL_ATTRIBUTES = new Set(['href', 'xlink:href', 'src']);
const FRAGMENT_URL_ATTRIBUTES = new Set([
  'href',
  'xlink:href',
  'src',
  'clip-path',
  'mask',
  'filter',
  'fill',
  'stroke',
]);
const pendingTemplateLoads = new Map<string, Promise<LoadedToothSvgTemplate>>();
const parsedTemplateCache = new Map<
  string,
  Readonly<{
    manifest: ToothSvgTemplateManifestEntry;
    normalized: NormalizedSvgTemplate;
  }>
>();

export function buildOdontogramPublicAssetUrl(
  publicPath: ToothSvgTemplateManifestEntry['publicPath'],
  options: OdontogramPublicAssetUrlOptions = {},
): string {
  return `${normalizeAssetPrefix(options.assetPrefix)}${normalizeBasePath(
    options.basePath,
  )}${publicPath}`;
}

export async function loadToothSvgTemplate(
  templateId: ToothSvgTemplateId,
  options: LoadToothSvgTemplateOptions = {},
): Promise<LoadedToothSvgTemplate> {
  const manifest = TOOTH_SVG_TEMPLATE_MANIFEST[templateId];
  if (manifest === undefined) {
    throw new SvgTemplateLoaderError(
      'unknown-template',
      `Unknown tooth SVG template: ${String(templateId)}`,
    );
  }

  const url = buildOdontogramPublicAssetUrl(manifest.publicPath, options);
  const cacheKey = `${templateId}|${url}`;
  const cachedTemplate = parsedTemplateCache.get(cacheKey);

  if (cachedTemplate !== undefined) {
    return {
      id: templateId,
      manifest,
      svg: cloneSvg(cachedTemplate.normalized.svg),
    };
  }

  const pendingLoad = pendingTemplateLoads.get(cacheKey);
  if (pendingLoad !== undefined) {
    const loadedTemplate = await pendingLoad;

    return {
      ...loadedTemplate,
      svg: cloneSvg(loadedTemplate.svg),
    };
  }

  const loadPromise = fetchParseAndCacheTemplate(
    templateId,
    manifest,
    url,
    options.fetcher ?? globalThis.fetch,
    cacheKey,
  );

  pendingTemplateLoads.set(cacheKey, loadPromise);

  try {
    const loadedTemplate = await loadPromise;

    return {
      ...loadedTemplate,
      svg: cloneSvg(loadedTemplate.svg),
    };
  } catch (error) {
    pendingTemplateLoads.delete(cacheKey);
    parsedTemplateCache.delete(cacheKey);
    throw error;
  }
}

export async function loadToothSvgTemplates(
  options: LoadToothSvgTemplatesOptions = {},
): Promise<ReadonlyMap<ToothSvgTemplateId, SVGSVGElement>> {
  const templateIds = options.includeOcclusal
    ? ALL_TOOTH_SVG_TEMPLATE_IDS
    : SIDE_TOOTH_SVG_TEMPLATE_IDS;
  const loadedTemplates = await Promise.all(
    templateIds.map((templateId) => loadToothSvgTemplate(templateId, options)),
  );

  return new Map(
    loadedTemplates.map((template) => [template.id, template.svg]),
  );
}

export function normalizeTrustedSvgTemplate(
  svg: SVGSVGElement,
): NormalizedSvgTemplate {
  const clonedSvg = cloneSvg(svg);
  const styleElements = Array.from(clonedSvg.querySelectorAll('style'));
  for (const styleElement of styleElements) {
    styleElement.remove();
  }

  stripInlineDisplayNoneToDataActive(clonedSvg);
  const switchableLayerIds = seedDataActiveDefaults(clonedSvg);
  clonedSvg.setAttribute(ODONTOGRAM_TEMPLATE_ROOT_ATTRIBUTE, '');

  return {
    svg: clonedSvg,
    switchableLayerIds,
    removedStyleElementCount: styleElements.length,
  };
}

export function clearToothSvgTemplateCaches(): void {
  pendingTemplateLoads.clear();
  parsedTemplateCache.clear();
}

async function fetchParseAndCacheTemplate(
  templateId: ToothSvgTemplateId,
  manifest: ToothSvgTemplateManifestEntry,
  url: string,
  fetcher: typeof fetch | undefined,
  cacheKey: string,
): Promise<LoadedToothSvgTemplate> {
  if (fetcher === undefined || typeof DOMParser === 'undefined') {
    throw new SvgTemplateLoaderError(
      'missing-browser-api',
      'Tooth SVG templates can only be loaded in a browser-like environment.',
      templateId,
    );
  }

  const response = await fetcher(url);
  if (!response.ok) {
    throw new SvgTemplateLoaderError(
      'fetch-failed',
      `Failed to load tooth SVG template ${templateId} from ${url}.`,
      templateId,
    );
  }

  const svgText = await response.text();
  const svg = parseTrustedSvgText(svgText, templateId);
  const normalized = normalizeTrustedSvgTemplate(svg);

  parsedTemplateCache.set(cacheKey, { manifest, normalized });
  pendingTemplateLoads.delete(cacheKey);

  return {
    id: templateId,
    manifest,
    svg: cloneSvg(normalized.svg),
  };
}

function parseTrustedSvgText(
  svgText: string,
  templateId: ToothSvgTemplateId,
): SVGSVGElement {
  const document = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  const parserError = document.querySelector('parsererror');
  if (parserError !== null) {
    throw new SvgTemplateLoaderError(
      'malformed-svg',
      `Malformed tooth SVG template ${templateId}.`,
      templateId,
    );
  }

  const svg = document.documentElement;
  if (svg.localName !== 'svg') {
    throw new SvgTemplateLoaderError(
      'malformed-svg',
      `Tooth SVG template ${templateId} did not contain an SVG root.`,
      templateId,
    );
  }

  const svgRoot = svg as unknown as SVGSVGElement;
  assertTrustedStaticSvg(svgRoot, templateId);

  return svgRoot;
}

function assertTrustedStaticSvg(
  svg: SVGSVGElement,
  templateId: ToothSvgTemplateId,
): void {
  if (svg.querySelector('script, foreignObject') !== null) {
    throwUnsafeSvg(
      templateId,
      'script or foreignObject elements are not allowed',
    );
  }

  for (const element of Array.from(svg.querySelectorAll('*'))) {
    assertSafeAttributes(element, templateId);
    if (element.localName === 'style') {
      assertExpectedStyleElement(element, templateId);
    }
  }
}

function assertSafeAttributes(
  element: Element,
  templateId: ToothSvgTemplateId,
): void {
  for (const attribute of Array.from(element.attributes)) {
    const name = attribute.name.toLowerCase();
    const value = attribute.value.trim();

    if (name.startsWith('on')) {
      throwUnsafeSvg(templateId, `inline event handler ${attribute.name}`);
    }

    if (name === 'style') {
      assertSafeStyleAttribute(value, templateId);
      continue;
    }

    if (STRICT_URL_ATTRIBUTES.has(name)) {
      assertSafeStrictUrlAttribute(value, templateId);
      continue;
    }

    if (FRAGMENT_URL_ATTRIBUTES.has(name)) {
      assertSafeFragmentUrlAttribute(value, templateId);
    }
  }
}

function assertSafeStyleAttribute(
  value: string,
  templateId: ToothSvgTemplateId,
): void {
  if (CSS_IMPORT_PATTERN.test(value) || REMOTE_URL_PATTERN.test(value)) {
    throwUnsafeSvg(templateId, 'remote CSS content is not allowed');
  }

  const fragmentUrlMatch = value.match(FRAGMENT_URL_PATTERN);
  if (
    value.includes('url(') &&
    (fragmentUrlMatch === null || fragmentUrlMatch[1]?.trim().length === 0)
  ) {
    throwUnsafeSvg(templateId, 'only fragment URL references are allowed');
  }
}

function assertSafeStrictUrlAttribute(
  value: string,
  templateId: ToothSvgTemplateId,
): void {
  if (value.startsWith('#')) {
    return;
  }

  throwUnsafeSvg(templateId, 'external URL attributes are not allowed');
}

function assertSafeFragmentUrlAttribute(
  value: string,
  templateId: ToothSvgTemplateId,
): void {
  if (value === '' || !value.includes('url(')) {
    return;
  }

  if (FRAGMENT_URL_PATTERN.test(value)) {
    return;
  }

  throwUnsafeSvg(templateId, 'external URL attributes are not allowed');
}

function assertExpectedStyleElement(
  element: Element,
  templateId: ToothSvgTemplateId,
): void {
  const text = element.textContent ?? '';
  if (
    !EXPECTED_EMBEDDED_STYLE_PATTERN.test(text) ||
    CSS_IMPORT_PATTERN.test(text) ||
    REMOTE_URL_PATTERN.test(text)
  ) {
    throwUnsafeSvg(templateId, 'unexpected embedded style element content');
  }
}

function stripInlineDisplayNoneToDataActive(svg: SVGSVGElement): void {
  for (const element of Array.from(svg.querySelectorAll('[style]'))) {
    const style = element.getAttribute('style');
    if (style === null || !DISPLAY_NONE_DECLARATION_PATTERN.test(style)) {
      DISPLAY_NONE_DECLARATION_PATTERN.lastIndex = 0;
      continue;
    }

    DISPLAY_NONE_DECLARATION_PATTERN.lastIndex = 0;
    element.setAttribute('data-active', '0');

    const nextStyle = style
      .replace(DISPLAY_NONE_DECLARATION_PATTERN, ';')
      .replace(/;\s*;/g, ';')
      .replace(/^\s*;\s*/, '')
      .trim();

    if (nextStyle.length > 0) {
      element.setAttribute('style', nextStyle);
    } else {
      element.removeAttribute('style');
    }

    DISPLAY_NONE_DECLARATION_PATTERN.lastIndex = 0;
  }
}

function seedDataActiveDefaults(svg: SVGSVGElement): readonly string[] {
  const switchableLayerIds = new Set<string>();

  for (const groupId of SWITCHABLE_GROUP_IDS) {
    const group = svg.querySelector(`#${groupId}`);
    if (group === null) {
      continue;
    }

    for (const element of Array.from(group.querySelectorAll('[id]'))) {
      seedSwitchableElement(element, switchableLayerIds);
    }
  }

  for (const singletonId of SWITCHABLE_SINGLETON_IDS) {
    const element = svg.querySelector(`#${singletonId}`);
    if (element !== null) {
      seedSwitchableElement(element, switchableLayerIds);
    }
  }

  return Object.freeze([...switchableLayerIds].sort());
}

function seedSwitchableElement(
  element: Element,
  switchableLayerIds: Set<string>,
): void {
  const id = element.getAttribute('id');
  if (id === null) {
    return;
  }

  if (!element.hasAttribute('data-active')) {
    element.setAttribute('data-active', '0');
  }

  switchableLayerIds.add(id);
}

function cloneSvg(svg: SVGSVGElement): SVGSVGElement {
  return svg.cloneNode(true) as SVGSVGElement;
}

function normalizeAssetPrefix(assetPrefix: string | undefined): string {
  if (assetPrefix === undefined || assetPrefix.trim() === '') {
    return '';
  }

  return assetPrefix.trim().replace(/\/+$/u, '');
}

function normalizeBasePath(basePath: string | undefined): string {
  if (basePath === undefined || basePath.trim() === '' || basePath === '/') {
    return '';
  }

  const trimmed = basePath.trim();
  const withoutTrailingSlash = trimmed.replace(/\/+$/u, '');

  return withoutTrailingSlash.startsWith('/')
    ? withoutTrailingSlash
    : `/${withoutTrailingSlash}`;
}

function throwUnsafeSvg(templateId: ToothSvgTemplateId, detail: string): never {
  throw new SvgTemplateLoaderError(
    'unsafe-svg',
    `Unsafe tooth SVG template ${templateId}: ${detail}.`,
    templateId,
  );
}
