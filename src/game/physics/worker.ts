import { Vector3 } from "three";
import { BLOCK_WIDTH, CHUNK_SIZE, TIME_TO_INTERACT } from "../../constants";
import {
  CHARACTER_LENGTH,
  GRAVITY,
  GRAVITY_SCALE,
  JUMP_FORCE,
  SPEED,
} from "../../constants/player";
import { nameFromCoordinate } from "../helpers/nameFromCoordinate";
import Physics from "./physics";
import { BlockKeys } from "../../constants/blocks";

let blocksMapping: Record<string, string | 0> = {};

let originalVy = -25;
let vy = originalVy;
let onGround = true;

const physicsEngine = new Physics();

const calculateMovement = ({
  directionVectorArr,
  forwardVectorArr,
  position,
  delta,
}: {
  forwardVectorArr: number[];
  directionVectorArr: number[];
  position: number[];
  delta: number;
}) => {
  const forwardVector = new Vector3(
    forwardVectorArr[0],
    forwardVectorArr[1],
    forwardVectorArr[2]
  );

  const directionVector = new Vector3(
    directionVectorArr[0],
    directionVectorArr[1],
    directionVectorArr[2]
  );

  const playerPostion = new Vector3(position[0], position[1], position[2]);

  forwardVector.y = 0;
  forwardVector.normalize();

  const vectorUp = new Vector3(0, 1, 0);

  const vectorRight = vectorUp.clone().crossVectors(vectorUp, forwardVector);

  const moveVector = new Vector3().addVectors(
    forwardVector.clone().multiplyScalar(directionVector.z),
    vectorRight.multiplyScalar(directionVector.x)
  );

  moveVector.normalize().multiplyScalar(delta * SPEED);
  //https://www.cgtrader.com/free-3d-models/character/man/minecraft-steve-low-poly-rigged

  if (vy > originalVy) {
    vy -= GRAVITY * GRAVITY_SCALE * delta;
  }

  const { calculatedMoveVector: correctMovement, collideObject } =
    physicsEngine.calculateCorrectMovement(
      new Vector3(moveVector.x, moveVector.y + vy * delta, moveVector.z),
      playerPostion,
      blocksMapping,
      onGround
    );

  if (collideObject) {
    onGround = true;
  }

  self.postMessage({
    type: "updatePosition",
    data: {
      position: [correctMovement.x, correctMovement.y, correctMovement.z],
      onGround,
      collideObject,
    },
  });
};

const jumpCharacter = () => {
  if (onGround) {
    vy = JUMP_FORCE;
    onGround = false;
  }
};

let initFunc: undefined | Function = () =>
  setTimeout(() => {
    eventMapping = { ...eventMapping, calculateMovement };
  }, TIME_TO_INTERACT);

const initPhysics = () => {
  initFunc?.();
  initFunc = undefined;
};

const addBlock = ({ position, type }: { position: number[]; type: string }) => {
  blocksMapping = {
    ...blocksMapping,
    [nameFromCoordinate(position[0], position[1], position[2])]: type,
  };
};

let playerInitPos = [CHUNK_SIZE / 2, CHARACTER_LENGTH + 0.5, CHUNK_SIZE / 2];
let shouldReturnPosY = false;

const getPlayerShouldSpawn = (blocks: Record<string, any>) => {
  const pos = [...playerInitPos];

  let shouldStop = false;
  let countY = 0;

  while (!shouldStop) {
    if (blocks[nameFromCoordinate(pos[0], countY, pos[2])]) {
      countY += BLOCK_WIDTH;
    } else {
      shouldStop = true;
    }
  }
  shouldReturnPosY = false;
  return [pos[0], countY + 1, pos[2]];
};

const requestPosY = () => {
  shouldReturnPosY = true;
};

const bulkAddBlock = ({ blocks }: { blocks: Record<string, string | 0> }) => {
  initPhysics();
  blocksMapping = {
    ...blocksMapping,
    ...blocks,
  };

  if (shouldReturnPosY) {
    self.postMessage({
      type: "changePosition",
      data: {
        position: getPlayerShouldSpawn(blocksMapping),
      },
    });
  }
};

const removeBlock = ({ position }: { position: number[] }) => {
  delete blocksMapping[
    nameFromCoordinate(position[0], position[1], position[2])
  ];
};

let eventMapping: Record<string, Function> = {
  addBlock,
  removeBlock,
  jumpCharacter,
  bulkAddBlock,
  requestPosY,
};

self.onmessage = (
  e: MessageEvent<{
    type: keyof typeof eventMapping;
    data: any;
  }>
) => {
  eventMapping[e.data.type]?.(e.data.data);
};
