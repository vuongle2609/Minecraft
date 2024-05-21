export const FLAT_WORLD_TYPE = 1;
export const NORMAL_WORLD_TYPE = 0;

export const WORLD_TYPE_MAPPING = {
  [FLAT_WORLD_TYPE]: "Superflat",
  [NORMAL_WORLD_TYPE]: "Default",
};

export const DEFAULT_WORLD_TYPE = NORMAL_WORLD_TYPE;

export const DEFAULT_WORLD_NAME = "New World";

export const BLOCK_WIDTH = 2;

export const DEFAULT_CHUNK_VIEW = 4;

// size of chunk in x and z (CHUNK_SIZE * CHUNK_SIZE)
// when change world data in localstorage must be clear due to different chunksize store data
export const CHUNK_SIZE = 16;

export const TIME_TO_INTERACT = 3000;

export const NORMAL_WORLD_HEIGHT = 10;
export const FLAT_WORLD_HEIGHT = 3;
