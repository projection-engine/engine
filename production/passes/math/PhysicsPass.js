import Ammo from "ammo-electron-build"
import Engine from "../../Engine";
import ENVIRONMENT from "../../../static/ENVIRONMENT";
import COMPONENTS from "../../../static/COMPONENTS";
import COLLISION_TYPES from "../../../static/COLLISION_TYPES";

const COLLISION = "COLLISION",
    DISPATCHER = "DISPATCHER",
    BROAD_PHASE = "BROAD_PHASE",
    SOLVER = "SOLVER",
    GRAVITY = "GRAVITY"
const DEFAULT_GRAVITY = [0, -9.8, 0]
const DEV_ENV = ENVIRONMENT.DEV, COMP = COMPONENTS.RIGID_BODY
export default class PhysicsPass {
    static ammo
    static worldSettings = new Map()
    static world
    static rigidBodies = []
    static rigidBodiesMap = new Map()
    static tempTransformation

    static async initialize() {
        const ammo = await Ammo()
        const wS = PhysicsPass.worldSettings
        PhysicsPass.ammo = ammo
        wS.set(COLLISION, new ammo.btDefaultCollisionConfiguration())
        wS.set(DISPATCHER, new ammo.btCollisionDispatcher(wS.get(COLLISION)))
        wS.set(BROAD_PHASE, new ammo.btDbvtBroadphase())
        wS.set(SOLVER, new ammo.btSequentialImpulseConstraintSolver())
        PhysicsPass.world = new ammo.btDiscreteDynamicsWorld(
            wS.get(DISPATCHER),
            wS.get(BROAD_PHASE),
            wS.get(SOLVER),
            wS.get(COLLISION)
        )

        PhysicsPass.updateGravity(...DEFAULT_GRAVITY)
        PhysicsPass.tempTransformation = new ammo.btTransform();
    }

    static updateGravity(x, y, z) {
        const ammo = PhysicsPass.ammo
        PhysicsPass.world.setGravity(new ammo.btVector3(x, y, z))
        PhysicsPass.worldSettings.set(GRAVITY, [x, y, z])
    }

    static #initializeCollider(entity) {
        const ammo = PhysicsPass.ammo
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

    static registerRigidBody(entity) {
        const ammo = PhysicsPass.ammo
        const comps = entity.components
        const comp = comps.get(COMP)
        const colliderComp = comps.get(COMPONENTS.PHYSICS_COLLIDER)

        if (!ammo || !comp || comp.__initialized || !colliderComp) {
            if (PhysicsPass.rigidBodiesMap.get(entity.id))
                PhysicsPass.removeRigidBody(entity)
            return
        }

        const m = entity.translation
        const q = entity.rotationQuaternion

        comp.__transform = new ammo.btTransform();
        comp.__transform.setIdentity();
        comp.__transform.setOrigin(new ammo.btVector3(...m));
        comp.__transform.setRotation(new ammo.btQuaternion(...q));
        comp.__motionState = new ammo.btDefaultMotionState(comp.__transform);

        if (!colliderComp.__initialized)
            PhysicsPass.#initializeCollider(entity)

        const shape = colliderComp.__shape
        comp.__inertia = new ammo.btVector3(0, 0, 0)
        if (comp.mass > 0)
            shape.calculateLocalInertia(comp.mass, comp.__inertia)

        const info = new ammo.btRigidBodyConstructionInfo(
            comp.mass,
            comp.__motionState,
            shape,
            comp.__inertia
        )
        comp.__body = new ammo.btRigidBody(info)

        PhysicsPass.world.addRigidBody(comp.__body)

        comp.__initialized = true

        PhysicsPass.rigidBodies.push(entity)
        PhysicsPass.rigidBodiesMap.set(entity.id, entity)
    }

    static removeRigidBody(entity) {
        const ammo = PhysicsPass.ammo
        const comp = entity.components.get(COMP)
        if (!ammo || !comp.__initialized)
            return
        comp.__initialized = false
        PhysicsPass.world.removeRigidBody(comp.__body)
        PhysicsPass.rigidBodiesMap.delete(entity.id)
        PhysicsPass.rigidBodies = PhysicsPass.rigidBodies.filter(r => r !== entity)
    }

    static clearEntries() {
        for (let i = 0; i < PhysicsPass.rigidBodies.length; i++)
            PhysicsPass.removeRigidBody(PhysicsPass.rigidBodies[i])
    }

    static execute() {
        if (Engine.environment === DEV_ENV || !PhysicsPass.ammo)
            return
        const rigidBodies = PhysicsPass.rigidBodies
        const length = rigidBodies.length
        const tempTransformation = PhysicsPass.tempTransformation
        PhysicsPass.world.stepSimulation(Engine.elapsed * 0.0001, 10)
        for (let i = 0; i < length; i++) {
            const current = rigidBodies[i]
            const component = current.components.get(COMP)
            if (!component?.__initialized) {
                if (!component)
                    PhysicsPass.removeRigidBody(current)
                continue
            }
            component.__motionState.getWorldTransform(tempTransformation)
            const position = tempTransformation.getOrigin()
            const quaternion = tempTransformation.getRotation()

            const t = current.translation
            const q = current.rotationQuaternion

            t[0] = position.x()
            t[1] = position.y()
            t[2] = position.z()

            q[0] = quaternion.x()
            q[1] = quaternion.y()
            q[2] = quaternion.z()
            q[3] = quaternion.w()

            current.changed = true
        }
    }
}
