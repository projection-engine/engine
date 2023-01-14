import Ammo from "../Ammo.js";

import COMPONENTS from "../../templates/COMPONENTS";
import COLLISION_TYPES from "../../static/COLLISION_TYPES";
import PhysicsColliderComponent from "../../instances/components/PhysicsColliderComponent";
import Entity from "../../instances/Entity";
import RigidBodyComponent from "../../instances/components/RigidBodyComponent";

const COLLISION = "COLLISION",
    DISPATCHER = "DISPATCHER",
    BROAD_PHASE = "BROAD_PHASE",
    SOLVER = "SOLVER",
    GRAVITY = "GRAVITY"


export default class PhysicsAPI {
    static #gravity: [number, number, number] = [0, 0, 0]
    static ammo?: AmmoJS
    static worldSettings = new Map()
    static world?: btDiscreteDynamicsWorld
    static rigidBodies: Entity [] = []
    static rigidBodiesMap = new Map()
    static tempTransformation?: btTransform

    static async initialize() {
        const ammo = <AmmoJS>await Ammo()
        const wS = PhysicsAPI.worldSettings
        PhysicsAPI.ammo = ammo
        wS.set(COLLISION, new ammo.btDefaultCollisionConfiguration())
        wS.set(DISPATCHER, new ammo.btCollisionDispatcher(wS.get(COLLISION)))
        wS.set(BROAD_PHASE, new ammo.btDbvtBroadphase())
        wS.set(SOLVER, new ammo.btSequentialImpulseConstraintSolver())
        PhysicsAPI.world = <btDiscreteDynamicsWorld>new ammo.btDiscreteDynamicsWorld(
            wS.get(DISPATCHER),
            wS.get(BROAD_PHASE),
            wS.get(SOLVER),
            wS.get(COLLISION)
        )
        PhysicsAPI.gravity = [0, -9.8, 0]
        PhysicsAPI.tempTransformation = <btTransform>new ammo.btTransform();
    }

    static initializeCollider(entity) {
        const ammo = PhysicsAPI.ammo
        const colliderComp = entity.physicsColliderComponent

        switch (colliderComp.collisionType) {
            case COLLISION_TYPES.BOX: {
                const boxSize = <btVector3>new ammo.btVector3(colliderComp.size[0], colliderComp.size[1], colliderComp.size[2]);
                colliderComp.shape = <btBoxShape>new ammo.btBoxShape(boxSize);
                colliderComp.shape.setMargin(0.05);
                break
            }
            case COLLISION_TYPES.SPHERE:
                colliderComp.shape = <btSphereShape>new ammo.btSphereShape(colliderComp.radius);
                colliderComp.shape.setMargin(0.05);
                break
            case COLLISION_TYPES.CAPSULE:
                // TODO
                break
            default:
                break
        }
        colliderComp.initialized = true
    }

    static get gravity(): [number, number, number] {
        return PhysicsAPI.#gravity
    }

    static set gravity(data) {
        PhysicsAPI.#gravity = data
        const ammo = PhysicsAPI.ammo
        PhysicsAPI.world.setGravity(<btVector3>new ammo.btVector3(data[0], data[1], data[2]))
        PhysicsAPI.worldSettings.set(GRAVITY, data)
    }

    static registerRigidBody(entity: Entity) {
        const ammo = PhysicsAPI.ammo
        const comps = entity.components
        const comp = <RigidBodyComponent>comps.get(COMPONENTS.RIGID_BODY)
        const colliderComp = <PhysicsColliderComponent>comps.get(COMPONENTS.PHYSICS_COLLIDER)

        if (!ammo || !comp || comp.motionState || !colliderComp) {
            if (PhysicsAPI.rigidBodiesMap.get(entity.id))
                PhysicsAPI.removeRigidBody(entity)
            return
        }

        const t = entity.absoluteTranslation
        const q = entity._rotationQuat

        comp.transform = <btTransform>new ammo.btTransform();
        comp.transform.setIdentity();
        comp.transform.setOrigin(<btVector3>new ammo.btVector3(t[0], t[1], t[2]));
        comp.transform.setRotation(<btQuaternion>new ammo.btQuaternion(q[0], q[1], q[2], q[3]));
        comp.motionState = <btDefaultMotionState>new ammo.btDefaultMotionState(comp.transform);

        if (!colliderComp.initialized)
            PhysicsAPI.initializeCollider(entity)

        const shape = colliderComp.shape
        comp.inertiaBody = <btVector3>new ammo.btVector3(...comp.inertia)
        if (comp.mass > 0)
            shape.calculateLocalInertia(comp.mass, comp.inertiaBody)

        const info = <btRigidBodyConstructionInfo>new ammo.btRigidBodyConstructionInfo(
            comp.mass,
            comp.motionState,
            shape,
            comp.inertiaBody
        )
        comp.body = <btRigidBody>new ammo.btRigidBody(info)
        PhysicsAPI.world.addRigidBody(comp.body)
        comp.initialized = true
        PhysicsAPI.rigidBodies.push(entity)
        PhysicsAPI.rigidBodiesMap.set(entity.id, entity)
    }

    static removeRigidBody(entity: Entity) {
        const ammo = PhysicsAPI.ammo
        const comp = entity.rigidBodyComponent
        if (!ammo || !comp?.motionState)
            return
        comp.initialized = false
        PhysicsAPI.world.removeRigidBody(comp.body)
        PhysicsAPI.rigidBodiesMap.delete(entity.id)
        PhysicsAPI.rigidBodies = PhysicsAPI.rigidBodies.filter(r => r !== entity)
    }

    static initializeTerrainCollision(entity, heightMap, heightScale, dimensions) {
        // const colliderComp = entity.components.get(COMPONENTS.PHYSICS_COLLIDER)
        //
        // const {imageData, imageToLoad, canvas} = getImageData(heightMap)
        // const vertexCount = imageToLoad.width
        //
        // const ammo = PhysicsAPI.ammo
        // const terrainData = ammo._malloc(4 * vertexCount ** 2);
        // let p = 0;
        // let p2 = 0;
        // for (let j = 0; j < vertexCount; j++) {
        //     for (let i = 0; i < vertexCount; i++) {
        //         ammo.HEAPF32[terrainData + p2 >> 2] = imageData[i * (canvas.width * 4) + j * 4] * heightScale / 255;
        //         p++;
        //         p2 += 4;
        //     }
        // }
        // const size = imageToLoad.width * dimensions
        // const shape = new ammo.btHeightfieldTerrainShape(
        //     size,
        //     size,
        //     terrainData,
        //     heightScale,
        //     0, // MIN HEIGHT
        //     heightScale, // MAX HEIGHT
        //     1, // UP AXIS
        //     "PHY_FLOAT", // HDT
        //     false // FLIP EDGES
        // );
        //
        // const scaleX = size / ( imageToLoad.width - 1 );
        // const scaleZ = size / ( imageToLoad.width - 1 );
        // shape.setLocalScaling( new ammo.btVector3( scaleX, 1, scaleZ ) );
        // shape.setMargin( 0.05 );
        //
        // colliderComp.shape = shape
        // PhysicsAPI.initializeCollider(entity)
    }
}