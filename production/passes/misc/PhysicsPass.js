import Ammo from "ammo-electron-build"
import Engine from "../../Engine";
import ENVIRONMENT from "../../../static/ENVIRONMENT";
import COMPONENTS from "../../../static/COMPONENTS.json";
import COLLISION_TYPES from "../../../static/COLLISION_TYPES";
import PhysicsAPI from "../../apis/PhysicsAPI";

const DEV_ENV = ENVIRONMENT.DEV, COMP = COMPONENTS.RIGID_BODY
export default class PhysicsPass {
    static execute() {
        if (Engine.environment === DEV_ENV || !PhysicsAPI.ammo)
            return
        const rigidBodies = PhysicsAPI.rigidBodies
        const length = rigidBodies.length
        const tempTransformation = PhysicsAPI.tempTransformation
        PhysicsAPI.world.stepSimulation(Engine.elapsed * .1, 10)
        for (let i = 0; i < length; i++) {
            const current = rigidBodies[i]
            const component = current.components.get(COMP)
            if (!component?.__initialized) {
                if (!component)
                    PhysicsAPI.removeRigidBody(current)
                continue
            }
            component.__motionState.getWorldTransform(tempTransformation)
            const position = tempTransformation.getOrigin()
            const quaternion = tempTransformation.getRotation()

            const t = current._translation
            const q = current._rotationQuat

            t[0] = position.x()
            t[1] = position.y()
            t[2] = position.z()

            q[0] = quaternion.x()
            q[1] = quaternion.y()
            q[2] = quaternion.z()
            q[3] = quaternion.w()

            current.__changedBuffer[0] = 1
        }
    }
}
