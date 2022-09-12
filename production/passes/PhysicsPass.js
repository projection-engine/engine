import Ammo from "../../physics/ammo.wasm.js"

const COLLISION = "COLLISION",
    DISPATCHER = "DISPATCHER",
    BROAD_PHASE = "BROAD_PHASE",
    SOLVER = "SOLVER",
    GRAVITY = "GRAVITY"
const DEFAULT_GRAVITY = [0, 9.8, 0]

export default class PhysicsPass {
    static ammo
    static worldSettings = new Map()
    static world

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
    }

    static updateGravity(x, y, z) {
        const ammo = PhysicsPass.ammo
        PhysicsPass.world.setGravity(new ammo.btVector3(x, y, z))
        PhysicsPass.worldSettings.set(GRAVITY, [x, y, z])
    }

    static execute(entities) {
        for(let i = 0; i < entities.length; i++){
            const entity = entities[i]

        }
    }
}
