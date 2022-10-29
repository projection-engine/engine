import Engine from "../Engine";
import ENVIRONMENT from "../static/ENVIRONMENT";
import COMPONENTS from "../static/COMPONENTS.js";
import PhysicsAPI from "../api/PhysicsAPI";

const COMP = COMPONENTS.RIGID_BODY
export default class PhysicsPass {
    static simulationStep = 0.01666666
    static subSteps = 10
    static isDev = false

    static execute() {
        if (PhysicsPass.isDev || !PhysicsAPI.ammo)
            return
        const rigidBodies = PhysicsAPI.rigidBodies
        const length = rigidBodies.length
        const tempTransformation = PhysicsAPI.tempTransformation

        PhysicsAPI.world.stepSimulation(PhysicsPass.simulationStep, PhysicsPass.subSteps)

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
