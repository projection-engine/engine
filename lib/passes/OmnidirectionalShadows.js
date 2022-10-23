import * as smShaders from "../../templates/shaders/SHADOW_MAP.glsl"
import CubeMap from "../instances/CubeMap"
import {mat4, vec3} from "gl-matrix"
import COMPONENTS from "../../static/COMPONENTS.js"
import Engine from "../../Engine";
import GPUResources from "../../GPUResources";
import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";
import DeferredPass from "./DeferredPass";
import GPUController from "../../GPUController";
import CUBE_MAP_VIEWS from "../../static/CUBE_MAP_VIEWS";


let lightsToUpdate
export default class OmnidirectionalShadows {
    static changed = false
    static maxCubeMaps = 2
    static cubeMaps = []
    static shader
    static lightsToUpdate = []

    static initialize() {
        OmnidirectionalShadows.cubeMaps = [
            new CubeMap(512, true),
            new CubeMap(512, true)
        ]

        OmnidirectionalShadows.shader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.OMNIDIRECTIONAL_SHADOWS, smShaders.vertex, smShaders.omniFragment)
        DeferredPass.deferredUniforms.shadowCube0 = OmnidirectionalShadows.cubeMaps[0].texture
        DeferredPass.deferredUniforms.shadowCube1 = OmnidirectionalShadows.cubeMaps[1].texture
        lightsToUpdate = OmnidirectionalShadows.lightsToUpdate
    }

    static execute() {
        if (!OmnidirectionalShadows.changed && lightsToUpdate.length === 0)
            return;


        gpu.cullFace(gpu.FRONT)
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
                            OmnidirectionalShadows.shader,
                            mat4.lookAt([], entity._translation, target, CUBE_MAP_VIEWS.up[index]),
                            perspective,
                            entity._translation,
                            [current.zNear, current.zFar]
                        )
                    },
                    current.zFar,
                    current.zNear
                )
        }
        DeferredPass.deferredUniforms.shadowCube0 = OmnidirectionalShadows.cubeMaps[0].texture
        DeferredPass.deferredUniforms.shadowCube1 = OmnidirectionalShadows.cubeMaps[1].texture
        gpu.cullFace(gpu.BACK)
        OmnidirectionalShadows.changed = false
        lightsToUpdate.length = 0
    }

    static loopMeshes(shader, view, projection, lightPosition, shadowClipNearFar) {
        const meshes = Engine.data.meshes
        const l = meshes.length
        for (let m = 0; m < l; m++) {
            const current = meshes[m], meshComponent = current.components.get(COMPONENTS.MESH)
            const mesh = GPUResources.meshes.get(meshComponent.meshID)
            if (!mesh || !meshComponent.castsShadows)
                continue
            shader.bindForUse({
                shadowClipNearFar,
                viewMatrix: view,
                transformMatrix: current.matrix,
                projectionMatrix: projection,
                lightPosition
            })
            mesh.draw()
        }
    }

}