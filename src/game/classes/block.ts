import { BLOCK_WIDTH } from "@/constants";
import { BlockFaces, Face } from "@/constants/block";
import blocks, {
  BlockAttributeType,
  BlockKeys,
  BlockTextureType,
  renderGeometry,
} from "@/constants/blocks";
import { nameFromCoordinate } from "@/game/helpers/nameFromCoordinate";
import { InstancedMesh, Mesh, Object3D, Vector3 } from "three";
import BaseEntity, { BasePropsType } from "./baseEntity";

interface PropsType {
  position: Vector3;
  type: keyof typeof blocks;
  blocksMapping: Record<string, Record<string, Record<string, BlockA>>>;
  shouldNotRender?: boolean;
  dummy: Object3D;
  intancedPlanes: Record<
    BlockTextureType,
    {
      mesh: InstancedMesh;
      count: number;
    }
  >;
}

const { leftZ, rightZ, leftX, rightX, top, bottom } = Face;

export default class BlockA extends BaseEntity {
  blockFaces: BlockFaces = {
    [leftZ]: null,
    [rightZ]: null,
    [leftX]: null,
    [rightX]: null,
    [top]: null,
    [bottom]: null,
  };
  type: BlockKeys;
  position: Vector3;
  atttribute: BlockAttributeType;
  blocksMapping: Record<string, Record<string, Record<string, BlockA>>>;

  dummy: Object3D;
  index: number;
  intancedPlanes: Record<
    BlockTextureType,
    {
      mesh: InstancedMesh;
      count: number;
    }
  >;

  constructor(props: BasePropsType & PropsType) {
    super(props);

    const {
      type,
      position,
      blocksMapping,
      shouldNotRender,
      dummy,
      intancedPlanes,
    } = props!;

    this.type = type;
    this.position = position;
    this.atttribute = blocks[type];
    this.dummy = dummy;
    this.intancedPlanes = intancedPlanes;
    this.blocksMapping = blocksMapping;

    if (!shouldNotRender) {
      this.render();
    }
  }

  getObject(name: string) {
    return this.scene?.getObjectByName(name) as THREE.Object3D;
  }

  render() {
    // should handle at top level, maybe dont need?
    // if (position.x % 2 || position.y % 2 || position.z % 2) return;

    const { x, y, z } = this.position;

    const leftZBlock = this.blocksMapping[x]?.[y]?.[z + BLOCK_WIDTH];
    if (leftZBlock) {
      leftZBlock.removeFace(rightZ);
    } else {
      this.addFace(leftZ);
    }

    const rightZBlock = this.blocksMapping[x]?.[y]?.[z - BLOCK_WIDTH];
    if (rightZBlock) {
      rightZBlock.removeFace(leftZ);
    } else {
      this.addFace(rightZ);
    }

    const leftXBlock = this.blocksMapping[x + BLOCK_WIDTH]?.[y]?.[z];
    if (leftXBlock) {
      leftXBlock.removeFace(rightX);
    } else {
      this.addFace(leftX);
    }

    const rightXBlock = this.blocksMapping[x - BLOCK_WIDTH]?.[y]?.[z];
    if (rightXBlock) {
      rightXBlock.removeFace(leftX);
    } else {
      this.addFace(rightX);
    }

    const topBlock = this.blocksMapping[x]?.[y + BLOCK_WIDTH]?.[z];
    if (topBlock) {
      topBlock.removeFace(bottom);
    } else {
      this.addFace(top);
    }

    const bottomBlock = this.blocksMapping[x]?.[y - BLOCK_WIDTH]?.[z];
    if (bottomBlock) {
      bottomBlock.removeFace(top);
    } else {
      this.addFace(bottom);
    }
  }

  removeFace(face: keyof BlockFaces) {
    this.scene?.remove(this.blockFaces[face] as Object3D);
  }

  addFace(face: keyof BlockFaces) {
    // console.count('add')
    const texture = this.atttribute.texture;

    const material =
      texture[this.atttribute.textureMap[face] as keyof typeof texture];

    const { x, y, z } = this.position;

    const { rotation } = this.calFaceAttr(face);

    const plane = new Mesh(renderGeometry, material);

    plane.position.copy(this.position);
    plane.rotation.set(rotation[0], rotation[1], rotation[2]);
    plane.name = nameFromCoordinate(x, y, z, this.type, face);

    this.blockFaces[face] = plane;
    // this.scene?.add(plane);

    // new
    const currInstanced =
      this.intancedPlanes[this.atttribute.textureMap[face]].mesh;

    this.dummy.position.copy(this.position);
    this.dummy.rotation.set(rotation[0], rotation[1], rotation[2]);
    this.dummy.updateMatrix();

    currInstanced.setMatrixAt(currInstanced.count, this.dummy.matrix);
    currInstanced.count += 1;
    currInstanced.instanceMatrix.needsUpdate = true;

    // currMesh.computeBoundingSphere();
  }

  calFaceAttr(face: keyof BlockFaces) {
    switch (face) {
      case leftZ:
        return { rotation: [0, 0, 0] };
      case rightZ:
        return { rotation: [0, Math.PI, 0] };
      case leftX:
        return {
          rotation: [0, Math.PI / 2, 0],
        };
      case rightX:
        return {
          rotation: [0, -Math.PI / 2, 0],
        };
      case top:
        return {
          rotation: [-Math.PI / 2, 0, 0],
        };
      case bottom:
        return {
          rotation: [Math.PI / 2, 0, 0],
        };
    }
  }

  destroy() {
    const { x, y, z } = this.position;

    Object.values(this.blockFaces).forEach((item) => {
      if (item) {
        item.geometry.dispose();
        this.scene?.remove(item);
      }
    });

    const leftZBlock = this.blocksMapping[x]?.[y]?.[z + BLOCK_WIDTH];
    leftZBlock?.addFace(rightZ);

    const rightZBlock = this.blocksMapping[x]?.[y]?.[z - BLOCK_WIDTH];
    rightZBlock?.addFace(leftZ);

    const leftXBlock = this.blocksMapping[x + BLOCK_WIDTH]?.[y]?.[z];
    leftXBlock?.addFace(rightX);

    const rightXBlock = this.blocksMapping[x - BLOCK_WIDTH]?.[y]?.[z];
    rightXBlock?.addFace(leftX);

    const topBlock = this.blocksMapping[x]?.[y + BLOCK_WIDTH]?.[z];
    topBlock?.addFace(bottom);

    const bottomBlock = this.blocksMapping[x]?.[y - BLOCK_WIDTH]?.[z];
    bottomBlock?.addFace(top);

    delete this.blocksMapping[x][y][z];
  }
}
