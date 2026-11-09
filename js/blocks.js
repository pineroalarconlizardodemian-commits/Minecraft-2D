// Definición de bloques
const BLOCKS = {
    AIR:    0,
    GRASS:  1,
    DIRT:   2,
    STONE:  3,
    WOOD:   4,
    LEAVES: 5,
    SAND:   6,
    WATER:  7,
    COAL:   8,
    IRON:   9
};

const BLOCK_DATA = {
    [BLOCKS.AIR]:    { name: 'Aire',    color: null,      solid: false },
    [BLOCKS.GRASS]:  { name: 'Césped',  color: '#3fa34d', solid: true  },
    [BLOCKS.DIRT]:   { name: 'Tierra',  color: '#8b5a2b', solid: true  },
    [BLOCKS.STONE]:  { name: 'Piedra',  color: '#7a7a7a', solid: true  },
    [BLOCKS.WOOD]:   { name: 'Madera',  color: '#6b4423', solid: true  },
    [BLOCKS.LEAVES]: { name: 'Hojas',   color: '#2d6a2d', solid: true  },
    [BLOCKS.SAND]:   { name: 'Arena',   color: '#e0d68a', solid: true  },
    [BLOCKS.WATER]:  { name: 'Agua',    color: '#3a7bd5', solid: false },
    [BLOCKS.COAL]:   { name: 'Carbón',  color: '#2a2a2a', solid: true  },
    [BLOCKS.IRON]:   { name: 'Hierro',  color: '#c9a87c', solid: true  }
};

// Bloques disponibles en el hotbar (la barra de inventario rápido)
const HOTBAR = [BLOCKS.GRASS, BLOCKS.DIRT, BLOCKS.STONE, BLOCKS.WOOD, BLOCKS.SAND, BLOCKS.LEAVES];
