import { CapsuleGeometry, Mesh, MeshStandardMaterial, Vector3 } from "three";

import { CHUNK_SIZE } from "@/constants";
import blocks, { BlockKeys } from "@/constants/blocks";
import {
  CHARACTER_LENGTH,
  CHARACTER_MIDDLE_LENGTH,
  CHARACTER_RADIUS,
  LERP_CAMERA_BREATH,
  SIN_X_MULTIPLY_LENGTH,
  SIN_Y_MULTIPLY_LENGTH,
} from "@/constants/player";
import BasicCharacterControllerInput from "@/game/action/input";
import BaseEntity, { BasePropsType } from "@/game/classes/baseEntity";

import { getChunkCoordinate } from "../helpers/chunkHelpers";
import { lerp } from "three/src/math/MathUtils";

export default class Player extends BaseEntity {
  input = new BasicCharacterControllerInput();

  // render body
  player: Mesh;

  isWalk = false;
  onGround = true;

  // for camera
  tCounter = 0;
  cameraOffset = 0;

  currentStepKey: BlockKeys | undefined = undefined;
  prevStepKey: BlockKeys | undefined = undefined;
  currentStepSound: HTMLAudioElement;

  currentChunk: {
    x: number;
    z: number;
  };
  currentChunkPhysics: {
    x: number;
    z: number;
  };

  constructor(props: BasePropsType) {
    super(props);
    this.initialize();
  }

  initialize() {
    // init player render
    this.player = new Mesh(
      new CapsuleGeometry(CHARACTER_RADIUS, CHARACTER_MIDDLE_LENGTH),
      new MeshStandardMaterial()
    );
    this.player.visible = false;
    this.player.name = "player";

    const roundedPos = this.player.position.clone().round();

    this.currentChunk = getChunkCoordinate(roundedPos.x, roundedPos.z);

    this.scene?.add(this.player);

    this.chunkManager?.handleRequestChunks(this.currentChunk);

    this.worker?.addEventListener("message", (e) => {
      if (e.data.type === "updatePosition") {
        const { position, onGround, collideObject } = e.data.data;

        this.prevStepKey = this.currentStepKey;
        this.currentStepKey = collideObject;

        this.onGround = onGround;

        this.player.position.set(position[0], position[1], position[2]);

        this.handleDetectChunkChange();
      }
    });
  }

  handleDetectChunkChange = () => {
    const roundedPos = this.player.position.clone().round();

    const newCalChunk = getChunkCoordinate(roundedPos.x, roundedPos.z);

    if (
      newCalChunk.x != this.currentChunk.x ||
      newCalChunk.z != this.currentChunk.z
    ) {
      this.currentChunk = newCalChunk;

      this.chunkManager?.handleRequestChunks(this.currentChunk);
    }
  };

  handleMovement(delta: number) {
    this.isWalk = false;

    const { keys } = this.input;

    const directionVector = new Vector3();

    if (keys.left) {
      this.isWalk = true;
      directionVector.x += 1;
    }

    if (keys.right) {
      this.isWalk = true;
      directionVector.x -= 1;
    }

    if (keys.forward) {
      this.isWalk = true;
      directionVector.z += 1;
    }

    if (keys.backward) {
      this.isWalk = true;
      directionVector.z -= 1;
    }

    if (keys.space) {
      this.worker?.postMessage({
        type: "jumpCharacter",
      });
    }

    const forwardVector = new Vector3();

    this.camera?.getWorldDirection(forwardVector);

    this.worker?.postMessage({
      type: "calculateMovement",
      data: {
        directionVectorArr: [
          directionVector.x,
          directionVector.y,
          directionVector.z,
        ],
        forwardVectorArr: [forwardVector.x, forwardVector.y, forwardVector.z],
        position: [
          this.player.position.x,
          this.player.position.y,
          this.player.position.z,
        ],
        delta,
      },
    });
  }

  updateMovementSound() {
    if (this.currentStepSound && this.currentStepSound.paused && this.isWalk) {
      this.currentStepSound.play();
    }

    if ((!this.isWalk || !this.onGround) && this.currentStepSound) {
      this.currentStepSound.pause();
      this.currentStepSound.currentTime = 0;
    }

    if (this.currentStepKey && this.currentStepKey !== this.prevStepKey) {
      if (this.currentStepSound) {
        this.currentStepSound.pause();
        this.currentStepSound.currentTime = 0;
      }
      this.currentStepSound = blocks[this.currentStepKey].step;
    }
  }

  breathingEffect(delta: number) {
    this.tCounter += 1;
    // keo dai duong sin x bang cach chia cho 4
    // cho duong sin y ngan lai bang cach chia tat ca cho 2.5
    // de cho muot thi noi suy no voi offset truoc
    // 1/2.5 * sin(t * 1/4)
    // if (this.onGround && this.isWalk) {
    //   this.cameraOffset =
    //     lerp(
    //       this.cameraOffset,
    //       Math.sin(this.tCounter * SIN_X_MULTIPLY_LENGTH) *
    //         SIN_Y_MULTIPLY_LENGTH,
    //       LERP_CAMERA_BREATH
    //     ) * delta;
    // } else {
    //   this.cameraOffset = 0;
    // }
  }

  updateCamera() {
    const { x, y, z } = this.player.position;

    // for debug

    //constant lerp and diff y

    // this.camera?.lookAt(0, 0, 0);

    // this.camera?.position.set(10, 10, 10);

    this.camera?.position.copy(new Vector3(x, y + 1.4 - this.cameraOffset, z));
  }

  update(delta: number, t: number) {
    this.handleMovement(delta);
    this.breathingEffect(delta);
    this.updateMovementSound();
    this.updateCamera();
  }
}
