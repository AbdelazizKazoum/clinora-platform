export const FILLING_MATERIALS = [
  ['COMPOSITE', 'Composite'],
  ['AMALGAM', 'Amalgam'],
  ['GIC', 'Glass ionomer'],
  ['TEMPORARY', 'Temporary'],
] as const;

export const RESTORATION_MATERIALS = [
  ['ZIRCON', 'Zirconia'],
  ['EMAX', 'Lithium disilicate (e.max)'],
  ['METAL_CERAMIC', 'Metal-ceramic'],
  ['METAL', 'Full-cast metal'],
  ['GOLD', 'Gold'],
  ['GRADIA', 'Indirect composite'],
  ['TELESCOPE', 'Telescope'],
  ['TEMPORARY', 'Temporary'],
] as const;

export const PARTIAL_RESTORATION_MATERIALS = RESTORATION_MATERIALS.filter(
  ([value]) =>
    ['ZIRCON', 'EMAX', 'GOLD', 'GRADIA', 'TEMPORARY'].includes(value),
);

export const isPartialRestoration = (code: string) =>
  code === 'INLAY' || code === 'ONLAY' || code === 'VENEER';

export const isPartialRestorationMaterial = (material: string) =>
  PARTIAL_RESTORATION_MATERIALS.some(([value]) => value === material);

export const restorationMaterialOptions = (restoration: string) =>
  isPartialRestoration(restoration)
    ? PARTIAL_RESTORATION_MATERIALS
    : RESTORATION_MATERIALS;
