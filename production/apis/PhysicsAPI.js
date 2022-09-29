import Ammo from "ammo-electron-build";
import COMPONENTS from "../../static/COMPONENTS.json";
import COLLISION_TYPES from "../../static/COLLISION_TYPES";
import getImageData from "../../workers/utils/get-image-data";

const COLLISION = "COLLISION",
    DISPATCHER = "DISPATCHER",
    BROAD_PHASE = "BROAD_PHASE",
    SOLVER = "SOLVER",
    GRAVITY = "GRAVITY"
const COMP = COMPONENTS.RIGID_BODY

function sampleTexture(x, y, buffer, heightScale, canvasSize) {
    const r = buffer[y * (canvasSize * 4) + x * 4]
    let height = (r / 255)
    return height * heightScale
}


export default class PhysicsAPI {
    static #gravity = [0, 0, 0]

    static ammo
    static worldSettings = new Map()
    static world
    static rigidBodies = []
    static rigidBodiesMap = new Map()
    static tempTransformation

    static async initialize() {
        const ammo = await Ammo()
        const wS = PhysicsAPI.worldSettings
        PhysicsAPI.ammo = ammo
        wS.set(COLLISION, new ammo.btDefaultCollisionConfiguration())
        wS.set(DISPATCHER, new ammo.btCollisionDispatcher(wS.get(COLLISION)))
        wS.set(BROAD_PHASE, new ammo.btDbvtBroadphase())
        wS.set(SOLVER, new ammo.btSequentialImpulseConstraintSolver())
        PhysicsAPI.world = new ammo.btDiscreteDynamicsWorld(
            wS.get(DISPATCHER),
            wS.get(BROAD_PHASE),
            wS.get(SOLVER),
            wS.get(COLLISION)
        )
        PhysicsAPI.gravity = [0, -9.8, 0]
        PhysicsAPI.tempTransformation = new ammo.btTransform();
    }

    static initializeCollider(entity) {
        const ammo = PhysicsAPI.ammo
        const colliderComp = entity.components.get(COMPONENTS.PHYSICS_COLLIDER)

        switch (colliderComp.collisionType) {
            case COLLISION_TYPES.BOX: {
                const boxSize = new ammo.btVector3(colliderComp.size[0], colliderComp.size[1], colliderComp.size[2]);
                colliderComp.__shape = new ammo.btBoxShape(boxSize);
                colliderComp.__shape.setMargin(0.05);
                break
            }
            case COLLISION_TYPES.SPHERE:
                colliderComp.__shape = new ammo.btSphereShape(colliderComp.radius);
                colliderComp.__shape.setMargin(0.05);
                break
            case COLLISION_TYPES.CAPSULE:
                // TODO
                break
            default:
                break
        }
        colliderComp.__initialized = true
    }

    static get gravity() {
        return PhysicsAPI.#gravity
    }

    static set gravity(data) {
        PhysicsAPI.#gravity = data
        const ammo = PhysicsAPI.ammo
        PhysicsAPI.world.setGravity(new ammo.btVector3(data[0], data[1], data[2]))
        PhysicsAPI.worldSettings.set(GRAVITY, data)
    }

    static registerRigidBody(entity) {
        const ammo = PhysicsAPI.ammo
        const comps = entity.components
        const comp = comps.get(COMP)
        const colliderComp = comps.get(COMPONENTS.PHYSICS_COLLIDER)

        if (!ammo || !comp || comp.__initialized || !colliderComp) {
            if (PhysicsAPI.rigidBodiesMap.get(entity.id))
                PhysicsAPI.removeRigidBody(entity)
            return
        }

        const t = entity.absoluteTranslation
        const q = entity._rotationQuat

        comp.__transform = new ammo.btTransform();
        comp.__transform.setIdentity();
        comp.__transform.setOrigin(new ammo.btVector3(...t));
        comp.__transform.setRotation(new ammo.btQuaternion(...q));
        comp.__motionState = new ammo.btDefaultMotionState(comp.__transform);

        if (!colliderComp.__initialized)
            PhysicsAPI.initializeCollider(entity)

        const shape = colliderComp.__shape
        const i = comp.inertia
        comp.__inertia = new ammo.btVector3(i[0], i[1], i[2])
        if (comp.mass > 0)
            shape.calculateLocalInertia(comp.mass, comp.__inertia)

        const info = new ammo.btRigidBodyConstructionInfo(
            comp.mass,
            comp.__motionState,
            shape,
            comp.__inertia
        )
        comp.__body = new ammo.btRigidBody(info)

        PhysicsAPI.world.addRigidBody(comp.__body)

        comp.__initialized = true

        PhysicsAPI.rigidBodies.push(entity)
        PhysicsAPI.rigidBodiesMap.set(entity.id, entity)
    }

    static removeRigidBody(entity) {
        const ammo = PhysicsAPI.ammo
        const comp = entity.components.get(COMP)
        if (!ammo || !comp?.__initialized)
            return
        comp.__initialized = false
        PhysicsAPI.world.removeRigidBody(comp.__body)
        PhysicsAPI.rigidBodiesMap.delete(entity.id)
        PhysicsAPI.rigidBodies = PhysicsAPI.rigidBodies.filter(r => r !== entity)
    }

    static initializeTerrainCollision(entity, heightMap, heightScale, dimensions) {
        const colliderComp = entity.components.get(COMPONENTS.PHYSICS_COLLIDER)

        const {imageData, imageToLoad, canvas} = getImageData(heightMap)
        const vertexCount = imageToLoad.width

        const ammo = PhysicsAPI.ammo
        const terrainData = ammo._malloc(4 * vertexCount ** 2);
        let p = 0;
        let p2 = 0;
        for (let j = 0; j < vertexCount; j++) {
            for (let i = 0; i < vertexCount; i++) {
                ammo.HEAPF32[terrainData + p2 >> 2] = imageData[i * (canvas.width * 4) + j * 4] * heightScale / 255;
                p++;
                p2 += 4;
            }
        }
        const size = imageToLoad.width * dimensions
        const shape = new ammo.btHeightfieldTerrainShape(
            size,
            size,
            terrainData,
            heightScale,
            0, // MIN HEIGHT
            heightScale, // MAX HEIGHT
            1, // UP AXIS
            "PHY_FLOAT", // HDT
            false // FLIP EDGES
        );

        const scaleX = size / ( imageToLoad.width - 1 );
        const scaleZ = size / ( imageToLoad.width - 1 );
        shape.setLocalScaling( new ammo.btVector3( scaleX, 1, scaleZ ) );
        shape.setMargin( 0.05 );

        colliderComp.__shape = shape
        PhysicsAPI.initializeCollider(entity)
    }
}