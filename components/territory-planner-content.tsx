"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Flag,
  Trash2,
  ZoomIn,
  ZoomOut,
  Crosshair,
  RotateCcw,
  MousePointer,
  Info,
  Castle,
  Shield,
  Landmark,
  PenTool,
  Edit3,
  Check,
  X,
  Mountain,
  Download,
  Upload,
  Save,
  Search,
  MapPin,
  Maximize2,
  Minimize2,
  Wheat,
  TreePine,
  Gem,
  Coins,
  Box,
  Pentagon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  TYPES                                                              */
/* ------------------------------------------------------------------ */

type PlaceableKind = "flag" | "cf" | "af" | "af2";

interface Placeable {
  id: string;
  kind: PlaceableKind;
  x: number;
  y: number;
}

type ResourceNodeType = "food" | "wood" | "stone" | "gold";

interface ResourceNode {
  id: string;
  type: ResourceNodeType;
  x: number;
  y: number;
}

type KingdomStructureType =
  | "sanctum"
  | "altar"
  | "shrine"
  | "lost_temple"
  | "pass_1"
  | "pass_2"
  | "pass_3";

interface KingdomStructure {
  id: string;
  type: KingdomStructureType;
  x: number;
  y: number;
}

interface Marker {
  id: string;
  x: number;
  y: number;
}

interface ZoneBorder {
  id: string;
  points: { x: number; y: number }[];
  closed: boolean;
}

interface TerrainPolygon {
  id: string;
  type: "blocked";
  points: { x: number; y: number }[];
}

type ToolMode =
  | "place-flag"
  | "place-cf"
  | "place-af"
  | "place-af2"
  | "select"
  | "draw-terrain"
  | "edit-terrain"
  | "place-node"
  | "place-structure"
  | "draw-border"
  | "edit-border";

/* ------------------------------------------------------------------ */
/*  STRUCTURE DEFINITIONS                                              */
/* ------------------------------------------------------------------ */

interface StructureDef {
  label: string;
  shortLabel: string;
  half: number;
  color: string;
  activeColor: string;
  fillColor: string;
  borderColor: string;
}

const STRUCTURE_DEFS: Record<PlaceableKind, StructureDef> = {
  flag: {
    label: "Alliance Flag",
    shortLabel: "Flag",
    half: 4,
    color: "#a78bfa",
    activeColor: "#c4b5fd",
    fillColor: "rgba(124, 58, 237, 0.22)",
    borderColor: "rgba(124, 58, 237, 0.7)",
  },
  cf: {
    label: "Center Fortress",
    shortLabel: "CF",
    half: 7,
    color: "#f59e0b",
    activeColor: "#fbbf24",
    fillColor: "rgba(245, 158, 11, 0.18)",
    borderColor: "rgba(245, 158, 11, 0.6)",
  },
  af: {
    label: "Alliance Fortress",
    shortLabel: "AF",
    half: 5,
    color: "#3b82f6",
    activeColor: "#60a5fa",
    fillColor: "rgba(59, 130, 246, 0.18)",
    borderColor: "rgba(59, 130, 246, 0.6)",
  },
  af2: {
    label: "Alliance Fortress 2",
    shortLabel: "AF2",
    half: 5,
    color: "#10b981",
    activeColor: "#34d399",
    fillColor: "rgba(16, 185, 129, 0.18)",
    borderColor: "rgba(16, 185, 129, 0.6)",
  },
};

const PLACEABLE_KINDS: PlaceableKind[] = ["flag", "cf", "af", "af2"];

const KIND_ICONS: Record<PlaceableKind, React.ElementType> = {
  flag: Flag,
  cf: Castle,
  af: Shield,
  af2: Landmark,
};

/* Resource node definitions */
interface ResourceNodeDef {
  label: string;
  shortLabel: string;
  color: string;
  fillColor: string;
}

const RESOURCE_NODE_DEFS: Record<ResourceNodeType, ResourceNodeDef> = {
  food: {
    label: "Food",
    shortLabel: "F",
    color: "#22c55e",
    fillColor: "rgba(34, 197, 94, 0.25)",
  },
  wood: {
    label: "Wood",
    shortLabel: "W",
    color: "#a16207",
    fillColor: "rgba(161, 98, 7, 0.25)",
  },
  stone: {
    label: "Stone",
    shortLabel: "S",
    color: "#94a3b8",
    fillColor: "rgba(148, 163, 184, 0.25)",
  },
  gold: {
    label: "Gold",
    shortLabel: "G",
    color: "#eab308",
    fillColor: "rgba(234, 179, 8, 0.25)",
  },
};

const RESOURCE_NODE_TYPES: ResourceNodeType[] = ["food", "wood", "stone", "gold"];

const RESOURCE_NODE_ICONS: Record<ResourceNodeType, React.ElementType> = {
  food: Wheat,
  wood: TreePine,
  stone: Gem,
  gold: Coins,
};

/* Kingdom structure definitions */
interface KingdomStructureDef {
  label: string;
  shortLabel: string;
  half: number; // half-size in tiles
  color: string;
  fillColor: string;
}

const KINGDOM_STRUCTURE_DEFS: Record<KingdomStructureType, KingdomStructureDef> = {
  sanctum: {
    label: "Sanctum",
    shortLabel: "SAN",
    half: 7,
    color: "#e879f9",
    fillColor: "rgba(232, 121, 249, 0.2)",
  },
  altar: {
    label: "Altar",
    shortLabel: "ALT",
    half: 7,
    color: "#fb923c",
    fillColor: "rgba(251, 146, 60, 0.2)",
  },
  shrine: {
    label: "Shrine",
    shortLabel: "SHR",
    half: 7,
    color: "#38bdf8",
    fillColor: "rgba(56, 189, 248, 0.2)",
  },
  lost_temple: {
    label: "Lost Temple",
    shortLabel: "LT",
    half: 7,
    color: "#facc15",
    fillColor: "rgba(250, 204, 21, 0.2)",
  },
  pass_1: {
    label: "Pass Level 1",
    shortLabel: "P1",
    half: 7,
    color: "#4ade80",
    fillColor: "rgba(74, 222, 128, 0.2)",
  },
  pass_2: {
    label: "Pass Level 2",
    shortLabel: "P2",
    half: 7,
    color: "#f97316",
    fillColor: "rgba(249, 115, 22, 0.2)",
  },
  pass_3: {
    label: "Pass Level 3",
    shortLabel: "P3",
    half: 7,
    color: "#ef4444",
    fillColor: "rgba(239, 68, 68, 0.2)",
  },
};

const KINGDOM_STRUCTURE_TYPES: KingdomStructureType[] = [
  "sanctum",
  "altar",
  "shrine",
  "lost_temple",
  "pass_1",
  "pass_2",
  "pass_3",
];

function getKindFromTool(tool: ToolMode): PlaceableKind | null {
  if (
    tool === "place-flag" ||
    tool === "place-cf" ||
    tool === "place-af" ||
    tool === "place-af2"
  )
    return tool.slice(6) as PlaceableKind;
  return null;
}

function isPlaceTool(tool: ToolMode): boolean {
  return (
    tool.startsWith("place-") &&
    tool !== "place-node" &&
    tool !== "place-structure"
  );
}

/* ------------------------------------------------------------------ */
/*  CONSTANTS                                                          */
/* ------------------------------------------------------------------ */

const MAP_SIZE = 1200;

// Global RoK alignment offset
const MAP_OFFSET_X = -2;
const MAP_OFFSET_Y = 1;

const displayY = (y: number) => MAP_SIZE - (y + MAP_OFFSET_Y);
const displayX = (x: number) => x + MAP_OFFSET_X;

  const SNAP_STEP = 3;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 24;
const ZOOM_SENSITIVITY = 0.0015;

  const GRID_COLOR_MAJOR = "rgba(0,0,0,0.12)";
  const GRID_COLOR_MINOR = "rgba(0,0,0,0.05)";
  const BG_COLOR = "hsl(100, 38%, 35%)";

const TERRAIN_FILL = "rgba(239, 68, 68, 0.12)";
const TERRAIN_STROKE = "rgba(239, 68, 68, 0.6)";
const TERRAIN_VERTEX_COLOR = "#ef4444";
const TERRAIN_VERTEX_ACTIVE = "#fbbf24";
const TERRAIN_EDGE_HOVER = "rgba(251, 191, 36, 0.5)";
const TERRAIN_DRAWING_STROKE = "rgba(239, 68, 68, 0.8)";
const TERRAIN_DRAWING_FILL = "rgba(239, 68, 68, 0.06)";

const BORDER_STROKE = "rgba(96, 165, 250, 0.7)";
const BORDER_VERTEX_COLOR = "#60a5fa";

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */

function snapToStep(v: number): number {
  return Math.round(v / SNAP_STEP) * SNAP_STEP;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function buildOccupancySet(items: Placeable[]): Set<string> {
  const set = new Set<string>();
  for (const p of items) {
    const half = STRUCTURE_DEFS[p.kind].half;
    const minX = p.x - half;
    const maxX = p.x + half;
    const minY = p.y - half;
    const maxY = p.y + half;
    for (let tx = minX; tx <= maxX; tx++) {
      for (let ty = minY; ty <= maxY; ty++) {
        if (tx >= 0 && tx <= MAP_SIZE && ty >= 0 && ty <= MAP_SIZE) {
          set.add(`${tx},${ty}`);
        }
      }
    }
  }
  return set;
}

function pointInPolygon(
  px: number,
  py: number,
  pts: { x: number; y: number }[]
): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x,
      yi = pts[i].y;
    const xj = pts[j].x,
      yj = pts[j].y;
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function distToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { dist: number; t: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    const d = Math.hypot(px - x1, py - y1);
    return { dist: d, t: 0 };
  }
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = clamp(t, 0, 1);
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return { dist: Math.hypot(px - projX, py - projY), t };
}

