import blocks from "@/constants/blocks";
import nameFromCoordinate from "@/helpers/nameFromCoordinate";
import { BoxGeometry, Mesh, MeshStandardMaterial, Vector3 } from "three";
import BaseEntity, { BasePropsType } from "./baseEntity";

interface PropsType {
  position: Vector3;
  type: keyof typeof blocks;
  blocks?: Mesh<BoxGeometry, MeshStandardMaterial[]>[];
}

export default class Block extends BaseEntity {
  constructor(props: BasePropsType & PropsType) {
    super(props);

    this.initialize({
      position: props.position,
      type: props.type,
      blocks: props.blocks,
    });
  }

  async initialize({ position, type, blocks: blockArr }: PropsType) {
    const placeBlock = blocks[type];

    const textures = placeBlock.texture;

    const boxGeometry = new BoxGeometry(2, 2, 2);

    const newBlock = new Mesh(boxGeometry, textures);

    newBlock.name = nameFromCoordinate(position.x, position.y, position.z);
    newBlock.castShadow = true;
    newBlock.receiveShadow = true;

    newBlock.position.set(position.x, position.y, position.z);

    blockArr?.push(newBlock);

    this.scene?.add(newBlock);
  }
}
