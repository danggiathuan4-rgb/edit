/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface WatermarkBox {
  id: string;
  x: number;      // 0 to 100 percentage from left
  y: number;      // 0 to 100 percentage from top
  width: number;  // 1 to 100 percentage width
  height: number; // 1 to 100 percentage height
  label?: string;
}

export type BrushMode = "paint" | "erase";

export interface PresetBackground {
  id: string;
  name: string;
  url: string;
  type: "gradient" | "color" | "scenery";
  style?: string; // CSS style or description
}

export interface SampleImage {
  id: string;
  name: string;
  description: string;
  url: string;
  watermarks?: WatermarkBox[];
}

export interface SampleVideo {
  id: string;
  name: string;
  description: string;
  url: string;
  watermarks?: { x: number; y: number; width: number; height: number }[];
}
