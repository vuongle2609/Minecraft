import { CHUNK_SIZE } from "../../constants";
import blocks from "../../constants/blocks";
import { nameFromCoordinate } from "../helpers/nameFromCoordinate";

export const getBlocksInChunk = (x: number, z: number) => {
  const blocksInChunk: Record<
    string,
    {
      position: number[];
      type: keyof typeof blocks;
    }
  > = {};

  for (let xA = x * CHUNK_SIZE; xA < (x + 1) * CHUNK_SIZE; xA++) {
    for (let zA = z * CHUNK_SIZE; zA < (z + 1) * CHUNK_SIZE; zA++) {
      const position = [xA * 2, 0, zA * 2];

      const chunkName = nameFromCoordinate(
        position[0],
        position[2],
        position[2]
      );

      blocksInChunk[chunkName] = {
        position,
        type: "grass",
      };
    }
  }

  return blocksInChunk;
};
