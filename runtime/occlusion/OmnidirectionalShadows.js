import {mat4, vec3} from "gl-matrix"
import COMPONENTS from "../../static/COMPONENTS.js"
import Engine from "../../Engine";
import GPUResources from "../../GPUResources";
import DeferredRenderer from "../renderers/DeferredRenderer";
import CUBE_MAP_VIEWS from "../../static/CUBE_MAP_VIEWS";
import ShadowProbe from "../../instances/ShadowProbe";


let lightsToUpdate
export default class OmnidirectionalShadows {
    static changed = false
    static maxCubeMaps = 2
    static cubeMaps = []
    static shader
    static lightsToUpdate = []

    static initialize() {
        OmnidirectionalShadows.cubeMaps = [
            new ShadowProbe(512),
            new ShadowProbe(512)
        ]


        DeferredRenderer.deferredUniforms.shadowCube0 = OmnidirectionalShadows.cubeMaps[0].texture
        DeferredRenderer.deferredUniforms.shadowCube1 = OmnidirectionalShadows.cubeMaps[1].texture
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
            OmnidirectionalShadows.cubeMaps[i]
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
        DeferredRenderer.deferredUniforms.shadowCube0 = OmnidirectionalShadows.cubeMaps[0].texture
        DeferredRenderer.deferredUniforms.shadowCube1 = OmnidirectionalShadows.cubeMaps[1].texture
        OmnidirectionalShadows.changed = false
        lightsToUpdate.length = 0
    }

    static loopMeshes(view, projection, lightPosition, farPlane) {
        const meshes = Engine.data.meshes
        const l = meshes.length
        for (let m = 0; m < l; m++) {
            const current = meshes[m], meshComponent = current.components.get(COMPONENTS.MESH)
            const mesh = GPUResources.meshes.get(meshComponent.meshID)
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