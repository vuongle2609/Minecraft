import BasicCharacterControllerInput from "@/action/input";
import BaseEntity, { BasePropsType } from "@/classes/baseEntity";
import { humanMaterial } from "@/classes/gameScene";
import { SPEED } from "@/constants/player";
import dispatchWorkerAction from "@/helpers/dispatchWorkerAction";
import { Body, Box, Vec3 } from "cannon-es";
import { CapsuleGeometry, Mesh, MeshStandardMaterial, Vector3 } from "three";

export default class Player extends BaseEntity {
  player: Mesh;
  playerPhysicBody: Body;

  jumpVelocity = 30;
  canJump = true;

  input = new BasicCharacterControllerInput();

  worldBodiesPositions = new Float32Array(3);

  constructor(props: BasePropsType) {
    super(props);
    this.initialize();
  }

  initialize() {
    this.player = new Mesh(
      new CapsuleGeometry(1, 2),
      new MeshStandardMaterial({})
    );

    this.player.receiveShadow = true;
    this.player.castShadow = true;

    this.playerPhysicBody = new Body({
      mass: 5,
      shape: new Box(new Vec3(0.5, 2, 0.5)),
      material: humanMaterial,
      fixedRotation: true,
    });

    this.playerPhysicBody.position.set(0, 4, 0);
    this.playerPhysicBody.linearDamping = 0.9;
    this.world?.addBody(this.playerPhysicBody);

    // //@ts-ignore
    // window.worker.postMessage(object, [object]);

    const contactNormal = new Vec3();
    const upAxis = new Vec3(0, 1, 0);

    this.playerPhysicBody.addEventListener("collide", (e: any) => {
      const { contact } = e;

      if (contact.bi.id === this.playerPhysicBody.id) {
        contact.ni.negate(contactNormal);
      } else {
        contactNormal.copy(contact.ni);
      }

      if (contactNormal.dot(upAxis) > 0.5) {
        this.canJump = true;
      }
    });

    //@ts-ignore
    window.worker.onmessage = function (e) {
      console.log(e.data.position[0], e.data.position[1], e.data.position[2]); // Tin nhắn này gửi đến main thread
    };

    this.scene?.add(this.player);
  }

  handleMovement(delta: number) {
    const { keys } = this.input;

    const directionVector = new Vector3();

    if (keys.left) directionVector.x += 1;
    if (keys.right) directionVector.x -= 1;
    if (keys.forward) directionVector.z += 1;
    if (keys.backward) directionVector.z -= 1;

    if (keys.space && this.canJump) {
      this.canJump = false;
      this.playerPhysicBody.velocity.y = this.jumpVelocity;
    }

    const forwardVector = new Vector3();

    this.camera?.getWorldDirection(forwardVector);

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

    const { x, y, z } = moveVector;

    const vectorMoveConverted = this.playerPhysicBody.position.vadd(
      new Vec3(x, y, z)
    );

    this.playerPhysicBody.position.set(
      vectorMoveConverted.x,
      vectorMoveConverted.y,
      vectorMoveConverted.z
    );
  }

  updateCamera() {
    const { x, y, z } = this.player.position;

    //constant lerp and diff y
    this.camera?.position.copy(new Vector3(x, y + 1, z));
  }

  update(delta: number) {
    this.handleMovement(delta);
    this.updateCamera();

    const { x, y, z } = this.playerPhysicBody.position;

    // dispatchWorkerAction("getBodyProperties", {
    //   position: this.worldBodiesPositions,
    // });

    //@ts-ignore
    window.worker.postMessage({ position: this.worldBodiesPositions });

    this.player.position.copy(new Vector3(x, y, z));
  }
}
