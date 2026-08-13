'use client';

// Part of React Advanced Odontogram - https://github.com/ZoliQua/React-Odontogram-Modul
// Created by Zoltan Dul (https://github.com/ZoliQua) 2025-2026
// Adapted for Clinora in 2026: instance-scoped React bridge overlay; no body portals or global selectors.

import { useEffect, useState, type RefObject } from 'react';

import type { OdontogramData, ToothPosition } from '../model/odontogram';
import {
  computeBridgeBars,
  deriveBridgeSpans,
  type BridgeBar,
  type GridRelativeRect,
} from '../rendering/bridge-layout';
import styles from './odontogram.module.scss';

export interface BridgeOverlayProps {
  readonly data: OdontogramData;
  readonly containerRef: RefObject<HTMLElement | null>;
  readonly layoutKey?: string;
  readonly measurementScale?: number;
}

interface OverlaySize {
  readonly width: number;
  readonly height: number;
}

const EMPTY_SIZE: OverlaySize = Object.freeze({ height: 0, width: 0 });

export function BridgeOverlay({
  data,
  containerRef,
  layoutKey,
  measurementScale = 1,
}: BridgeOverlayProps) {
  const [bars, setBars] = useState<readonly BridgeBar[]>([]);
  const [size, setSize] = useState<OverlaySize>(EMPTY_SIZE);

  useEffect(() => {
    let disposed = false;
    let timeoutId: number | null = null;
    const container = containerRef.current;

    const scheduleMeasure = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      timeoutId = window.setTimeout(() => {
        timeoutId = null;
        measure();
      }, 0);
    };

    const measure = () => {
      if (disposed) {
        return;
      }

      const currentContainer = containerRef.current;
      if (currentContainer === null) {
        setBars([]);
        setSize(EMPTY_SIZE);
        return;
      }

      const scale = normalizeMeasurementScale(measurementScale);
      const containerRect = currentContainer.getBoundingClientRect();
      const bridgeSpans = deriveBridgeSpans(data).spans;
      const nextBars = computeBridgeBars(bridgeSpans, (position) =>
        getBridgeAnchorRect(currentContainer, containerRect, position, scale),
      );

      setSize({
        height: containerRect.height / scale,
        width: containerRect.width / scale,
      });
      setBars(nextBars);
    };

    scheduleMeasure();

    const resizeObserver =
      container !== null && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(scheduleMeasure)
        : null;
    if (container !== null) {
      resizeObserver?.observe(container);
    }

    window.addEventListener('resize', scheduleMeasure);

    return () => {
      disposed = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      resizeObserver?.disconnect();
      window.removeEventListener('resize', scheduleMeasure);
    };
  }, [containerRef, data, layoutKey, measurementScale]);

  return (
    <svg
      aria-hidden="true"
      className={styles.bridgeOverlay}
      data-odontogram-bridge-overlay="true"
      height={size.height}
      viewBox={`0 0 ${size.width} ${size.height}`}
      width={size.width}
    >
      {bars.map((bar) => (
        <rect
          className={styles.bridgeOverlayBar}
          data-odontogram-appearance={bar.appearance}
          data-odontogram-bridge-id={bar.bridgeId}
          data-odontogram-bridge-segment={`${bar.from}-${bar.to}`}
          fill={bar.fill}
          height={bar.height}
          key={`${bar.bridgeId}:${bar.from}-${bar.to}`}
          rx={bar.height / 2}
          width={bar.width}
          x={bar.x}
          y={bar.y}
        />
      ))}
    </svg>
  );
}

function getBridgeAnchorRect(
  container: HTMLElement,
  containerRect: DOMRect,
  position: ToothPosition,
  scale: number,
): GridRelativeRect | null {
  const anchor = container.querySelector<HTMLElement>(
    `[data-odontogram-bridge-anchor="true"][data-odontogram-position="${position}"]`,
  );
  if (anchor === null) {
    return null;
  }

  const anchorRect = anchor.getBoundingClientRect();
  return {
    height: anchorRect.height / scale,
    width: anchorRect.width / scale,
    x: (anchorRect.left - containerRect.left) / scale,
    y: (anchorRect.top - containerRect.top) / scale,
  };
}

function normalizeMeasurementScale(scale: number): number {
  return Number.isFinite(scale) && scale > 0 ? scale : 1;
}
