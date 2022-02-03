import System from "../basic/System";
import {vec4} from "gl-matrix";

const GRAVITY = .1
export default class PhysicsSystem extends System {
    constructor() {
        super([]);
    }

    execute(entities, params, systems, filteredEntities) {
        super.execute()
        const {
            canExecutePhysicsAnimation,
            meshes,
            selectedElement,
            setSelectedElement,
            currentCoords,
            clicked,
            camera,
            elapsed
        } = params

        if (canExecutePhysicsAnimation) {
            const staticMeshes = this._find(entities, e => filteredEntities.staticPhysicsMeshes[e.id] !== undefined)
            const dynamicMeshes = this._find(entities, e => filteredEntities.dynamicPhysicsMeshes[e.id] !== undefined)

            for (let i = 0; i < dynamicMeshes.length; i++) {
                const current = dynamicMeshes[i]
                let intersecting = false
                const physicsComp = current.components.PhysicsComponent
                const time = elapsed / 1000
                const acceleration = [
                    0,
                    -GRAVITY * time,
                    0
                ]

                for (let j = 0; j < staticMeshes.length; j++) {
                    const res = intersectBoundingSphere(current.components, staticMeshes[j].components)
                    intersecting = intersecting || res
                }

                if(!intersecting) {
                    physicsComp.acceleration = acceleration
                    physicsComp.velocity = divideArray(acceleration, time)

                    const displacement = [
                        calculateDisplacement(physicsComp.velocity[0], time, acceleration[0]),
                        calculateDisplacement(physicsComp.velocity[1], time, acceleration[1]),
                        calculateDisplacement(physicsComp.velocity[2], time, acceleration[2]),
                    ]
                    current.components.TransformComponent.translation = sumArrays(displacement, current.components.TransformComponent.translation)
                }

            }
        }
    }
}

function intersectBoundingSphere(current, target) {
    let radiusDistance = current.ColliderComponent.radius + target.ColliderComponent.radius,
        centerDistance = [0, 0, 0, 1]
    vec4.subtract(centerDistance, target.TransformComponent.position, current.TransformComponent.position)
    centerDistance = vec4.length(centerDistance)

    return (centerDistance - radiusDistance) <= .1;
}

function calculateDisplacement(u, t, a) {
    return u * t + 0.5 * a * (t ** 2)
}

function divideArray(array, scalar) {
    return array.map(v => {
        return v / scalar
    })
}

function sumArrays(array1, array2) {
    return array1.map((v, i) => {
        return v + array2[i];
    })
}