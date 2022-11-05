import {mat4, vec3} from "gl-matrix"
import COMPONENTS from "../../static/COMPONENTS.js"
import Engine from "../../Engine";
import GPU from "../../GPU";
import GBuffer from "../renderers/GBuffer";
import CUBE_MAP_VIEWS from "../../static/CUBE_MAP_VIEWS";
import ShadowProbe from "../../instances/ShadowProbe";


let lightsToUpdate
export default class OmnidirectionalShadows {
    static changed = false
    static maxCubeMaps = 2
    static shadowMap
    static sampler
    static shader
    static lightsToUpdate = []

    static initialize() {
        OmnidirectionalShadows.shadowMap =  new ShadowProbe(512)


        OmnidirectionalShadows.sampler = OmnidirectionalShadows.shadowMap.texture
        lightsToUpdate = OmnidirectionalShadows.lightsToUpdate
    }

    static execute() {
        if (!OmnidirectionalShadows.changed && lightsToUpdate.length === 0)
            return;

        gpu.cullFace(gpu.BACK)
        gpu.viewport(0, 0, 512, 512)
        for (let i = 0; i < OmnidirectionalShadows.maxCubeMaps; i++) {
            const current = lightsToUpdate[i]
            if (!current)
                continue
            const entity = current.__entity
            OmnidirectionalShadows.shadowMap
                .draw((yaw, pitch, perspective, index) => {
                        const target = vec3.add([], entity._translation, CUBE_MAP_VIEWS.target[index])
                        OmnidirectionalShadows.loopMeshes(
                            mat4.lookAt([], entity._translation, target, CUBE_MAP_VIEWS.up[index]),
                            perspective,
                            entity._translation,
                            current.zFar
                        )
                    },
                    current.zFar,
                    current.zNear
                )
        }
        OmnidirectionalShadows.changed = false
        lightsToUpdate.length = 0
    }

    static loopMeshes(view, projection, lightPosition, farPlane) {
        const meshes = Engine.data.meshes
        const l = meshes.length
        for (let m = 0; m < l; m++) {
            const current = meshes[m], meshComponent = current.components.get(COMPONENTS.MESH)
            const mesh = GPU.meshes.get(meshComponent.meshID)
            if (!mesh || !meshComponent.castsShadows || !current.active)
                continue
            OmnidirectionalShadows.shader.bindForUse({
                farPlane,
                viewMatrix: view,
                transformMatrix: current.matrix,
                projectionMatrix: projection,
                lightPosition
            })
            mesh.draw()
        }
    }

}