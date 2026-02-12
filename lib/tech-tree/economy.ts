import type { TechNode } from '@/lib/tech-tree/types'

/**
 * GRID TUNING (RoK-style tight layout)
 */
const COL = 450
const ROW = 120
const START_X = 100

export const economyTree: TechNode[] = [
  // ===== COLUMN 0 =====
  {
    id: 'quarrying',
    name: 'Quarrying',
    level: 0,
    maxLevel: 1,
    icon: '/tech/quarrying.png',
    x: START_X + 0 * COL,
    y: 2 * ROW,
    parents: [],
  },

  // ===== COLUMN 1 =====
  {
    id: 'irrigation',
    name: 'Irrigation',
    level: 0,
    maxLevel: 5,
    icon: '/tech/irrigation.png',
    x: START_X + 1 * COL,
    y: 1 * ROW,
    parents: ['quarrying'],
  },
  {
    id: 'handsaw',
    name: 'Handsaw',
    level: 0,
    maxLevel: 5,
    icon: '/tech/handsaw.png',
    x: START_X + 1 * COL,
    y: 3 * ROW,
    parents: ['quarrying'],
  },

  // ===== COLUMN 2 =====
  {
    id: 'sickle',
    name: 'Sickle',
    level: 0,
    maxLevel: 5,
    icon: '/tech/sickle.png',
    x: START_X + 2 * COL,
    y: 0 * ROW,
    parents: ['irrigation'],
  },
  {
    id: 'masonry',
    name: 'Masonry',
    level: 0,
    maxLevel: 5,
    icon: '/tech/masonry.png',
    x: START_X + 2 * COL,
    y: 2 * ROW,
    parents: ['irrigation', 'handsaw'],
  },
  {
    id: 'handaxe',
    name: 'Handaxe',
    level: 0,
    maxLevel: 5,
    icon: '/tech/handaxe.png',
    x: START_X + 2 * COL,
    y: 4 * ROW,
    parents: ['handsaw'],
  },

  // ===== COLUMN 3 =====
  {
    id: 'metallurgy',
    name: 'Metallurgy',
    level: 0,
    maxLevel: 1,
    icon: '/tech/metallurgy.png',
    x: START_X + 3 * COL,
    y: 2 * ROW,
    parents: ['masonry'],
  },

  // ===== COLUMN 4 =====
  {
    id: 'chisel',
    name: 'Chisel',
    level: 0,
    maxLevel: 5,
    icon: '/tech/chisel.png',
    x: START_X + 4 * COL,
    y: 0 * ROW,
    parents: ['metallurgy'],
  },
  {
    id: 'writing',
    name: 'Writing',
    level: 0,
    maxLevel: 5,
    icon: '/tech/writing.png',
    x: START_X + 4 * COL,
    y: 2 * ROW,
    parents: ['metallurgy'],
  },
  {
    id: 'metalworking',
    name: 'Metalworking',
    level: 0,
    maxLevel: 5,
    icon: '/tech/metalworking.png',
    x: START_X + 4 * COL,
    y: 4 * ROW,
    parents: ['metallurgy'],
  },

  // ===== COLUMN 5 =====
  {
    id: 'handcart',
    name: 'Handcart',
    level: 0,
    maxLevel: 5,
    icon: '/tech/handcart.png',
    x: START_X + 5 * COL,
    y: 0 * ROW,
    parents: ['chisel'],
  },
  {
    id: 'multilayer',
    name: 'Multilayer Structure',
    level: 0,
    maxLevel: 5,
    icon: '/tech/multilayer.png',
    x: START_X + 5 * COL,
    y: 2 * ROW,
    parents: ['writing'],
  },
  {
    id: 'placer',
    name: 'Placer Mining',
    level: 0,
    maxLevel: 5,
    icon: '/tech/placer.png',
    x: START_X + 5 * COL,
    y: 4 * ROW,
    parents: ['metalworking'],
  },

  // ===== COLUMN 6+7 =====
  {
    id: 'wheel',
    name: 'Wheel',
    level: 0,
    maxLevel: 5,
    icon: '/tech/wheel.png',
    x: START_X + 6 * COL,
    y: 0.5 * ROW,
    parents: ['handcart'],
  },
  {
    id: 'jewelry',
    name: 'Jewelry',
    level: 0,
    maxLevel: 1,
    icon: '/tech/jewelry.png',
    x: START_X + 7 * COL,
    y: 2 * ROW,
    parents: ['multilayer'],
  },

  // ===== COLUMN 8 =====
  {
    id: 'plow',
    name: 'Plow',
    level: 0,
    maxLevel: 10,
    icon: '/tech/plow.png',
    x: START_X + 8 * COL,
    y: 1 * ROW,
    parents: ['jewelry'],
  },
  {
    id: 'sawmill',
    name: 'Sawmill',
    level: 0,
    maxLevel: 10,
    icon: '/tech/sawmill.png',
    x: START_X + 8 * COL,
    y: 3 * ROW,
    parents: ['jewelry'],
  },

  // ===== COLUMN 9 =====
  {
    id: 'scythe',
    name: 'Scythe',
    level: 0,
    maxLevel: 10,
    icon: '/tech/scythe.png',
    x: START_X + 9 * COL,
    y: 0 * ROW,
    parents: ['plow'],
  },
  {
    id: 'engineering',
    name: 'Engineering',
    level: 0,
    maxLevel: 10,
    icon: '/tech/engineering.png',
    x: START_X + 9 * COL,
    y: 2 * ROW,
    parents: ['plow', 'sawmill'],
  },
  {
    id: 'whipsaw',
    name: 'Whipsaw',
    level: 0,
    maxLevel: 10,
    icon: '/tech/whipsaw.png',
    x: START_X + 9 * COL,
    y: 4 * ROW,
    parents: ['sawmill'],
  },

  // ===== COLUMN 10 =====
  {
    id: 'mathematics',
    name: 'Mathematics',
    level: 0,
    maxLevel: 10,
    icon: '/tech/mathematics.png',
    x: START_X + 10 * COL,
    y: 2 * ROW,
    parents: ['engineering'],
  },

  // ===== COLUMN 11 =====
  {
    id: 'openpit',
    name: 'Open-pit Quarry',
    level: 0,
    maxLevel: 10,
    icon: '/tech/openpit.png',
    x: START_X + 11 * COL,
    y: 0 * ROW,
    parents: ['mathematics'],
  },
  {
    id: 'coinage',
    name: 'Coinage',
    level: 0,
    maxLevel: 10,
    icon: '/tech/coinage.png',
    x: START_X + 11 * COL,
    y: 4 * ROW,
    parents: ['mathematics'],
  },

  // ===== COLUMN 12 =====
  {
    id: 'stonesaw',
    name: 'Stone Saw',
    level: 0,
    maxLevel: 10,
    icon: '/tech/stonesaw.png',
    x: START_X + 12 * COL,
    y: 0 * ROW,
    parents: ['openpit'],
  },
  {
    id: 'shaftmining',
    name: 'Shaft Mining',
    level: 0,
    maxLevel: 10,
    icon: '/tech/shaftmining.png',
    x: START_X + 12 * COL,
    y: 4 * ROW,
    parents: ['coinage'],
  },

  // ===== COLUMN 13 =====
  {
    id: 'machinery',
    name: 'Machinery',
    level: 0,
    maxLevel: 10,
    icon: '/tech/machinery.png',
    x: START_X + 13 * COL,
    y: 2 * ROW,
    parents: ['mathematics'],
  },

  // ===== COLUMN 14+15 =====
  {
    id: 'carriage',
    name: 'Carriage',
    level: 0,
    maxLevel: 10,
    icon: '/tech/carriage.png',
    x: START_X + 14 * COL,
    y: 0.5 * ROW,
    parents: ['machinery'],
  },
  {
    id: 'cuttingpolishing',
    name: 'Cutting & Polishing',
    level: 0,
    maxLevel: 10,
    icon: '/tech/cuttingpolishing.png',
    x: START_X + 15 * COL,
    y: 2 * ROW,
    parents: ['machinery'],
  },
]
