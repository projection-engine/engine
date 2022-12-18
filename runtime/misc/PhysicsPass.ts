import Engine from "../../Engine";
import COMPONENTS from "../../static/COMPONENTS.js";
import PhysicsAPI from "../../lib/rendering/PhysicsAPI";
import RigidBodyComponent from "../../templates/components/RigidBodyComponent";

export default class PhysicsPass {
    static simulationStep = 0.01666666
    static subSteps = 10

    static execute() {
        if (Engine.isDev || !PhysicsAPI.ammo)
            return

        const rigidBodies = PhysicsAPI.rigidBodies
        const length = rigidBodies.length
        const tempTransformation = PhysicsAPI.tempTransformation

        PhysicsAPI.world.stepSimulation(PhysicsPass.simulationStep, PhysicsPass.subSteps)

        for (let i = 0; i < length; i++) {
            const current = rigidBodies[i]
            const component = current.__rigidBodyComponent
            if (!component?.motionState) {
                if (!component)
                    PhysicsAPI.removeRigidBody(current)
                continue
            }
            component.motionState.getWorldTransform(tempTransformation)
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
