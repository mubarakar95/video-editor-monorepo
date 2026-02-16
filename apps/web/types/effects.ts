// Effects system types inspired by Omniclip

export interface EffectRect {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  pivotX: number;
  pivotY: number;
}

export interface TextEffect {
  id: string;
  type: "text";
  name: string;
  trackId: string;
  start: number; // start time in seconds
  duration: number;
  end: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  fill: string[];
  stroke: string;
  strokeThickness: number;
  align: "left" | "center" | "right";
  letterSpacing: number;
  lineHeight: number;
  dropShadow: boolean;
  dropShadowColor: string;
  dropShadowBlur: number;
  dropShadowDistance: number;
  dropShadowAngle: number;
  rect: EffectRect;
}

export interface VideoEffect {
  id: string;
  type: "video";
  name: string;
  trackId: string;
  sourceId: string;
  start: number;
  duration: number;
  end: number;
  sourceStart: number; // in-point in source video
  rect: EffectRect;
  volume: number;
  muted: boolean;
  speed: number;
}

export interface ImageEffect {
  id: string;
  type: "image";
  name: string;
  trackId: string;
  sourceId: string;
  start: number;
  duration: number;
  end: number;
  rect: EffectRect;
}

export interface AudioEffect {
  id: string;
  type: "audio";
  name: string;
  trackId: string;
  sourceId: string;
  start: number;
  duration: number;
  end: number;
  sourceStart: number;
  volume: number;
  muted: boolean;
  speed: number;
}

export type AnyEffect = TextEffect | VideoEffect | ImageEffect | AudioEffect;

// Filter types
export type FilterType =
  | "brightness"
  | "contrast"
  | "saturation"
  | "hue"
  | "blur"
  | "sepia"
  | "grayscale"
  | "invert"
  | "vintage"
  | "warm"
  | "cool";

export interface Filter {
  id: string;
  targetEffectId: string;
  type: FilterType;
  value: number;
}

// Transition types
export type TransitionType =
  | "fade"
  | "dissolve"
  | "wipe-left"
  | "wipe-right"
  | "wipe-up"
  | "wipe-down"
  | "zoom-in"
  | "zoom-out"
  | "slide-left"
  | "slide-right";

export interface Transition {
  id: string;
  fromEffectId: string;
  toEffectId: string;
  type: TransitionType;
  duration: number;
}

// Animation types
export type AnimationType =
  | "fade-in"
  | "fade-out"
  | "scale-in"
  | "scale-out"
  | "slide-in"
  | "slide-out";
export type AnimationFor = "entrance" | "exit";

export interface Animation {
  id: string;
  targetEffectId: string;
  type: AnimationType;
  for: AnimationFor;
  duration: number;
}

// Project settings
export interface ProjectSettings {
  name: string;
  width: number;
  height: number;
  frameRate: number;
  aspectRatio: string;
  bitrate: number;
}

// Track
export interface EditorTrack {
  id: string;
  name: string;
  kind: "video" | "audio" | "text";
  index: number;
  muted: boolean;
  locked: boolean;
  visible: boolean;
  solo: boolean;
}