function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export function TerritoryPlannerContent() {
  /* --- Existing state --- */
  const [items, setItems] = useState<Placeable[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<ToolMode>("place-flag");
  const [hoverTile, setHoverTile] = useState<{ x: number; y: number } | null>(
    null
  );


  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [camera, setCamera] = useState({ x: 500, y: 500, zoom: 3.5 });
  const [isPanning, setIsPanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const panStart = useRef({ mx: 0, my: 0, cx: 0, cy: 0 });
  const dragStart = useRef({
    itemId: "",
    startMouseTileX: 0,
    startMouseTileY: 0,
    origX: 0,
    origY: 0,
  });
  const animRef = useRef<number>(0);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });

  /* --- Terrain state --- */
  const [terrainPolygons, setTerrainPolygons] = useState<TerrainPolygon[]>([]);
  const [drawingPoints, setDrawingPoints] = useState<
    { x: number; y: number }[]
  >([]);
  const [isDrawingTerrain, setIsDrawingTerrain] = useState(false);
  const [editingTerrainId, setEditingTerrainId] = useState<string | null>(null);
  const [editingVertexIdx, setEditingVertexIdx] = useState<number | null>(null);
  const [isDraggingVertex, setIsDraggingVertex] = useState(false);
  const [hoveredEdge, setHoveredEdge] = useState<{
    terrainId: string;
    edgeIdx: number;
    point: { x: number; y: number };
  } | null>(null);

  /* --- Resource Nodes --- */
  const [resourceNodes, setResourceNodes] = useState<ResourceNode[]>([]);
  const [selectedNodeType, setSelectedNodeType] =
    useState<ResourceNodeType>("food");
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const nodeDragStart = useRef({
    nodeId: "",
    startMouseX: 0,
    startMouseY: 0,
    origX: 0,
    origY: 0,
  });

  /* --- Kingdom Structures --- */
  const [structures, setStructures] = useState<KingdomStructure[]>([]);
  const [selectedStructureType, setSelectedStructureType] =
    useState<KingdomStructureType>("sanctum");
  const [isDraggingStructure, setIsDraggingStructure] = useState(false);
  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(
    null
  );
  const [structureDebugMode, setStructureDebugMode] = useState(true);
  const structureDragStart = useRef({
    structureId: "",
    startMouseX: 0,
    startMouseY: 0,
    origX: 0,
    origY: 0,
  });

  /* --- Markers --- */
  const [markers, setMarkers] = useState<Marker[]>([]);

  /* --- Zone Borders --- */
  const [zoneBorders, setZoneBorders] = useState<ZoneBorder[]>([]);
  const [borderDrawingPoints, setBorderDrawingPoints] = useState<
    { x: number; y: number }[]
  >([]);
  const [isDrawingBorder, setIsDrawingBorder] = useState(false);
  const [editingBorderId, setEditingBorderId] = useState<string | null>(null);
  const [editingBorderVertexIdx, setEditingBorderVertexIdx] = useState<
    number | null
  >(null);
  const [isDraggingBorderVertex, setIsDraggingBorderVertex] = useState(false);

  /* --- Coordinate Search --- */
  const [goToX, setGoToX] = useState("");
  const [goToY, setGoToY] = useState("");

  /* --- Coordinate Placement --- */
  const [coordPlaceX, setCoordPlaceX] = useState("");
  const [coordPlaceY, setCoordPlaceY] = useState("");

  /* --- World mouse position --- */
  const [worldMouse, setWorldMouse] = useState<{
    x: number;
    y: number;
  } | null>(null);

  /* --- Save feedback --- */
  const [saveFlash, setSaveFlash] = useState(false);

  /* --- Fullscreen --- */
  const [isFullscreen, setIsFullscreen] = useState(false);

  /* ---------------------------------------------------------------- */
  /*  PERSISTENCE - localStorage                                       */
  /* ---------------------------------------------------------------- */

  const STORAGE_KEY = "rok_territory_planner";

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data.items)) setItems(data.items);
        if (Array.isArray(data.terrainPolygons))
          setTerrainPolygons(data.terrainPolygons);
        if (Array.isArray(data.resourceNodes))
          setResourceNodes(data.resourceNodes);
        if (Array.isArray(data.structures)) setStructures(data.structures);
        if (Array.isArray(data.markers)) setMarkers(data.markers);
        if (Array.isArray(data.zoneBorders)) setZoneBorders(data.zoneBorders);
      }
    } catch {
      // Ignore corrupted data
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      try {
        const data = JSON.stringify({
          items,
          terrainPolygons,
          resourceNodes,
          structures,
          markers,
          zoneBorders,
        });
        localStorage.setItem(STORAGE_KEY, data);
      } catch {
        // Storage full or unavailable
      }
    }, 500);
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [items, terrainPolygons, resourceNodes, structures, markers, zoneBorders]);

  const triggerSaveFlash = useCallback(() => {
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1200);
  }, []);

  /* ---------------------------------------------------------------- */
  /*  EXPORT / IMPORT                                                   */
  /* ---------------------------------------------------------------- */

  const exportLayout = useCallback(() => {
    const data = {
      version: 2,
      exportedAt: new Date().toISOString(),
      items,
      terrainPolygons,
      resourceNodes,
      structures,
      markers,
      zoneBorders,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `territory-layout-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [items, terrainPolygons, resourceNodes, structures, markers, zoneBorders]);

  const importLayout = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (Array.isArray(data.items)) setItems(data.items);
          if (Array.isArray(data.terrainPolygons))
            setTerrainPolygons(data.terrainPolygons);
          if (Array.isArray(data.resourceNodes))
            setResourceNodes(data.resourceNodes);
          if (Array.isArray(data.structures)) setStructures(data.structures);
          if (Array.isArray(data.markers)) setMarkers(data.markers);
          if (Array.isArray(data.zoneBorders))
            setZoneBorders(data.zoneBorders);
          triggerSaveFlash();
        } catch {
          // Invalid file
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [triggerSaveFlash]);

  const isInsideBlockedTerrain = useCallback(
    (wx: number, wy: number): boolean => {
      for (const tp of terrainPolygons) {
        if (tp.points.length >= 3 && pointInPolygon(wx, wy, tp.points)) {
          return true;
        }
      }
      return false;
    },
    [terrainPolygons]
  );

  /* ---------------------------------------------------------------- */
  /*  RESIZE OBSERVER                                                  */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setCanvasSize({ w: Math.floor(width), h: Math.floor(height) });
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  /* ---------------------------------------------------------------- */
  /*  SCREEN <-> TILE CONVERSIONS                                      */
  /* ---------------------------------------------------------------- */

const tileToScreen = useCallback(
  (tx: number, ty: number) => ({
    sx: (tx + 0.5 - camera.x) * camera.zoom + canvasSize.w / 2,
    sy: (ty + 0.5 - camera.y) * camera.zoom + canvasSize.h / 2,
  }),
  [camera, canvasSize]
);


const screenToTile = useCallback(
  (sx: number, sy: number) => ({
    tx: (sx - canvasSize.w / 2) / camera.zoom + camera.x - 0.5,
    ty: (sy - canvasSize.h / 2) / camera.zoom + camera.y - 0.5,
  }),
  [camera, canvasSize]
);


  /* ---------------------------------------------------------------- */
  /*  HIT TESTING                                                      */
  /* ---------------------------------------------------------------- */

  const findItemAt = useCallback(
    (sx: number, sy: number): Placeable | null => {
      const { tx, ty } = screenToTile(sx, sy);
      const hitRadius = Math.max(2, 8 / camera.zoom);
      for (let i = items.length - 1; i >= 0; i--) {
        const p = items[i];
        if (Math.abs(p.x - tx) < hitRadius && Math.abs(p.y - ty) < hitRadius) {
          return p;
        }
      }
      return null;
    },
    [items, screenToTile, camera.zoom]
  );

  const findResourceNodeAt = useCallback(
    (sx: number, sy: number): ResourceNode | null => {
      const { tx, ty } = screenToTile(sx, sy);
      const hitRadius = Math.max(3, 10 / camera.zoom);
      for (let i = resourceNodes.length - 1; i >= 0; i--) {
        const n = resourceNodes[i];
        if (Math.abs(n.x - tx) < hitRadius && Math.abs(n.y - ty) < hitRadius) {
          return n;
        }
      }
      return null;
    },
    [resourceNodes, screenToTile, camera.zoom]
  );

  // Structure (x,y) = bottom-left tile. Bounding box spans 15 tiles for half=8.
  const findStructureAt = useCallback(
    (sx: number, sy: number): KingdomStructure | null => {
      const { tx, ty } = screenToTile(sx, sy);
      for (let i = structures.length - 1; i >= 0; i--) {
        const s = structures[i];
        const def = KINGDOM_STRUCTURE_DEFS[s.type];
        const footprint = def.half * 2 + 1; // 16
        if (
          tx >= s.x &&
          tx <= s.x + footprint - 1 &&
          ty >= s.y &&
          ty <= s.y + footprint - 1
        ) {
          return s;
        }
      }
      return null;
    },
    [structures, screenToTile]
  );

  const findMarkerAt = useCallback(
    (sx: number, sy: number): Marker | null => {
      const hitRadiusPx = 12;
      for (let i = markers.length - 1; i >= 0; i--) {
        const m = markers[i];
        const { sx: msx, sy: msy } = tileToScreen(m.x, m.y);
        if (Math.hypot(sx - msx, sy - msy) < hitRadiusPx) {
          return m;
        }
      }
      return null;
    },
    [markers, tileToScreen]
  );

  const findTerrainVertexAt = useCallback(
    (
      sx: number,
      sy: number
    ): { terrainId: string; vertexIdx: number } | null => {
      const hitRadiusPx = 10;
      for (const tp of terrainPolygons) {
        for (let vi = 0; vi < tp.points.length; vi++) {
          const pt = tp.points[vi];
          const { sx: vsx, sy: vsy } = tileToScreen(pt.x, pt.y);
          if (Math.hypot(sx - vsx, sy - vsy) < hitRadiusPx) {
            return { terrainId: tp.id, vertexIdx: vi };
          }
        }
      }
      return null;
    },
    [terrainPolygons, tileToScreen]
  );

  const findTerrainEdgeAt = useCallback(
    (
      sx: number,
      sy: number
    ): {
      terrainId: string;
      edgeIdx: number;
      point: { x: number; y: number };
    } | null => {
      const hitRadiusPx = 8;
      for (const tp of terrainPolygons) {
        if (tp.points.length < 2) continue;
        for (let i = 0; i < tp.points.length; i++) {
          const p1 = tp.points[i];
          const p2 = tp.points[(i + 1) % tp.points.length];
          const { sx: sx1, sy: sy1 } = tileToScreen(p1.x, p1.y);
          const { sx: sx2, sy: sy2 } = tileToScreen(p2.x, p2.y);
          const { dist, t } = distToSegment(sx, sy, sx1, sy1, sx2, sy2);
          if (dist < hitRadiusPx && t > 0.05 && t < 0.95) {
            const wx = p1.x + t * (p2.x - p1.x);
            const wy = p1.y + t * (p2.y - p1.y);
            return { terrainId: tp.id, edgeIdx: i, point: { x: wx, y: wy } };
          }
        }
      }
      return null;
    },
    [terrainPolygons, tileToScreen]
  );

  const findBorderVertexAt = useCallback(
    (
      sx: number,
      sy: number
    ): { borderId: string; vertexIdx: number } | null => {
      const hitRadiusPx = 10;
      for (const zb of zoneBorders) {
        for (let vi = 0; vi < zb.points.length; vi++) {
          const pt = zb.points[vi];
          const { sx: vsx, sy: vsy } = tileToScreen(pt.x, pt.y);
          if (Math.hypot(sx - vsx, sy - vsy) < hitRadiusPx) {
            return { borderId: zb.id, vertexIdx: vi };
          }
        }
      }
      return null;
    },
    [zoneBorders, tileToScreen]
  );

  const findBorderEdgeAt = useCallback(
    (
      sx: number,
      sy: number
    ): {
      borderId: string;
      edgeIdx: number;
      point: { x: number; y: number };
    } | null => {
      const hitRadiusPx = 8;
      for (const zb of zoneBorders) {
        if (zb.points.length < 2) continue;
        const len = zb.closed ? zb.points.length : zb.points.length - 1;
        for (let i = 0; i < len; i++) {
          const p1 = zb.points[i];
          const p2 = zb.points[(i + 1) % zb.points.length];
          const { sx: sx1, sy: sy1 } = tileToScreen(p1.x, p1.y);
          const { sx: sx2, sy: sy2 } = tileToScreen(p2.x, p2.y);
          const { dist, t } = distToSegment(sx, sy, sx1, sy1, sx2, sy2);
          if (dist < hitRadiusPx && t > 0.05 && t < 0.95) {
            const wx = p1.x + t * (p2.x - p1.x);
            const wy = p1.y + t * (p2.y - p1.y);
            return { borderId: zb.id, edgeIdx: i, point: { x: wx, y: wy } };
          }
        }
      }
      return null;
    },
    [zoneBorders, tileToScreen]
  );

  /* ---------------------------------------------------------------- */
  /*  TERRAIN & BORDER DRAWING HELPERS                                 */
  /* ---------------------------------------------------------------- */

  const finishDrawing = useCallback(() => {
    if (drawingPoints.length >= 3) {
      const newTerrain: TerrainPolygon = {
        id: uid("terrain"),
        type: "blocked",
        points: [...drawingPoints],
      };
      setTerrainPolygons((prev) => [...prev, newTerrain]);
    }
    setDrawingPoints([]);
    setIsDrawingTerrain(false);
  }, [drawingPoints]);

  const cancelDrawing = useCallback(() => {
    setDrawingPoints([]);
    setIsDrawingTerrain(false);
  }, []);

  const finishBorderDrawing = useCallback(
    (close: boolean) => {
      if (borderDrawingPoints.length >= 2) {
        const newBorder: ZoneBorder = {
          id: uid("border"),
          points: [...borderDrawingPoints],
          closed: close,
        };
        setZoneBorders((prev) => [...prev, newBorder]);
      }
      setBorderDrawingPoints([]);
      setIsDrawingBorder(false);
    },
    [borderDrawingPoints]
  );

  const cancelBorderDrawing = useCallback(() => {
    setBorderDrawingPoints([]);
    setIsDrawingBorder(false);
  }, []);

  /* ---------------------------------------------------------------- */
  /*  COORDINATE SEARCH / GO TO                                        */
  /* ---------------------------------------------------------------- */

  const handleGoTo = useCallback(() => {
    const x = parseInt(goToX, 10);
    const y = parseInt(goToY, 10);
    if (isNaN(x) || isNaN(y)) return;
const cx = clamp(x - MAP_OFFSET_X, 0, MAP_SIZE);
const cy = clamp(MAP_SIZE - y - MAP_OFFSET_Y, 0, MAP_SIZE);
    setCamera((c) => ({ ...c, x: cx, y: cy }));
    // Place a marker
    const newMarker: Marker = { id: uid("marker"), x: cx, y: cy };
    setMarkers((prev) => [...prev, newMarker]);
  }, [goToX, goToY]);

  /* ---------------------------------------------------------------- */
  /*  COORDINATE PLACEMENT                                             */
  /* ---------------------------------------------------------------- */

  const handleCoordPlace = useCallback(() => {
    const x = parseInt(coordPlaceX, 10);
    const y = parseInt(coordPlaceY, 10);
    if (isNaN(x) || isNaN(y)) return;
    // convert display X -> internal X
const cx = clamp(x - MAP_OFFSET_X, 0, MAP_SIZE);
const cy = clamp(MAP_SIZE - y - MAP_OFFSET_Y, 0, MAP_SIZE);
    const SNAP = 3; // or your snapStep value
if (tool === "place-node") {
  const newNode: ResourceNode = {
    id: uid("node"),
    type: selectedNodeType,
    x: cx,
    y: cy,
  };
  setResourceNodes((prev) => [...prev, newNode]);
} else if (tool === "place-structure") {
  const def = KINGDOM_STRUCTURE_DEFS[selectedStructureType];
  const footprint = def.half * 2 + 1;
  const halfCenter = Math.floor(footprint / 2);

  // snap the CENTER, then convert to bottom-left
  const snappedCX = snapToStep(cx);
  const snappedCY = snapToStep(cy);

  const blX = clamp(snappedCX - halfCenter, 0, MAP_SIZE);
  const blY = clamp(snappedCY - halfCenter, 0, MAP_SIZE);

  const newStructure: KingdomStructure = {
    id: uid("struct"),
    type: selectedStructureType,
    x: blX,
    y: blY,
  };

  setStructures((prev) => [...prev, newStructure]);
} else {
      const kind = getKindFromTool(tool);
      if (kind) {
        const gx = clamp(snapToStep(cx), 0, MAP_SIZE);
        const gy = clamp(snapToStep(cy), 0, MAP_SIZE);
        const newItem: Placeable = { id: uid(kind), kind, x: gx, y: gy };
        setItems((prev) => [...prev, newItem]);
        setSelectedId(newItem.id);
      }
    }
    setCamera((c) => ({ ...c, x: cx, y: cy }));
  }, [
    coordPlaceX,
    coordPlaceY,
    tool,
    selectedNodeType,
    selectedStructureType,
  ]);

  /* ---------------------------------------------------------------- */
  /*  KEYBOARD                                                         */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      
      if (
        e.key === "Enter" &&
        isDrawingTerrain &&
        drawingPoints.length >= 3
      ) {
        e.preventDefault();
        finishDrawing();
      }
      
      if (
        e.key === "Enter" &&
        isDrawingBorder &&
        borderDrawingPoints.length >= 2
      ) {
        e.preventDefault();
        finishBorderDrawing(false);
      }
      if (e.key === "Escape") {
        if (isDrawingTerrain) {
          cancelDrawing();
        } else if (isDrawingBorder) {
          cancelBorderDrawing();
        } else if (tool === "edit-terrain" && editingVertexIdx !== null) {
          setEditingVertexIdx(null);
        } else if (
          tool === "edit-border" &&
          editingBorderVertexIdx !== null
        ) {
          setEditingBorderVertexIdx(null);
        }
      }
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        tool === "edit-terrain" &&
        editingTerrainId &&
        editingVertexIdx !== null
      ) {
        e.preventDefault();
        setTerrainPolygons((prev) =>
          prev
            .map((tp) => {
              if (tp.id !== editingTerrainId) return tp;
              const newPts = tp.points.filter((_, i) => i !== editingVertexIdx);
              if (newPts.length < 3) return null as unknown as TerrainPolygon;
              return { ...tp, points: newPts };
            })
            .filter(Boolean)
        );
        setEditingVertexIdx(null);
      }
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        tool === "edit-border" &&
        editingBorderId &&
        editingBorderVertexIdx !== null
      ) {
        e.preventDefault();
        setZoneBorders((prev) =>
          prev
            .map((zb) => {
              if (zb.id !== editingBorderId) return zb;
              const newPts = zb.points.filter(
                (_, i) => i !== editingBorderVertexIdx
              );
              if (newPts.length < 2) return null as unknown as ZoneBorder;
              return { ...zb, points: newPts };
            })
            .filter(Boolean)
        );
        setEditingBorderVertexIdx(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    isDrawingTerrain,
    drawingPoints,
    finishDrawing,
    cancelDrawing,
    isDrawingBorder,
    borderDrawingPoints,
    finishBorderDrawing,
    cancelBorderDrawing,
    tool,
    editingTerrainId,
    editingVertexIdx,
    editingBorderId,
    editingBorderVertexIdx,
  ]);

  /* ESC exits fullscreen */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isFullscreen]);

  /* ---------------------------------------------------------------- */
  /*  MOUSE HANDLERS                                                   */
  /* ---------------------------------------------------------------- */

  const getCanvasPos = (e: React.MouseEvent): { sx: number; sy: number } => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { sx: e.clientX - rect.left, sy: e.clientY - rect.top };
  };

  const clearAllSelections = () => {
    setSelectedId(null);
    setSelectedNodeId(null);
    setSelectedStructureId(null);
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const { sx, sy } = getCanvasPos(e);

      // middle-click or alt+click = pan (always)
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        setIsPanning(true);
        panStart.current = {
          mx: e.clientX,
          my: e.clientY,
          cx: camera.x,
          cy: camera.y,
        };
        return;
      }

      /* --- DRAW TERRAIN MODE --- */
      if (tool === "draw-terrain" && e.button === 0) {
        const { tx, ty } = screenToTile(sx, sy);
        if (isDrawingTerrain && drawingPoints.length >= 3) {
          const first = drawingPoints[0];
          const { sx: fsx, sy: fsy } = tileToScreen(first.x, first.y);
          if (Math.hypot(sx - fsx, sy - fsy) < 12) {
            finishDrawing();
            return;
          }
        }
        setDrawingPoints((prev) => [...prev, { x: tx, y: ty }]);
        if (!isDrawingTerrain) setIsDrawingTerrain(true);
        return;
      }

      /* --- EDIT TERRAIN MODE --- */
      if (tool === "edit-terrain" && e.button === 0) {
        const vHit = findTerrainVertexAt(sx, sy);
        if (vHit) {
          setEditingTerrainId(vHit.terrainId);
          setEditingVertexIdx(vHit.vertexIdx);
          setIsDraggingVertex(true);
          return;
        }
        const eHit = findTerrainEdgeAt(sx, sy);
        if (eHit) {
          setTerrainPolygons((prev) =>
            prev.map((tp) => {
              if (tp.id !== eHit.terrainId) return tp;
              const newPts = [...tp.points];
              newPts.splice(eHit.edgeIdx + 1, 0, { ...eHit.point });
              return { ...tp, points: newPts };
            })
          );
          setEditingTerrainId(eHit.terrainId);
          setEditingVertexIdx(eHit.edgeIdx + 1);
          setIsDraggingVertex(true);
          return;
        }
        const { tx, ty } = screenToTile(sx, sy);
        for (const tp of terrainPolygons) {
          if (tp.points.length >= 3 && pointInPolygon(tx, ty, tp.points)) {
            setEditingTerrainId(tp.id);
            setEditingVertexIdx(null);
            return;
          }
        }
        setEditingTerrainId(null);
        setEditingVertexIdx(null);
        setIsPanning(true);
        panStart.current = {
          mx: e.clientX,
          my: e.clientY,
          cx: camera.x,
          cy: camera.y,
        };
        return;
      }

      /* --- DRAW BORDER MODE --- */
      if (tool === "draw-border" && e.button === 0) {
        const { tx, ty } = screenToTile(sx, sy);
        if (isDrawingBorder && borderDrawingPoints.length >= 3) {
          const first = borderDrawingPoints[0];
          const { sx: fsx, sy: fsy } = tileToScreen(first.x, first.y);
          if (Math.hypot(sx - fsx, sy - fsy) < 12) {
            finishBorderDrawing(true);
            return;
          }
        }
        setBorderDrawingPoints((prev) => [...prev, { x: tx, y: ty }]);
        if (!isDrawingBorder) setIsDrawingBorder(true);
        return;
      }

      /* --- EDIT BORDER MODE --- */
      if (tool === "edit-border" && e.button === 0) {
        const vHit = findBorderVertexAt(sx, sy);
        if (vHit) {
          setEditingBorderId(vHit.borderId);
          setEditingBorderVertexIdx(vHit.vertexIdx);
          setIsDraggingBorderVertex(true);
          return;
        }
        const eHit = findBorderEdgeAt(sx, sy);
        if (eHit) {
          setZoneBorders((prev) =>
            prev.map((zb) => {
              if (zb.id !== eHit.borderId) return zb;
              const newPts = [...zb.points];
              newPts.splice(eHit.edgeIdx + 1, 0, { ...eHit.point });
              return { ...zb, points: newPts };
            })
          );
          setEditingBorderId(eHit.borderId);
          setEditingBorderVertexIdx(eHit.edgeIdx + 1);
          setIsDraggingBorderVertex(true);
          return;
        }
        setEditingBorderId(null);
        setEditingBorderVertexIdx(null);
        setIsPanning(true);
        panStart.current = {
          mx: e.clientX,
          my: e.clientY,
          cx: camera.x,
          cy: camera.y,
        };
        return;
      }

      /* --- PLACE NODE MODE --- */
      if (tool === "place-node" && e.button === 0) {
        // Check if clicking an existing node to drag
        const nodeHit = findResourceNodeAt(sx, sy);
        if (nodeHit) {
          clearAllSelections();
          setSelectedNodeId(nodeHit.id);
          setIsDraggingNode(true);
          const { tx, ty } = screenToTile(sx, sy);
          nodeDragStart.current = {
            nodeId: nodeHit.id,
            startMouseX: tx,
            startMouseY: ty,
            origX: nodeHit.x,
            origY: nodeHit.y,
          };
          return;
        }
        const { tx, ty } = screenToTile(sx, sy);
        const newNode: ResourceNode = {
          id: uid("node"),
          type: selectedNodeType,
          x: clamp(tx, 0, MAP_SIZE),
          y: clamp(ty, 0, MAP_SIZE),
        };
        setResourceNodes((prev) => [...prev, newNode]);
        clearAllSelections();
        setSelectedNodeId(newNode.id);
        return;
      }

      /* --- PLACE STRUCTURE MODE --- */
      if (tool === "place-structure" && e.button === 0) {
        const structHit = findStructureAt(sx, sy);
        if (structHit) {
          clearAllSelections();
          setSelectedStructureId(structHit.id);
          setIsDraggingStructure(true);
          const { tx, ty } = screenToTile(sx, sy);
          structureDragStart.current = {
            structureId: structHit.id,
            startMouseX: tx,
            startMouseY: ty,
            origX: structHit.x,
            origY: structHit.y,
          };
          return;
        }
        const { tx, ty } = screenToTile(sx, sy);
        const def = KINGDOM_STRUCTURE_DEFS[selectedStructureType];
        const footprint = def.half * 2 + 1;
        const blX = clamp(tx - Math.floor(footprint / 2), 0, MAP_SIZE);
        const blY = clamp(ty - Math.floor(footprint / 2), 0, MAP_SIZE);
        const newStructure: KingdomStructure = {
          id: uid("struct"),
          type: selectedStructureType,
          x: blX,
          y: blY,
        };
        setStructures((prev) => [...prev, newStructure]);
        clearAllSelections();
        setSelectedStructureId(newStructure.id);
        return;
      }

      /* --- SELECT MODE --- */
      if (tool === "select") {
        // Check markers first (small targets)
        const markerHit = findMarkerAt(sx, sy);
        if (markerHit) {
          // Remove marker on click
          setMarkers((prev) => prev.filter((m) => m.id !== markerHit.id));
          return;
        }

        // Check resource nodes
        const nodeHit = findResourceNodeAt(sx, sy);
        if (nodeHit) {
          clearAllSelections();
          setSelectedNodeId(nodeHit.id);
          setIsDraggingNode(true);
          const { tx, ty } = screenToTile(sx, sy);
          nodeDragStart.current = {
            nodeId: nodeHit.id,
            startMouseX: tx,
            startMouseY: ty,
            origX: nodeHit.x,
            origY: nodeHit.y,
          };
          return;
        }

        // Check kingdom structures
        const structHit = findStructureAt(sx, sy);
        if (structHit) {
          clearAllSelections();
          setSelectedStructureId(structHit.id);
          setIsDraggingStructure(true);
          const { tx, ty } = screenToTile(sx, sy);
          structureDragStart.current = {
            structureId: structHit.id,
            startMouseX: tx,
            startMouseY: ty,
            origX: structHit.x,
            origY: structHit.y,
          };
          return;
        }

        // Check flags/fortresses
        const hit = findItemAt(sx, sy);
        if (hit) {
          clearAllSelections();
          setSelectedId(hit.id);
          setIsDragging(true);
          const { tx, ty } = screenToTile(sx, sy);
          dragStart.current = {
            itemId: hit.id,
            startMouseTileX: tx,
            startMouseTileY: ty,
            origX: hit.x,
            origY: hit.y,
          };
        } else {
          clearAllSelections();
          setIsPanning(true);
          panStart.current = {
            mx: e.clientX,
            my: e.clientY,
            cx: camera.x,
            cy: camera.y,
          };
        }
        return;
      }

      /* --- PLACE-* TOOLS (flag/cf/af/af2) --- */
      const kind = getKindFromTool(tool);
      if (kind) {
        const hit = findItemAt(sx, sy);
        if (hit) {
          clearAllSelections();
          setSelectedId(hit.id);
          setTool("select");
          setIsDragging(true);
          const { tx, ty } = screenToTile(sx, sy);
          dragStart.current = {
            itemId: hit.id,
            startMouseTileX: tx,
            startMouseTileY: ty,
            origX: hit.x,
            origY: hit.y,
          };
          return;
        }
        const { tx, ty } = screenToTile(sx, sy);
        const gx = clamp(snapToStep(tx), 0, MAP_SIZE);
        const gy = clamp(snapToStep(ty), 0, MAP_SIZE);
        if (isInsideBlockedTerrain(gx, gy)) return;
        const newItem: Placeable = { id: uid(kind), kind, x: gx, y: gy };
        setItems((prev) => [...prev, newItem]);
        clearAllSelections();
        setSelectedId(newItem.id);
      }
    },
    [
      tool,
      camera,
      findItemAt,
      findResourceNodeAt,
      findStructureAt,
      findMarkerAt,
      screenToTile,
      tileToScreen,
      isDrawingTerrain,
      drawingPoints,
      finishDrawing,
      isDrawingBorder,
      borderDrawingPoints,
      finishBorderDrawing,
      findTerrainVertexAt,
      findTerrainEdgeAt,
      findBorderVertexAt,
      findBorderEdgeAt,
      terrainPolygons,
      isInsideBlockedTerrain,
      selectedNodeType,
      selectedStructureType,
    ]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const { sx, sy } = getCanvasPos(e);
      const { tx, ty } = screenToTile(sx, sy);

      setHoverTile({ x: Math.round(tx), y: Math.round(ty) });
      setWorldMouse({ x: tx, y: ty });

      if (isPanning) {
        const dx = (e.clientX - panStart.current.mx) / camera.zoom;
        const dy = (e.clientY - panStart.current.my) / camera.zoom;
        setCamera((prev) => ({
          ...prev,
          x: panStart.current.cx - dx,
          y: panStart.current.cy - dy,
        }));
        return;
      }

      // Drag terrain vertex
      if (isDraggingVertex && editingTerrainId && editingVertexIdx !== null) {
        setTerrainPolygons((prev) =>
          prev.map((tp) => {
            if (tp.id !== editingTerrainId) return tp;
            const newPts = [...tp.points];
            newPts[editingVertexIdx] = { x: tx, y: ty };
            return { ...tp, points: newPts };
          })
        );
        return;
      }

      // Drag border vertex
      if (
        isDraggingBorderVertex &&
        editingBorderId &&
        editingBorderVertexIdx !== null
      ) {
        setZoneBorders((prev) =>
          prev.map((zb) => {
            if (zb.id !== editingBorderId) return zb;
            const newPts = [...zb.points];
            newPts[editingBorderVertexIdx] = { x: tx, y: ty };
            return { ...zb, points: newPts };
          })
        );
        return;
      }

      // Edge hover detection in edit mode
      if (tool === "edit-terrain" && !isDraggingVertex) {
        const vHit = findTerrainVertexAt(sx, sy);
        if (vHit) {
          setHoveredEdge(null);
        } else {
          const eHit = findTerrainEdgeAt(sx, sy);
          setHoveredEdge(eHit);
        }
      } else {
        setHoveredEdge(null);
      }

      // Drag resource node (free movement)
      if (isDraggingNode && selectedNodeId) {
        const deltaX = tx - nodeDragStart.current.startMouseX;
        const deltaY = ty - nodeDragStart.current.startMouseY;
        const newX = clamp(nodeDragStart.current.origX + deltaX, 0, MAP_SIZE);
        const newY = clamp(nodeDragStart.current.origY + deltaY, 0, MAP_SIZE);
        setResourceNodes((prev) =>
          prev.map((n) =>
            n.id === selectedNodeId ? { ...n, x: newX, y: newY } : n
          )
        );
        return;
      }

// Drag kingdom structure (snap by center)
if (isDraggingStructure && selectedStructureId) {
  const deltaX = tx - structureDragStart.current.startMouseX;
  const deltaY = ty - structureDragStart.current.startMouseY;

  const struct = structures.find(s => s.id === selectedStructureId);
  if (!struct) return;

  const def = KINGDOM_STRUCTURE_DEFS[struct.type];
  const footprint = def.half * 2 + 1;
  const halfCenter = Math.floor(footprint / 2);

  // move bottom-left first
  const rawX = structureDragStart.current.origX + deltaX;
  const rawY = structureDragStart.current.origY + deltaY;

  // compute center
  const centerX = rawX + halfCenter;
  const centerY = rawY + halfCenter;

  // snap center
  const snappedCenterX = snapToStep(centerX);
  const snappedCenterY = snapToStep(centerY);

  // convert back to bottom-left
  const newX = clamp(snappedCenterX - halfCenter, 0, MAP_SIZE);
  const newY = clamp(snappedCenterY - halfCenter, 0, MAP_SIZE);

  setStructures(prev =>
    prev.map(s =>
      s.id === selectedStructureId ? { ...s, x: newX, y: newY } : s
    )
  );

  return;
}


      // Shared snap-based dragging for flags/fortresses
      if (isDragging && selectedId) {
        const deltaTileX = tx - dragStart.current.startMouseTileX;
        const deltaTileY = ty - dragStart.current.startMouseTileY;
        const snappedDeltaX = Math.round(deltaTileX / SNAP_STEP) * SNAP_STEP;
        const snappedDeltaY = Math.round(deltaTileY / SNAP_STEP) * SNAP_STEP;
        const newX = clamp(
          dragStart.current.origX + snappedDeltaX,
          0,
          MAP_SIZE
        );
        const newY = clamp(
          dragStart.current.origY + snappedDeltaY,
          0,
          MAP_SIZE
        );
        setItems((prev) =>
          prev.map((p) =>
            p.id === selectedId ? { ...p, x: newX, y: newY } : p
          )
        );
      }
    },
    [
      isPanning,
      isDragging,
      isDraggingVertex,
      isDraggingNode,
      isDraggingStructure,
      isDraggingBorderVertex,
      selectedId,
      selectedNodeId,
      selectedStructureId,
      camera.zoom,
      screenToTile,
      editingTerrainId,
      editingVertexIdx,
      editingBorderId,
      editingBorderVertexIdx,
      tool,
      findTerrainVertexAt,
      findTerrainEdgeAt,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setIsDragging(false);
    setIsDraggingVertex(false);
    setIsDraggingNode(false);
    setIsDraggingStructure(false);
    setIsDraggingBorderVertex(false);
  }, []);

  const handleWheelRef = useRef<((e: WheelEvent) => void) | null>(null);
  handleWheelRef.current = (e: WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const { tx: worldTx, ty: worldTy } = screenToTile(sx, sy);
    const factor = Math.exp(-e.deltaY * ZOOM_SENSITIVITY);
    const newZoom = clamp(camera.zoom * factor, MIN_ZOOM, MAX_ZOOM);
    const newX = worldTx - (sx - canvasSize.w / 2) / newZoom;
    const newY = worldTy - (sy - canvasSize.h / 2) / newZoom;
    setCamera({ x: newX, y: newY, zoom: newZoom });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = (e: WheelEvent) => handleWheelRef.current?.(e);
    canvas.addEventListener("wheel", handler, { passive: false });
    return () => canvas.removeEventListener("wheel", handler);
  }, []);

  /* ---------------------------------------------------------------- */
  /*  RIGHT-CLICK                                                      */
  /* ---------------------------------------------------------------- */

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (tool === "draw-terrain") {
        if (drawingPoints.length > 0) {
          setDrawingPoints((prev) => prev.slice(0, -1));
          if (drawingPoints.length <= 1) setIsDrawingTerrain(false);
        }
        return;
      }
      if (tool === "draw-border") {
        if (borderDrawingPoints.length > 0) {
          setBorderDrawingPoints((prev) => prev.slice(0, -1));
          if (borderDrawingPoints.length <= 1) setIsDrawingBorder(false);
        }
        return;
      }
      if (tool === "edit-terrain") {
        const { sx, sy } = getCanvasPos(e);
        const { tx, ty } = screenToTile(sx, sy);
        for (const tp of terrainPolygons) {
          if (tp.points.length >= 3 && pointInPolygon(tx, ty, tp.points)) {
            setTerrainPolygons((prev) => prev.filter((t) => t.id !== tp.id));
            if (editingTerrainId === tp.id) {
              setEditingTerrainId(null);
              setEditingVertexIdx(null);
            }
            return;
          }
        }
        return;
      }
      if (tool === "edit-border") {
        const { sx, sy } = getCanvasPos(e);
        const vHit = findBorderVertexAt(sx, sy);
        if (vHit) {
          setZoneBorders((prev) =>
            prev
              .map((zb) => {
                if (zb.id !== vHit.borderId) return zb;
                const newPts = zb.points.filter(
                  (_, i) => i !== vHit.vertexIdx
                );
                if (newPts.length < 2) return null as unknown as ZoneBorder;
                return { ...zb, points: newPts };
              })
              .filter(Boolean)
          );
          return;
        }
        return;
      }
      const { sx, sy } = getCanvasPos(e);

      // Check resource nodes
      const nodeHit = findResourceNodeAt(sx, sy);
      if (nodeHit) {
        setResourceNodes((prev) => prev.filter((n) => n.id !== nodeHit.id));
        if (selectedNodeId === nodeHit.id) setSelectedNodeId(null);
        return;
      }

      // Check kingdom structures
      const structHit = findStructureAt(sx, sy);
      if (structHit) {
        setStructures((prev) => prev.filter((s) => s.id !== structHit.id));
        if (selectedStructureId === structHit.id)
          setSelectedStructureId(null);
        return;
      }

      // Check markers
      const markerHit = findMarkerAt(sx, sy);
      if (markerHit) {
        setMarkers((prev) => prev.filter((m) => m.id !== markerHit.id));
        return;
      }

      // Check flags/fortresses
      const hit = findItemAt(sx, sy);
      if (hit) {
        setItems((prev) => prev.filter((p) => p.id !== hit.id));
        if (selectedId === hit.id) setSelectedId(null);
      }
    },
    [
      findItemAt,
      findResourceNodeAt,
      findStructureAt,
      findMarkerAt,
      findBorderVertexAt,
      selectedId,
      selectedNodeId,
      selectedStructureId,
      tool,
      drawingPoints,
      borderDrawingPoints,
      terrainPolygons,
      editingTerrainId,
      screenToTile,
    ]
  );

  /* ---------------------------------------------------------------- */
  /*  DRAW                                                             */
  /* ---------------------------------------------------------------- */

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { w, h } = canvasSize;
    const dpr =
      typeof devicePixelRatio !== "undefined" ? devicePixelRatio : 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, w, h);

    const { zoom } = camera;
    const halfW = w / 2 / zoom;
    const halfH = h / 2 / zoom;
    const vMinX = camera.x - halfW - 10;
    const vMaxX = camera.x + halfW + 10;
    const vMinY = camera.y - halfH - 10;
    const vMaxY = camera.y + halfH + 10;

    /* --- GRID LINES --- */
    const drawGrid = (step: number, color: string, lineWidth: number) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      const startX = Math.floor(vMinX / step) * step;
      const startY = Math.floor(vMinY / step) * step;
      ctx.beginPath();
      for (let gx = startX; gx <= vMaxX + step; gx += step) {
        const { sx } = tileToScreen(gx, 0);
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, h);
      }
      for (let gy = startY; gy <= vMaxY + step; gy += step) {
        const { sy } = tileToScreen(0, gy);
        ctx.moveTo(0, sy);
        ctx.lineTo(w, sy);
      }
      ctx.stroke();
    };

    if (zoom >= 8) {
      drawGrid(1, "rgba(0,0,0,0.04)", 0.3);
      drawGrid(SNAP_STEP, GRID_COLOR_MINOR, 0.5);
      drawGrid(9, "rgba(0,0,0,0.08)", 0.6);
      drawGrid(50, GRID_COLOR_MAJOR, 0.8);
      drawGrid(100, "rgba(0,0,0,0.18)", 1);
    } else if (zoom >= 3) {
      drawGrid(SNAP_STEP, "rgba(0,0,0,0.04)", 0.3);
      drawGrid(9, GRID_COLOR_MINOR, 0.5);
      drawGrid(50, GRID_COLOR_MAJOR, 0.7);
      drawGrid(100, "rgba(0,0,0,0.15)", 1);
    } else if (zoom >= 1) {
      drawGrid(9, GRID_COLOR_MINOR, 0.4);
      drawGrid(50, GRID_COLOR_MAJOR, 0.6);
      drawGrid(100, "rgba(0,0,0,0.15)", 0.8);
    } else {
      drawGrid(50, GRID_COLOR_MINOR, 0.4);
      drawGrid(100, GRID_COLOR_MAJOR, 0.6);
      drawGrid(200, "rgba(0,0,0,0.15)", 0.8);
    }

    // Map border
    const { sx: bx0, sy: by0 } = tileToScreen(0, 0);
    const { sx: bx1, sy: by1 } = tileToScreen(MAP_SIZE, MAP_SIZE);
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 2;
    ctx.strokeRect(bx0, by0, bx1 - bx0, by1 - by0);

    // Coordinate labels
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = `${Math.max(9, 11 * Math.min(zoom / 3, 1))}px monospace`;
    ctx.textAlign = "center";
    const labelStep = zoom >= 3 ? 50 : zoom >= 1 ? 100 : 200;
    for (let lx = 0; lx <= MAP_SIZE; lx += labelStep) {
      const { sx } = tileToScreen(lx, 0);
      if (sx > -20 && sx < w + 20) {
        ctx.fillText(String(displayX(lx)), sx, by0 - 6 > 12 ? by0 - 6 : 12);
      }
    }
    ctx.textAlign = "right";
    for (let ly = 0; ly <= MAP_SIZE; ly += labelStep) {
      const { sy } = tileToScreen(0, ly);
      if (sy > -20 && sy < h + 20) {
        ctx.fillText(String(displayY(ly)), bx0 - 8 > 30 ? bx0 - 8 : 30, sy + 3);
      }
    }

    /* --- TERRAIN POLYGONS --- */
    for (const tp of terrainPolygons) {
      if (tp.points.length < 3) continue;
      const isEditing = tool === "edit-terrain" && editingTerrainId === tp.id;

      ctx.fillStyle = isEditing ? "rgba(239, 68, 68, 0.18)" : TERRAIN_FILL;
      ctx.beginPath();
      const fp = tp.points[0];
      const { sx: fsx, sy: fsy } = tileToScreen(fp.x, fp.y);
      ctx.moveTo(fsx, fsy);
      for (let i = 1; i < tp.points.length; i++) {
        const pt = tp.points[i];
        const { sx: psx, sy: psy } = tileToScreen(pt.x, pt.y);
        ctx.lineTo(psx, psy);
      }
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = isEditing ? "#ef4444" : TERRAIN_STROKE;
      ctx.lineWidth = isEditing ? 2 : 1.5;
      ctx.setLineDash(isEditing ? [] : [6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Hatching
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = "rgba(239, 68, 68, 0.08)";
      ctx.lineWidth = 1;
      const hatchStep = Math.max(8, 16 / Math.max(zoom, 0.5));
      for (let d = -2000; d < 4000; d += hatchStep) {
        ctx.beginPath();
        ctx.moveTo(bx0 + d, by0);
        ctx.lineTo(bx0 + d - 2000, by0 + 2000);
        ctx.stroke();
      }
      ctx.restore();

      // Vertices (edit mode)
      if (isEditing) {
        for (let vi = 0; vi < tp.points.length; vi++) {
          const pt = tp.points[vi];
          const { sx: vsx, sy: vsy } = tileToScreen(pt.x, pt.y);
          const isActive = editingVertexIdx === vi;
          const r = isActive ? 6 : 4.5;
          ctx.fillStyle = isActive
            ? TERRAIN_VERTEX_ACTIVE
            : TERRAIN_VERTEX_COLOR;
          ctx.beginPath();
          ctx.arc(vsx, vsy, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(0,0,0,0.5)";
          ctx.lineWidth = 1;
          ctx.stroke();
          if (isActive) {
            ctx.strokeStyle = TERRAIN_VERTEX_ACTIVE;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.arc(vsx, vsy, r + 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
        if (hoveredEdge && hoveredEdge.terrainId === tp.id) {
          const { sx: hsx, sy: hsy } = tileToScreen(
            hoveredEdge.point.x,
            hoveredEdge.point.y
          );
          ctx.fillStyle = TERRAIN_EDGE_HOVER;
          ctx.beginPath();
          ctx.arc(hsx, hsy, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#fbbf24";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      if (zoom >= 1) {
        let cx = 0,
          cy = 0;
        for (const pt of tp.points) {
          cx += pt.x;
          cy += pt.y;
        }
        cx /= tp.points.length;
        cy /= tp.points.length;
        const { sx: lsx, sy: lsy } = tileToScreen(cx, cy);
        ctx.fillStyle = "rgba(239, 68, 68, 0.6)";
        ctx.font = `bold ${Math.max(9, Math.min(13, zoom * 3))}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("BLOCKED", lsx, lsy);
        ctx.textBaseline = "alphabetic";
      }
    }

    /* --- IN-PROGRESS DRAWING POLYGON (terrain) --- */
    if (drawingPoints.length > 0) {
      ctx.strokeStyle = TERRAIN_DRAWING_STROKE;
      ctx.lineWidth = 2;
      if (drawingPoints.length >= 3) {
        ctx.fillStyle = TERRAIN_DRAWING_FILL;
        ctx.beginPath();
        const dp0 = drawingPoints[0];
        const { sx: dsx0, sy: dsy0 } = tileToScreen(dp0.x, dp0.y);
        ctx.moveTo(dsx0, dsy0);
        for (let i = 1; i < drawingPoints.length; i++) {
          const dp = drawingPoints[i];
          const { sx: dsx, sy: dsy } = tileToScreen(dp.x, dp.y);
          ctx.lineTo(dsx, dsy);
        }
        ctx.closePath();
        ctx.fill();
      }
      ctx.beginPath();
      for (let i = 0; i < drawingPoints.length; i++) {
        const dp = drawingPoints[i];
        const { sx: dsx, sy: dsy } = tileToScreen(dp.x, dp.y);
        if (i === 0) ctx.moveTo(dsx, dsy);
        else ctx.lineTo(dsx, dsy);
      }
      ctx.stroke();
      if (worldMouse) {
        const lastPt = drawingPoints[drawingPoints.length - 1];
        const { sx: lsx, sy: lsy } = tileToScreen(lastPt.x, lastPt.y);
        const { sx: msx, sy: msy } = tileToScreen(worldMouse.x, worldMouse.y);
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = "rgba(239, 68, 68, 0.5)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(lsx, lsy);
        ctx.lineTo(msx, msy);
        ctx.stroke();
        if (drawingPoints.length >= 3) {
          const fp2 = drawingPoints[0];
          const { sx: fsx2, sy: fsy2 } = tileToScreen(fp2.x, fp2.y);
          ctx.beginPath();
          ctx.moveTo(msx, msy);
          ctx.lineTo(fsx2, fsy2);
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }
      for (let i = 0; i < drawingPoints.length; i++) {
        const dp = drawingPoints[i];
        const { sx: dsx, sy: dsy } = tileToScreen(dp.x, dp.y);
        const isFirst = i === 0;
        ctx.fillStyle = isFirst ? "#fbbf24" : TERRAIN_VERTEX_COLOR;
        ctx.beginPath();
        ctx.arc(dsx, dsy, isFirst ? 6 : 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.5)";
        ctx.lineWidth = 1;
        ctx.stroke();
        if (isFirst && drawingPoints.length >= 3 && worldMouse) {
          const { sx: fsx3, sy: fsy3 } = tileToScreen(dp.x, dp.y);
          const { sx: msx2, sy: msy2 } = tileToScreen(
            worldMouse.x,
            worldMouse.y
          );
          if (Math.hypot(msx2 - fsx3, msy2 - fsy3) < 12) {
            ctx.strokeStyle = "#fbbf24";
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.arc(dsx, dsy, 10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      }
    }

    /* --- ZONE BORDERS --- */
    for (const zb of zoneBorders) {
      if (zb.points.length < 2) continue;
      const isEditing = tool === "edit-border" && editingBorderId === zb.id;
      ctx.strokeStyle = isEditing ? "#93c5fd" : BORDER_STROKE;
      ctx.lineWidth = isEditing ? 2.5 : 2;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      const fp = zb.points[0];
      const { sx: fsx, sy: fsy } = tileToScreen(fp.x, fp.y);
      ctx.moveTo(fsx, fsy);
      for (let i = 1; i < zb.points.length; i++) {
        const pt = zb.points[i];
        const { sx: psx, sy: psy } = tileToScreen(pt.x, pt.y);
        ctx.lineTo(psx, psy);
      }
      if (zb.closed) ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);

      // Vertices
      if (isEditing) {
        for (let vi = 0; vi < zb.points.length; vi++) {
          const pt = zb.points[vi];
          const { sx: vsx, sy: vsy } = tileToScreen(pt.x, pt.y);
          const isActive = editingBorderVertexIdx === vi;
          const r = isActive ? 6 : 4.5;
          ctx.fillStyle = isActive ? "#fbbf24" : BORDER_VERTEX_COLOR;
          ctx.beginPath();
          ctx.arc(vsx, vsy, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(0,0,0,0.5)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    /* --- IN-PROGRESS DRAWING BORDER --- */
    if (borderDrawingPoints.length > 0) {
      ctx.strokeStyle = "rgba(96, 165, 250, 0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < borderDrawingPoints.length; i++) {
        const dp = borderDrawingPoints[i];
        const { sx: dsx, sy: dsy } = tileToScreen(dp.x, dp.y);
        if (i === 0) ctx.moveTo(dsx, dsy);
        else ctx.lineTo(dsx, dsy);
      }
      ctx.stroke();
      if (worldMouse) {
        const lastPt = borderDrawingPoints[borderDrawingPoints.length - 1];
        const { sx: lsx, sy: lsy } = tileToScreen(lastPt.x, lastPt.y);
        const { sx: msx, sy: msy } = tileToScreen(worldMouse.x, worldMouse.y);
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = "rgba(96, 165, 250, 0.5)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(lsx, lsy);
        ctx.lineTo(msx, msy);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      for (let i = 0; i < borderDrawingPoints.length; i++) {
        const dp = borderDrawingPoints[i];
        const { sx: dsx, sy: dsy } = tileToScreen(dp.x, dp.y);
        const isFirst = i === 0;
        ctx.fillStyle = isFirst ? "#fbbf24" : BORDER_VERTEX_COLOR;
        ctx.beginPath();
        ctx.arc(dsx, dsy, isFirst ? 6 : 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.5)";
        ctx.lineWidth = 1;
        ctx.stroke();
        if (isFirst && borderDrawingPoints.length >= 3 && worldMouse) {
          const { sx: fsx3, sy: fsy3 } = tileToScreen(dp.x, dp.y);
          const { sx: msx2, sy: msy2 } = tileToScreen(
            worldMouse.x,
            worldMouse.y
          );
          if (Math.hypot(msx2 - fsx3, msy2 - fsy3) < 12) {
            ctx.strokeStyle = "#fbbf24";
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.arc(dsx, dsy, 10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      }
    }

    /* --- KINGDOM STRUCTURES --- */
    // Structure (x,y) = bottom-left tile. Logical footprint = half*2 = 16.
    // Rendered size is (footprint - 1) tiles so flags touch structure corners.
    for (const s of structures) {
      const def = KINGDOM_STRUCTURE_DEFS[s.type];
      const footprint = def.half * 2 + 1; // 16 (logical)
      const renderTiles = footprint; // 15 (visual)
      const { sx: minSx, sy: minSy } = tileToScreen(s.x, s.y);
      const sw = renderTiles * zoom;
      const sh = renderTiles * zoom;
      const isSelected = s.id === selectedStructureId;

      // Fill
      ctx.fillStyle = def.fillColor;
      ctx.fillRect(minSx, minSy, sw, sh);

      // Border
      ctx.strokeStyle = def.color;
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.strokeRect(minSx, minSy, sw, sh);

      if (isSelected) {
        ctx.strokeStyle = def.color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(minSx - 3, minSy - 3, sw + 6, sh + 6);
        ctx.setLineDash([]);
      }

      // Label at visual center of rendered box
      const labelCenterX = s.x + renderTiles / 2;
      const labelCenterY = s.y + renderTiles / 2;
      const { sx: csx, sy: csy } = tileToScreen(labelCenterX, labelCenterY);
      ctx.fillStyle = def.color;
      ctx.font = `bold ${Math.max(8, Math.min(14, zoom * 2.5))}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(def.shortLabel, csx, csy);

      // Show coordinates (bottom-left)
      if (zoom >= 1.5) {
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = `${Math.max(7, Math.min(11, zoom * 2))}px monospace`;
        ctx.fillText(
          `${displayX(Math.round(s.x))},${displayY(Math.round(s.y))}`,
          csx,
          csy + Math.max(10, zoom * 3)
        );
      }

      // Debug info overlay
      if (structureDebugMode && zoom >= 1.0) {
        const blX = Math.round(s.x);
        const blY = Math.round(s.y);
        const trX = blX + renderTiles;
        const trY = blY + renderTiles;
        ctx.fillStyle = "rgba(255,255,0,0.85)";
        ctx.font = `bold ${Math.max(7, Math.min(10, zoom * 1.8))}px monospace`;
        ctx.fillText(
          `BL:(${blX},${displayY(blY) - 1}) TR:(${trX},${displayY(trY) - 1}) ${renderTiles}x${renderTiles}`,
          csx,
          csy - Math.max(10, zoom * 3)
        );
      }

      ctx.textBaseline = "alphabetic";
    }

    /* --- TERRITORY FILL PER KIND (flags/fortresses) --- */
    if (items.length > 0) {
      const occupancy = buildOccupancySet(items);

      for (const kind of PLACEABLE_KINDS) {
        const kindItems = items.filter((p) => p.kind === kind);
        if (kindItems.length === 0) continue;
        const def = STRUCTURE_DEFS[kind];
        ctx.fillStyle = def.fillColor;
        ctx.beginPath();
        for (const p of kindItems) {
          const tileMinX = p.x - def.half;
          const tileMinY = p.y - def.half;
          const size = def.half * 2 + 1;
          const { sx, sy } = tileToScreen(tileMinX, tileMinY);
          ctx.rect(sx, sy, size * zoom, size * zoom);
        }
        ctx.fill();
      }

      // Merged border
      ctx.strokeStyle = "rgba(124, 58, 237, 0.7)";
      ctx.lineWidth = Math.max(1, Math.min(2, zoom * 0.3));
      ctx.setLineDash([Math.max(2, zoom * 1.5), Math.max(2, zoom * 1)]);
      ctx.beginPath();

      const visMinTX = Math.floor(vMinX);
      const visMaxTX = Math.ceil(vMaxX);
      const visMinTY = Math.floor(vMinY);
      const visMaxTY = Math.ceil(vMaxY);

      for (const key of occupancy) {
        const commaIdx = key.indexOf(",");
        const txx = Number.parseInt(key.slice(0, commaIdx), 10);
        const tyy = Number.parseInt(key.slice(commaIdx + 1), 10);
        if (
          txx < visMinTX ||
          txx > visMaxTX ||
          tyy < visMinTY ||
          tyy > visMaxTY
        )
          continue;
        const { sx, sy } = tileToScreen(txx, tyy);
        if (!occupancy.has(`${txx},${tyy - 1}`)) {
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + zoom, sy);
        }
        if (!occupancy.has(`${txx},${tyy + 1}`)) {
          ctx.moveTo(sx, sy + zoom);
          ctx.lineTo(sx + zoom, sy + zoom);
        }
        if (!occupancy.has(`${txx - 1},${tyy}`)) {
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx, sy + zoom);
        }
        if (!occupancy.has(`${txx + 1},${tyy}`)) {
          ctx.moveTo(sx + zoom, sy);
          ctx.lineTo(sx + zoom, sy + zoom);
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    /* --- HOVER PREVIEW (placement ghost) for flags/fortresses --- */
    const activeKind = getKindFromTool(tool);
    if (activeKind && hoverTile) {
      const def = STRUCTURE_DEFS[activeKind];
      const gx = clamp(snapToStep(hoverTile.x), 0, MAP_SIZE);
      const gy = clamp(snapToStep(hoverTile.y), 0, MAP_SIZE);
      const tileMinX = gx - def.half;
      const tileMinY = gy - def.half;
      const size = def.half * 2 + 1;
      const { sx, sy } = tileToScreen(tileMinX, tileMinY);
      const sw = size * zoom;
      const sh = size * zoom;

      const blocked = isInsideBlockedTerrain(gx, gy);

      if (blocked) {
        ctx.fillStyle = "rgba(239, 68, 68, 0.15)";
        ctx.strokeStyle = "rgba(239, 68, 68, 0.6)";
      } else {
        ctx.fillStyle = def.fillColor.replace(/[\d.]+\)$/, "0.10)");
        ctx.strokeStyle = def.color + "55";
      }
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.fillRect(sx, sy, sw, sh);
      ctx.strokeRect(sx, sy, sw, sh);
      ctx.setLineDash([]);

      if (blocked) {
        const cxb = sx + sw / 2;
        const cyb = sy + sh / 2;
        const xr = Math.min(20, sw * 0.3);
        ctx.strokeStyle = "rgba(239, 68, 68, 0.7)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cxb - xr, cyb - xr);
        ctx.lineTo(cxb + xr, cyb + xr);
        ctx.moveTo(cxb + xr, cyb - xr);
        ctx.lineTo(cxb - xr, cyb + xr);
        ctx.stroke();
      } else {
        const { sx: gcx, sy: gcy } = tileToScreen(gx, gy);
        ctx.strokeStyle = def.color + "66";
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(gcx + zoom / 2, gcy - 6);
        ctx.lineTo(gcx + zoom / 2, gcy + zoom + 6);
        ctx.moveTo(gcx - 6, gcy + zoom / 2);
        ctx.lineTo(gcx + zoom + 6, gcy + zoom / 2);
        ctx.stroke();
      }
    }

    /* --- HOVER PREVIEW for kingdom structures --- */
    // Preview uses hoverTile as bottom-left anchor, rendered size = (half*2 - 1)
    if (tool === "place-structure" && hoverTile) {
      const def = KINGDOM_STRUCTURE_DEFS[selectedStructureType];
      const gx = hoverTile.x;
      const gy = hoverTile.y;
      const renderTiles = def.half * 2 - 1; // 15
      const { sx, sy } = tileToScreen(gx, gy);
      const sw = renderTiles * zoom;
      const sh = renderTiles * zoom;
      ctx.fillStyle = def.fillColor.replace(/[\d.]+\)$/, "0.08)");
      ctx.strokeStyle = def.color + "55";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.fillRect(sx, sy, sw, sh);
      ctx.strokeRect(sx, sy, sw, sh);
      ctx.setLineDash([]);
    }

    /* --- HOVER PREVIEW for resource nodes --- */
    if (tool === "place-node" && hoverTile) {
      const def = RESOURCE_NODE_DEFS[selectedNodeType];
      const { sx: nsx, sy: nsy } = tileToScreen(hoverTile.x, hoverTile.y);
      ctx.fillStyle = def.color + "44";
      ctx.beginPath();
      ctx.arc(nsx, nsy, Math.max(4, zoom * 2), 0, Math.PI * 2);
      ctx.fill();
    }

    /* --- RESOURCE NODES --- */
    for (const n of resourceNodes) {
      const def = RESOURCE_NODE_DEFS[n.type];
      const { sx: nsx, sy: nsy } = tileToScreen(n.x, n.y);
      const r = Math.max(5, Math.min(12, zoom * 2));
      const isSelected = n.id === selectedNodeId;

      // Outer circle
      ctx.fillStyle = def.fillColor;
      ctx.beginPath();
      ctx.arc(nsx, nsy, r + 2, 0, Math.PI * 2);
      ctx.fill();

      // Inner circle
      ctx.fillStyle = def.color;
      ctx.beginPath();
      ctx.arc(nsx, nsy, r, 0, Math.PI * 2);
      ctx.fill();

      // Border
      ctx.strokeStyle = isSelected ? "#fff" : "rgba(0,0,0,0.4)";
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.beginPath();
      ctx.arc(nsx, nsy, r, 0, Math.PI * 2);
      ctx.stroke();

      // Label
      ctx.fillStyle = "#000";
      ctx.font = `bold ${Math.max(6, Math.min(10, r * 0.85))}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(def.shortLabel, nsx, nsy);
      ctx.textBaseline = "alphabetic";

      if (isSelected) {
        ctx.strokeStyle = def.color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(nsx, nsy, r + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Coordinate label
      if (zoom >= 1.5) {
        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.font = `${Math.max(7, Math.min(10, zoom * 2))}px monospace`;
        ctx.textAlign = "center";
ctx.fillText(
  `${displayX(Math.round(n.x))},${displayY(Math.round(n.y))}`,
          nsx,
          nsy + r + 12
        );
      }
    }

    /* --- FLAG/FORTRESS MARKERS --- */
    for (const p of items) {
      const def = STRUCTURE_DEFS[p.kind];
      const { sx: tsx, sy: tsy } = tileToScreen(p.x, p.y);
      const cx = tsx + zoom / 2;
      const cy = tsy + zoom / 2;
      const isSelected = p.id === selectedId;
      const r = Math.max(4, Math.min(14, zoom * 1.5));
      const baseColor = isSelected ? def.activeColor : def.color;

      if (p.kind === "flag") {
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy + r * 1.8);
        ctx.lineTo(cx, cy - r);
        ctx.stroke();
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.moveTo(cx, cy - r);
        ctx.lineTo(cx + r * 1.4, cy - r * 0.3);
        ctx.lineTo(cx, cy + r * 0.4);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 1.2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#000";
        ctx.font = `bold ${Math.max(6, Math.min(10, r * 0.9))}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(def.shortLabel, cx, cy);
        ctx.textBaseline = "alphabetic";
      }

      if (isSelected) {
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(cx, cy, r * 2.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (zoom >= 1.5) {
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.font = `${Math.max(8, Math.min(12, zoom * 2.5))}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(
  `${displayX(Math.round(p.x))},${displayY(Math.round(p.y))}`,
  cx,
  cy + r * 1.8 + 12
);
      }
    }

    /* --- MARKERS (coordinate search dots) --- */
    for (const m of markers) {
      const { sx: msx, sy: msy } = tileToScreen(m.x, m.y);
      const r = Math.max(4, Math.min(8, zoom * 1.5));

      // Pulsing ring
      ctx.strokeStyle = "rgba(251, 191, 36, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(msx, msy, r + 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Dot
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(msx, msy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Coord label
      ctx.fillStyle = "#fbbf24";
      ctx.font = `bold ${Math.max(8, Math.min(11, zoom * 2))}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText(`${m.x},${displayY(m.y)}`, msx, msy - r - 5);
    }

    /* --- CURSOR CROSSHAIR (place mode) --- */
    if (isPlaceTool(tool) && hoverTile) {
      const gx = clamp(snapToStep(hoverTile.x), 0, MAP_SIZE);
      const gy = clamp(snapToStep(hoverTile.y), 0, MAP_SIZE);
      const { sx: crossX, sy: crossY } = tileToScreen(gx, gy);
      const csx = crossX + zoom / 2;
      const csy = crossY + zoom / 2;
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 0.5;
      ctx.setLineDash([3, 6]);
      ctx.beginPath();
      ctx.moveTo(csx, 0);
      ctx.lineTo(csx, h);
      ctx.moveTo(0, csy);
      ctx.lineTo(w, csy);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    animRef.current = requestAnimationFrame(draw);
  }, [
    canvasSize,
    camera,
    items,
    selectedId,
    tool,
    hoverTile,
    tileToScreen,
    terrainPolygons,
    drawingPoints,
    worldMouse,
    isDrawingTerrain,
    editingTerrainId,
    editingVertexIdx,
    hoveredEdge,
    isInsideBlockedTerrain,
    resourceNodes,
    selectedNodeId,
    selectedNodeType,
    structures,
    selectedStructureId,
    selectedStructureType,
    structureDebugMode,
    markers,
    zoneBorders,
    borderDrawingPoints,
    isDrawingBorder,
    editingBorderId,
    editingBorderVertexIdx,
  ]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  /* ---------------------------------------------------------------- */
  /*  TOOLBAR ACTIONS                                                  */
  /* ---------------------------------------------------------------- */

  const zoomIn = () =>
    setCamera((c) => ({
      ...c,
      zoom: clamp(c.zoom * 1.3, MIN_ZOOM, MAX_ZOOM),
    }));
  const zoomOut = () =>
    setCamera((c) => ({
      ...c,
      zoom: clamp(c.zoom / 1.3, MIN_ZOOM, MAX_ZOOM),
    }));
  const resetView = () =>
    setCamera({ x: MAP_SIZE / 2, y: MAP_SIZE / 2, zoom: 3.5 });
  const deleteSelected = () => {
    if (selectedId) {
      setItems((prev) => prev.filter((p) => p.id !== selectedId));
      setSelectedId(null);
    }
    if (selectedNodeId) {
      setResourceNodes((prev) =>
        prev.filter((n) => n.id !== selectedNodeId)
      );
      setSelectedNodeId(null);
    }
    if (selectedStructureId) {
      setStructures((prev) =>
        prev.filter((s) => s.id !== selectedStructureId)
      );
      setSelectedStructureId(null);
    }
  };
  const clearAll = () => {
    setItems([]);
    setTerrainPolygons([]);
    setResourceNodes([]);
    setStructures([]);
    setMarkers([]);
    setZoneBorders([]);
    clearAllSelections();
    setEditingTerrainId(null);
    setEditingVertexIdx(null);
    setEditingBorderId(null);
    setEditingBorderVertexIdx(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const hasAnyData =
    items.length > 0 ||
    terrainPolygons.length > 0 ||
    resourceNodes.length > 0 ||
    structures.length > 0 ||
    markers.length > 0 ||
    zoneBorders.length > 0;

  const switchTool = (newTool: ToolMode) => {
    if (tool === "draw-terrain" && newTool !== "draw-terrain") {
      cancelDrawing();
    }
    if (tool === "edit-terrain" && newTool !== "edit-terrain") {
      setEditingTerrainId(null);
      setEditingVertexIdx(null);
    }
    if (tool === "draw-border" && newTool !== "draw-border") {
      cancelBorderDrawing();
    }
    if (tool === "edit-border" && newTool !== "edit-border") {
      setEditingBorderId(null);
      setEditingBorderVertexIdx(null);
    }
    setTool(newTool);
  };

  /* ---------------------------------------------------------------- */
  /*  STATS                                                            */
  /* ---------------------------------------------------------------- */

  const stats = useMemo(() => {
    const counts: Record<PlaceableKind, number> = {
      flag: 0,
      cf: 0,
      af: 0,
      af2: 0,
    };
    for (const p of items) counts[p.kind]++;
    const occupancy = buildOccupancySet(items);
    const uniqueTiles = occupancy.size;
    return { counts, total: items.length, uniqueTiles };
  }, [items]);

  const formatNumber = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return String(n);
  };

  /* ---------------------------------------------------------------- */
  /*  SNAPPED HOVER for display                                        */
  /* ---------------------------------------------------------------- */

  const snappedHover = hoverTile
    ? {
        x: clamp(snapToStep(hoverTile.x), 0, MAP_SIZE),
        y: clamp(snapToStep(hoverTile.y), 0, MAP_SIZE),
      }
    : null;

  /* ---------------------------------------------------------------- */
  /*  CURSOR STYLE                                                     */
  /* ---------------------------------------------------------------- */

  const cursorStyle = isPanning
    ? "grabbing"
    : tool === "draw-terrain" || tool === "draw-border"
      ? "crosshair"
      : tool === "edit-terrain"
        ? isDraggingVertex
          ? "grabbing"
          : hoveredEdge
            ? "copy"
            : "default"
        : tool === "edit-border"
          ? isDraggingBorderVertex
            ? "grabbing"
            : "default"
          : tool === "place-node" || tool === "place-structure"
            ? "crosshair"
            : isPlaceTool(tool)
              ? "crosshair"
              : "default";

  /* ---------------------------------------------------------------- */
  /*  RENDER                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-50 flex flex-col bg-background p-4 overflow-hidden"
          : "flex flex-col gap-4 lg:flex-row lg:items-start max-w-[1600px]"
      }
    >
      {/* MAP AREA */}
      <div className={isFullscreen ? "flex-1 min-w-0 flex flex-col" : "flex-1 min-w-0"}>
        {/* Toolbar Row 1: placement tools */}
        <div className="flex items-center gap-2 flex-wrap mb-2">
          {/* Flag/Fortress tools */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card/60 p-1">
            {PLACEABLE_KINDS.map((kind) => {
              const def = STRUCTURE_DEFS[kind];
              const Icon = KIND_ICONS[kind];
              const toolId = `place-${kind}` as ToolMode;
              const isActive = tool === toolId;
              return (
                <Button
                  key={kind}
                  size="sm"
                  variant={isActive ? "default" : "ghost"}
                  className={`h-8 gap-1.5 text-xs ${!isActive ? "bg-transparent" : ""}`}
                  onClick={() => switchTool(toolId)}
                  title={`Place ${def.label} (${def.half * 2 + 1}x${def.half * 2 + 1} tiles)`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {def.shortLabel}
                </Button>
              );
            })}
            <div className="h-5 w-px bg-border mx-0.5" />
            <Button
              size="sm"
              variant={tool === "select" ? "default" : "ghost"}
              className={`h-8 gap-1.5 text-xs ${tool !== "select" ? "bg-transparent" : ""}`}
              onClick={() => switchTool("select")}
            >
              <MousePointer className="h-3.5 w-3.5" />
              Select
            </Button>
          </div>

          {/* Resource node tool */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card/60 p-1">
            <Button
              size="sm"
              variant={tool === "place-node" ? "default" : "ghost"}
              className={`h-8 gap-1.5 text-xs ${tool !== "place-node" ? "bg-transparent" : ""}`}
              onClick={() => switchTool("place-node")}
              title="Place resource node"
            >
              <Gem className="h-3.5 w-3.5" />
              Node
            </Button>
            {tool === "place-node" && (
              <>
                <div className="h-5 w-px bg-border mx-0.5" />
                {RESOURCE_NODE_TYPES.map((nt) => {
                  const def = RESOURCE_NODE_DEFS[nt];
                  const Icon = RESOURCE_NODE_ICONS[nt];
                  return (
                    <Button
                      key={nt}
                      size="sm"
                      variant={selectedNodeType === nt ? "default" : "ghost"}
                      className={`h-7 gap-1 text-xs ${selectedNodeType !== nt ? "bg-transparent" : ""}`}
                      onClick={() => setSelectedNodeType(nt)}
                    >
                      <Icon
                        className="h-3 w-3"
                        style={{ color: def.color }}
                      />
                      {def.label}
                    </Button>
                  );
                })}
              </>
            )}
          </div>

          {/* Kingdom structure tool */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card/60 p-1">
            <Button
              size="sm"
              variant={tool === "place-structure" ? "default" : "ghost"}
              className={`h-8 gap-1.5 text-xs ${tool !== "place-structure" ? "bg-transparent" : ""}`}
              onClick={() => switchTool("place-structure")}
              title="Place kingdom structure"
            >
              <Box className="h-3.5 w-3.5" />
              Structure
            </Button>
            {tool === "place-structure" && (
              <>
                <div className="h-5 w-px bg-border mx-0.5" />
                <select
                  className="h-7 rounded-md border border-border bg-card text-xs px-2 text-foreground"
                  value={selectedStructureType}
                  onChange={(e) =>
                    setSelectedStructureType(
                      e.target.value as KingdomStructureType
                    )
                  }
                >
                  {KINGDOM_STRUCTURE_TYPES.map((st) => (
                    <option key={st} value={st}>
                      {KINGDOM_STRUCTURE_DEFS[st].label}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>

        {/* Toolbar Row 2: terrain, borders, zoom, actions */}
        <div className="flex items-center gap-2 flex-wrap mb-2">
          {/* Terrain tools */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card/60 p-1">
            <Button
              size="sm"
              variant={tool === "draw-terrain" ? "default" : "ghost"}
              className={`h-8 gap-1.5 text-xs ${tool !== "draw-terrain" ? "bg-transparent" : ""}`}
              onClick={() => switchTool("draw-terrain")}
              title="Draw blocked terrain polygon"
            >
              <PenTool className="h-3.5 w-3.5" />
              Terrain
            </Button>
            <Button
              size="sm"
              variant={tool === "edit-terrain" ? "default" : "ghost"}
              className={`h-8 gap-1.5 text-xs ${tool !== "edit-terrain" ? "bg-transparent" : ""}`}
              onClick={() => switchTool("edit-terrain")}
              title="Edit terrain vertices"
              disabled={terrainPolygons.length === 0}
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit
            </Button>
            {isDrawingTerrain && (
              <>
                <div className="h-5 w-px bg-border mx-0.5" />
                <Button
                  size="sm"
                  variant="default"
                  className="h-8 gap-1.5 text-xs bg-red-600 hover:bg-red-700 text-white"
                  onClick={finishDrawing}
                  disabled={drawingPoints.length < 3}
                  title="Close polygon (or press Enter)"
                >
                  <Check className="h-3.5 w-3.5" />
                  Finish
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1.5 text-xs bg-transparent"
                  onClick={cancelDrawing}
                  title="Cancel drawing (Esc)"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
                <span className="text-xs text-muted-foreground ml-1">
                  {drawingPoints.length} pts
                </span>
              </>
            )}
          </div>

          {/* Border tools */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card/60 p-1">
            <Button
              size="sm"
              variant={tool === "draw-border" ? "default" : "ghost"}
              className={`h-8 gap-1.5 text-xs ${tool !== "draw-border" ? "bg-transparent" : ""}`}
              onClick={() => switchTool("draw-border")}
              title="Draw zone border"
            >
              <Pentagon className="h-3.5 w-3.5" />
              Border
            </Button>
            <Button
              size="sm"
              variant={tool === "edit-border" ? "default" : "ghost"}
              className={`h-8 gap-1.5 text-xs ${tool !== "edit-border" ? "bg-transparent" : ""}`}
              onClick={() => switchTool("edit-border")}
              title="Edit border vertices"
              disabled={zoneBorders.length === 0}
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit
            </Button>
            {isDrawingBorder && (
              <>
                <div className="h-5 w-px bg-border mx-0.5" />
                <Button
                  size="sm"
                  variant="default"
                  className="h-8 gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => finishBorderDrawing(true)}
                  disabled={borderDrawingPoints.length < 3}
                  title="Close polygon"
                >
                  <Check className="h-3.5 w-3.5" />
                  Close
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  className="h-8 gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => finishBorderDrawing(false)}
                  disabled={borderDrawingPoints.length < 2}
                  title="Finish as open line (Enter)"
                >
                  Done
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1.5 text-xs bg-transparent"
                  onClick={cancelBorderDrawing}
                  title="Cancel drawing (Esc)"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
                <span className="text-xs text-muted-foreground ml-1">
                  {borderDrawingPoints.length} pts
                </span>
              </>
            )}
          </div>

          <div className="h-6 w-px bg-border" />

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 bg-transparent"
              onClick={zoomIn}
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <span className="w-14 text-center text-xs text-muted-foreground font-mono">
              {(camera.zoom * 100).toFixed(0)}%
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 bg-transparent"
              onClick={zoomOut}
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs bg-transparent"
            onClick={resetView}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>

          <div className="h-6 w-px bg-border" />

          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive bg-transparent"
            onClick={deleteSelected}
            disabled={!selectedId && !selectedNodeId && !selectedStructureId}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive bg-transparent"
            onClick={clearAll}
            disabled={!hasAnyData}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear All
          </Button>

          <div className="h-6 w-px bg-border" />

          <Button
            size="sm"
            variant="outline"
            className={`h-8 gap-1.5 text-xs bg-transparent transition-colors ${saveFlash ? "border-emerald-500 text-emerald-400" : ""}`}
            onClick={() => {
              try {
                const data = JSON.stringify({
                  items,
                  terrainPolygons,
                  resourceNodes,
                  structures,
                  markers,
                  zoneBorders,
                });
                localStorage.setItem(STORAGE_KEY, data);
                triggerSaveFlash();
              } catch {}
            }}
            disabled={!hasAnyData}
            title="Save layout to browser storage"
          >
            <Save className="h-3.5 w-3.5" />
            {saveFlash ? "Saved" : "Save"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs bg-transparent"
            onClick={exportLayout}
            disabled={!hasAnyData}
            title="Export layout as JSON file"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs bg-transparent"
            onClick={importLayout}
            title="Import layout from JSON file"
          >
            <Upload className="h-3.5 w-3.5" />
            Import
          </Button>

          <div className="h-6 w-px bg-border" />

          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs bg-transparent"
            onClick={() => setIsFullscreen((f) => !f)}
            title={isFullscreen ? "Exit fullscreen (ESC)" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
            {isFullscreen ? "Exit" : "Fullscreen"}
          </Button>
        </div>

        {/* Toolbar Row 3: coordinate search + coordinate placement + hover coords */}
        <div className="flex items-center gap-3 flex-wrap mb-3">
          {/* Go To */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card/60 p-1">
            <span className="text-xs text-muted-foreground px-1">Go to:</span>
            <Input
              className="h-7 w-16 text-xs font-mono bg-card border-border"
              placeholder="X"
              value={goToX}
              onChange={(e) => setGoToX(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleGoTo();
              }}
            />
            <Input
              className="h-7 w-16 text-xs font-mono bg-card border-border"
              placeholder="Y"
              value={goToY}
              onChange={(e) => setGoToY(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleGoTo();
              }}
            />
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 text-xs bg-transparent"
              onClick={handleGoTo}
            >
              <Search className="h-3 w-3" />
              Go
            </Button>
          </div>

          {/* Coordinate placement */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card/60 p-1">
            <span className="text-xs text-muted-foreground px-1">Place at:</span>
            <Input
              className="h-7 w-16 text-xs font-mono bg-card border-border"
              placeholder="X"
              value={coordPlaceX}
              onChange={(e) => setCoordPlaceX(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCoordPlace();
              }}
            />
            <Input
              className="h-7 w-16 text-xs font-mono bg-card border-border"
              placeholder="Y"
              value={coordPlaceY}
              onChange={(e) => setCoordPlaceY(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCoordPlace();
              }}
            />
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 text-xs bg-transparent"
              onClick={handleCoordPlace}
            >
              <MapPin className="h-3 w-3" />
              Place
            </Button>
          </div>

          {/* Hover coords */}
          <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <Crosshair className="h-3.5 w-3.5" />
            {hoverTile
              ? `X: ${displayX(hoverTile.x)}, Y: ${displayY(hoverTile.y)}`
              : "--- , ---"}
{snappedHover && isPlaceTool(tool) && (
  <span className="text-primary/70 ml-1">
    Snap: {displayX(snappedHover.x)}, {displayY(snappedHover.y)}
  </span>
)}
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={containerRef}
          className={`relative w-full rounded-xl border border-border overflow-hidden ${isFullscreen ? "flex-1" : ""}`}
style={{
  backgroundColor: "hsl(100, 38%, 35%)",
  ...(isFullscreen ? { minHeight: 0 } : { height: "calc(100vh - 310px)", minHeight: 400 }),
}}

        >
          <canvas
            ref={canvasRef}
            className="block w-full h-full"
            style={{ cursor: cursorStyle }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              handleMouseUp();
              setHoverTile(null);
              setWorldMouse(null);
            }}
            onContextMenu={handleContextMenu}
          />

          {/* Autosave indicator */}
          {hasAnyData && (
            <div className="absolute top-3 right-3 pointer-events-none">
              <div
                className={`rounded-md px-2.5 py-1 text-[10px] font-mono transition-all duration-300 ${
                  saveFlash
                    ? "bg-emerald-950/80 border border-emerald-500/40 text-emerald-300"
                    : "bg-card/60 border border-border/50 text-muted-foreground/60"
                }`}
              >
                {saveFlash ? "Saved" : "Autosave on"}
              </div>
            </div>
          )}

          {/* Usage hint overlay */}
          {!hasAnyData && !isDrawingTerrain && !isDrawingBorder && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm px-6 py-4 text-center max-w-xs">
                <Flag className="h-8 w-8 text-primary mx-auto mb-2 opacity-60" />
                <p className="text-sm font-medium text-foreground">
                  Click to place your first structure
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Use tools above to place flags, fortresses, resource nodes,
                  structures, draw terrain, or zone borders.
                </p>
              </div>
            </div>
          )}

          {/* Drawing mode banner */}
          {isDrawingTerrain && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none">
              <div className="rounded-lg border border-red-500/30 bg-red-950/80 backdrop-blur-sm px-4 py-2 text-center">
                <p className="text-xs font-medium text-red-300">
                  Drawing terrain polygon - click to add points, click first
                  point or press Enter to close
                </p>
              </div>
            </div>
          )}

          {/* Edit terrain banner */}
          {tool === "edit-terrain" && editingTerrainId && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none">
              <div className="rounded-lg border border-amber-500/30 bg-amber-950/80 backdrop-blur-sm px-4 py-2 text-center">
                <p className="text-xs font-medium text-amber-300">
                  Editing terrain - drag vertices, click edges to add points,
                  Del to remove vertex
                </p>
              </div>
            </div>
          )}

          {/* Drawing border banner */}
          {isDrawingBorder && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none">
              <div className="rounded-lg border border-blue-500/30 bg-blue-950/80 backdrop-blur-sm px-4 py-2 text-center">
                <p className="text-xs font-medium text-blue-300">
                  Drawing zone border - click to add points, click first point
                  to close polygon, Enter to finish open line
                </p>
              </div>
            </div>
          )}

          {/* Edit border banner */}
          {tool === "edit-border" && editingBorderId && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none">
              <div className="rounded-lg border border-blue-500/30 bg-blue-950/80 backdrop-blur-sm px-4 py-2 text-center">
                <p className="text-xs font-medium text-blue-300">
                  Editing border - drag vertices, click edges to add points, Del
                  to remove vertex
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* INFO PANEL */}
      <div className={`w-full lg:w-[300px] flex-shrink-0 space-y-4 ${isFullscreen ? "hidden" : ""}`}>
        {/* Overview card */}
        <Card className="border-border bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Flag className="h-4 w-4 text-primary" />
              Territory Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {PLACEABLE_KINDS.map((kind) => {
              const def = STRUCTURE_DEFS[kind];
              const count = stats.counts[kind];
              return (
                <div key={kind} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ backgroundColor: def.color }}
                    />
                    {def.label}
                  </span>
                  <span className="text-sm font-bold text-foreground font-mono">
                    {count}
                  </span>
                </div>
              );
            })}
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Unique Tiles
              </span>
              <span className="text-sm font-bold text-foreground font-mono">
                {formatNumber(stats.uniqueTiles)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Coverage Area
              </span>
              <span className="text-sm font-bold text-foreground font-mono">
                {stats.total > 0
                  ? `${((stats.uniqueTiles / (MAP_SIZE * MAP_SIZE)) * 100).toFixed(3)}%`
                  : "0%"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Snap Step</span>
              <span className="text-sm font-bold text-foreground font-mono">
                {SNAP_STEP} tiles
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Resource Nodes card */}
        <Card className="border-border bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Gem className="h-4 w-4 text-yellow-400" />
              Resource Nodes ({resourceNodes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resourceNodes.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No resource nodes placed. Use the Node tool to add alliance
                resource nodes.
              </p>
            ) : (
              <div className="max-h-[160px] overflow-y-auto -mx-1 px-1 space-y-1">
                {resourceNodes.map((n, i) => {
                  const def = RESOURCE_NODE_DEFS[n.type];
                  const Icon = RESOURCE_NODE_ICONS[n.type];
                  return (
                    <div
                      key={n.id}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors cursor-pointer ${
                        n.id === selectedNodeId
                          ? "bg-primary/15 text-foreground"
                          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                      }`}
                      onClick={() => {
                        clearAllSelections();
                        setSelectedNodeId(n.id);
                        switchTool("select");
                        setCamera((c) => ({ ...c, x: n.x, y: n.y }));
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Icon
                          className="h-3 w-3"
                          style={{ color: def.color }}
                        />
                        <span className="font-mono">
                          {def.label} {i + 1}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono opacity-70">
                          ({displayX(Math.round(n.x))}, {displayY(Math.round(n.y))})
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setResourceNodes((prev) =>
                              prev.filter((rn) => rn.id !== n.id)
                            );
                            if (selectedNodeId === n.id)
                              setSelectedNodeId(null);
                          }}
                          className="p-0.5 rounded hover:bg-destructive/20 transition-colors"
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Kingdom Structures card */}
        <Card className="border-border bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Box className="h-4 w-4 text-fuchsia-400" />
              Kingdom Structures ({structures.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {structures.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No kingdom structures placed. Use the Structure tool to add
                Sanctum, Altar, Shrine, etc.
              </p>
            ) : (
              <div className="max-h-[160px] overflow-y-auto -mx-1 px-1 space-y-1">
                {structures.map((s, i) => {
                  const def = KINGDOM_STRUCTURE_DEFS[s.type];
                  return (
                    <div
                      key={s.id}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors cursor-pointer ${
                        s.id === selectedStructureId
                          ? "bg-primary/15 text-foreground"
                          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                      }`}
                      onClick={() => {
                        clearAllSelections();
                        setSelectedStructureId(s.id);
                        switchTool("select");
                        setCamera((c) => ({ ...c, x: s.x, y: s.y }));
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ backgroundColor: def.color }}
                        />
                        <span className="font-mono">
                          {def.label} {i + 1}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono opacity-70">
                          ({Math.round(s.x)}, {displayY(Math.round(s.y))})
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStructures((prev) =>
                              prev.filter((st) => st.id !== s.id)
                            );
                            if (selectedStructureId === s.id)
                              setSelectedStructureId(null);
                          }}
                          className="p-0.5 rounded hover:bg-destructive/20 transition-colors"
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Terrain polygons card */}
        <Card className="border-border bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Mountain className="h-4 w-4 text-red-400" />
              Terrain Zones ({terrainPolygons.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {terrainPolygons.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No terrain zones drawn. Use Draw Terrain to mark blocked areas.
              </p>
            ) : (
              <div className="max-h-[140px] overflow-y-auto -mx-1 px-1 space-y-1">
                {terrainPolygons.map((tp, i) => (
                  <div
                    key={tp.id}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors cursor-pointer ${
                      editingTerrainId === tp.id
                        ? "bg-red-500/15 text-foreground"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    }`}
                    onClick={() => {
                      switchTool("edit-terrain");
                      setEditingTerrainId(tp.id);
                      setEditingVertexIdx(null);
                      let cx = 0,
                        cy = 0;
                      for (const pt of tp.points) {
                        cx += pt.x;
                        cy += pt.y;
                      }
                      cx /= tp.points.length;
                      cy /= tp.points.length;
                      setCamera((c) => ({ ...c, x: cx, y: cy }));
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ backgroundColor: "#ef4444" }}
                      />
                      <span className="font-mono">Zone {i + 1}</span>
                      <span className="text-muted-foreground/60">
                        ({tp.points.length} vertices)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTerrainPolygons((prev) =>
                          prev.filter((t) => t.id !== tp.id)
                        );
                        if (editingTerrainId === tp.id) {
                          setEditingTerrainId(null);
                          setEditingVertexIdx(null);
                        }
                      }}
                      className="p-0.5 rounded hover:bg-destructive/20 transition-colors"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Zone Borders card */}
        <Card className="border-border bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Pentagon className="h-4 w-4 text-blue-400" />
              Zone Borders ({zoneBorders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {zoneBorders.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No zone borders drawn. Use Draw Border to create territory
                walls.
              </p>
            ) : (
              <div className="max-h-[140px] overflow-y-auto -mx-1 px-1 space-y-1">
                {zoneBorders.map((zb, i) => (
                  <div
                    key={zb.id}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors cursor-pointer ${
                      editingBorderId === zb.id
                        ? "bg-blue-500/15 text-foreground"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    }`}
                    onClick={() => {
                      switchTool("edit-border");
                      setEditingBorderId(zb.id);
                      setEditingBorderVertexIdx(null);
                      let cx = 0,
                        cy = 0;
                      for (const pt of zb.points) {
                        cx += pt.x;
                        cy += pt.y;
                      }
                      cx /= zb.points.length;
                      cy /= zb.points.length;
                      setCamera((c) => ({ ...c, x: cx, y: cy }));
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ backgroundColor: "#60a5fa" }}
                      />
                      <span className="font-mono">
                        Border {i + 1} {zb.closed ? "(closed)" : "(open)"}
                      </span>
                      <span className="text-muted-foreground/60">
                        ({zb.points.length} pts)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setZoneBorders((prev) =>
                          prev.filter((b) => b.id !== zb.id)
                        );
                        if (editingBorderId === zb.id) {
                          setEditingBorderId(null);
                          setEditingBorderVertexIdx(null);
                        }
                      }}
                      className="p-0.5 rounded hover:bg-destructive/20 transition-colors"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Markers card */}
        {markers.length > 0 && (
          <Card className="border-border bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-yellow-400" />
                Markers ({markers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[120px] overflow-y-auto -mx-1 px-1 space-y-1">
                {markers.map((m, i) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-secondary/50 hover:text-foreground cursor-pointer transition-colors"
                    onClick={() => {
                      setCamera((c) => ({ ...c, x: m.x, y: m.y }));
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ backgroundColor: "#fbbf24" }}
                      />
                      <span className="font-mono">
                        Marker {i + 1} ({m.x}, {displayY(m.y)})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMarkers((prev) =>
                          prev.filter((mk) => mk.id !== m.id)
                        );
                      }}
                      className="p-0.5 rounded hover:bg-destructive/20 transition-colors"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="w-full mt-2 h-7 text-xs text-destructive hover:text-destructive bg-transparent"
                onClick={() => setMarkers([])}
              >
                Clear All Markers
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Structure sizes reference */}
        <Card className="border-border bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground">
                Structure Sizes
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 px-2 text-[10px] font-mono bg-transparent ${structureDebugMode ? "text-yellow-400" : "text-muted-foreground"}`}
                onClick={() => setStructureDebugMode((v) => !v)}
                title="Toggle structure debug overlay (shows BL/TR coords and footprint)"
              >
                {structureDebugMode ? "DEBUG ON" : "DEBUG OFF"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {PLACEABLE_KINDS.map((kind) => {
              const def = STRUCTURE_DEFS[kind];
              const size = def.half * 2 + 1;
              return (
                <div
                  key={kind}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ backgroundColor: def.color }}
                    />
                    {def.shortLabel}
                  </span>
                  <span className="font-mono text-foreground">
                    {size} x {size} tiles
                  </span>
                </div>
              );
            })}
            <div className="pt-2 border-t border-border space-y-2">
              {KINGDOM_STRUCTURE_TYPES.map((st) => {
                const def = KINGDOM_STRUCTURE_DEFS[st];
                const size = def.half * 2 - 1; // 15 for half=8
                return (
                  <div
                    key={st}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ backgroundColor: def.color }}
                      />
                      {def.shortLabel}
                    </span>
                    <span className="font-mono text-foreground">
                      {size} x {size} tiles
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Placed items list */}
        <Card className="border-border bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">
              Placed Flags/Fortresses ({items.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No flags or fortresses placed yet
              </p>
            ) : (
              <div className="max-h-[200px] overflow-y-auto -mx-1 px-1 space-y-1">
                {items.map((p, i) => {
                  const def = STRUCTURE_DEFS[p.kind];
                  const Icon = KIND_ICONS[p.kind];
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors cursor-pointer ${
                        p.id === selectedId
                          ? "bg-primary/15 text-foreground"
                          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                      }`}
                      onClick={() => {
                        clearAllSelections();
                        setSelectedId(p.id);
                        switchTool("select");
                        setCamera((c) => ({ ...c, x: p.x, y: p.y }));
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Icon
                          className="h-3 w-3"
                          style={{ color: def.color }}
                        />
                        <span className="font-mono">
                          {def.shortLabel} {i + 1}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono opacity-70">
                          ({p.x}, {displayY(p.y)})
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setItems((prev) =>
                              prev.filter((it) => it.id !== p.id)
                            );
                            if (selectedId === p.id) setSelectedId(null);
                          }}
                          className="p-0.5 rounded hover:bg-destructive/20 transition-colors"
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Controls help */}
        <Card className="border-border bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Place structure</span>
              <span className="font-mono text-foreground">Left Click</span>
            </div>
            <div className="flex justify-between">
              <span>Delete any object</span>
              <span className="font-mono text-foreground">Right Click</span>
            </div>
            <div className="flex justify-between">
              <span>Pan map</span>
              <span className="font-mono text-foreground">Alt + Drag</span>
            </div>
            <div className="flex justify-between">
              <span>Zoom</span>
              <span className="font-mono text-foreground">Scroll Wheel</span>
            </div>
            <div className="flex justify-between">
              <span>Drag object</span>
              <span className="font-mono text-foreground">Select + Drag</span>
            </div>
            <div className="pt-2 mt-2 border-t border-border space-y-2">
              <p className="font-semibold text-red-400">Terrain Editing</p>
              <div className="flex justify-between">
                <span>Close polygon</span>
                <span className="font-mono text-foreground">
                  Click 1st / Enter
                </span>
              </div>
              <div className="flex justify-between">
                <span>Undo last point</span>
                <span className="font-mono text-foreground">Right Click</span>
              </div>
              <div className="flex justify-between">
                <span>Delete vertex</span>
                <span className="font-mono text-foreground">Del / Bksp</span>
              </div>
            </div>
            <div className="pt-2 mt-2 border-t border-border space-y-2">
              <p className="font-semibold text-blue-400">Zone Borders</p>
              <div className="flex justify-between">
                <span>Close polygon</span>
                <span className="font-mono text-foreground">Click 1st</span>
              </div>
              <div className="flex justify-between">
                <span>Finish open line</span>
                <span className="font-mono text-foreground">Enter / Done</span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-border">
              <p className="text-muted-foreground/70 leading-relaxed">
                Resource nodes and kingdom structures use free placement (no
                snap). Flags/fortresses snap to grid (step {SNAP_STEP}).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
