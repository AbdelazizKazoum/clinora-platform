import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import {
  TOOTH_SVG_TEMPLATE_MANIFEST,
  normalizeTrustedSvgTemplate,
  type ToothSvgTemplateId,
} from './svg-template-loader';

const TEMPLATE_FREQUENCIES = Object.freeze({
  '11': 8,
  '13': 4,
  '14': 8,
  '16': 12,
  '14_occl': 8,
  '16_occl': 12,
} satisfies Record<ToothSvgTemplateId, number>);

const SIDE_TEMPLATE_IDS: readonly ToothSvgTemplateId[] = [
  '11',
  '13',
  '14',
  '16',
];
const ALL_TEMPLATE_IDS = Object.keys(
  TOOTH_SVG_TEMPLATE_MANIFEST,
) as ToothSvgTemplateId[];

describe('odontogram renderer performance budget', () => {
  it('keeps copied source asset transfer size explicit', () => {
    expect(
      ALL_TEMPLATE_IDS.reduce(
        (totalBytes, templateId) =>
          totalBytes + readTemplateMeasurement(templateId).bytes,
        0,
      ),
    // ODONTO-16 re-baseline: the audited byte-identical upstream copies
    // measure 413,445 bytes across the six approved templates (matches the
    // integration plan and the recorded source/copy SHA-256 hashes).
    ).toBe(413_445);
  });

  it('keeps normalized runtime SVG node counts below the approved ODONTO-13 baseline', () => {
    const sideRuntimeNodes = projectRuntimeNodeCount(SIDE_TEMPLATE_IDS);
    const sideAndOcclusalRuntimeNodes =
      projectRuntimeNodeCount(ALL_TEMPLATE_IDS);
    const sideAndOcclusalSourceNodes = projectSourceNodeCount(ALL_TEMPLATE_IDS);

    // Structural, dentition, implant, and prosthesis layers are now retained
    // deliberately. Keep the measured PARITY-02 budget explicit rather than
    // restoring the entire legacy layer set.
    expect(sideRuntimeNodes).toBeLessThanOrEqual(14_500);
    expect(sideAndOcclusalRuntimeNodes).toBeLessThanOrEqual(20_200);
    expect(sideAndOcclusalRuntimeNodes).toBeLessThan(
      sideAndOcclusalSourceNodes,
    );
  });
});

function projectRuntimeNodeCount(
  templateIds: readonly ToothSvgTemplateId[],
): number {
  return templateIds.reduce(
    (totalNodes, templateId) =>
      totalNodes +
      readTemplateMeasurement(templateId).runtimeNodes *
        TEMPLATE_FREQUENCIES[templateId],
    0,
  );
}

function projectSourceNodeCount(
  templateIds: readonly ToothSvgTemplateId[],
): number {
  return templateIds.reduce(
    (totalNodes, templateId) =>
      totalNodes +
      readTemplateMeasurement(templateId).sourceNodes *
        TEMPLATE_FREQUENCIES[templateId],
    0,
  );
}

function readTemplateMeasurement(templateId: ToothSvgTemplateId): {
  readonly bytes: number;
  readonly runtimeNodes: number;
  readonly sourceNodes: number;
} {
  const manifestEntry = TOOTH_SVG_TEMPLATE_MANIFEST[templateId];
  const filePath = join(
    process.cwd(),
    'public',
    'odontogram',
    'teeth',
    manifestEntry.fileName,
  );
  const sourceSvg = new DOMParser().parseFromString(
    readFileSync(filePath, 'utf8'),
    'image/svg+xml',
  ).documentElement as unknown as SVGSVGElement;
  const normalized = normalizeTrustedSvgTemplate(sourceSvg);

  return {
    bytes: statSync(filePath).size,
    runtimeNodes: 1 + normalized.svg.querySelectorAll('*').length,
    sourceNodes: 1 + sourceSvg.querySelectorAll('*').length,
  };
}
