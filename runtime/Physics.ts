import Engine from "../Engine";
import PhysicsAPI from "../lib/rendering/PhysicsAPI";
import MetricsController from "../lib/utils/MetricsController";
import METRICS_FLAGS from "../static/METRICS_FLAGS";

export default class Physics {
    static #sStep = 0.01666666
    static #interval = null

    static set simulationStep(data: number) {
        Physics.#sStep = data / 1000
    }

    static get simulationStep(): number {
        return Physics.#sStep * 1000
    }

    static subSteps = 10

    static start() {
        Physics.#interval = setInterval(Physics.#execute, Physics.#sStep * 1000)
    }

    static stop() {
        clearInterval(Physics.#interval)
        Physics.#interval = null
    }

    static #execute() {
        if (Engine.isDev || !PhysicsAPI.ammo)
            return

        const rigidBodies = PhysicsAPI.rigidBodies
        const length = rigidBodies.length
        const tempTransformation = PhysicsAPI.tempTransformation

        PhysicsAPI.world.stepSimulation(Physics.simulationStep, Physics.subSteps)

        for (let i = 0; i < length; i++) {
            const current = rigidBodies[i]
            const component = current.rigidBodyComponent
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
            MetricsController.currentState = METRICS_FLAGS.PHYSICS
        }
    }
}
