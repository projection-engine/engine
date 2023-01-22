import {mat4, vec3} from "gl-matrix"
import CUBE_MAP_VIEWS from "../static/CUBE_MAP_VIEWS";
import ShadowProbe from "../instances/ShadowProbe";
import LightComponent from "../instances/components/LightComponent";
import GPU from "../GPU";
import StaticShaders from "../lib/StaticShaders";
import ResourceEntityMapper from "../lib/ResourceEntityMapper";
import MATERIAL_RENDERING_TYPES from "../static/MATERIAL_RENDERING_TYPES";
import MetricsController from "../lib/utils/MetricsController";
import METRICS_FLAGS from "../static/METRICS_FLAGS";

const cacheVec3 = vec3.create()
const cacheMat4 = mat4.create()
let lightsToUpdate:LightComponent[]
export default class OmnidirectionalShadows {
    static changed = false
    static maxCubeMaps = 2
    static shadowMap?:ShadowProbe
    static sampler?:WebGLTexture
    static lightsToUpdate:LightComponent[] = []

    static initialize() {
        OmnidirectionalShadows.shadowMap = new ShadowProbe(512)
        OmnidirectionalShadows.sampler = OmnidirectionalShadows.shadowMap.texture
        lightsToUpdate = OmnidirectionalShadows.lightsToUpdate
    }

    static execute() {
        MetricsController.currentState = METRICS_FLAGS.OMNIDIRECTIONAL_SHADOWS
        if (!OmnidirectionalShadows.changed && lightsToUpdate.length === 0)
            return;

        GPU.context.cullFace(GPU.context.BACK)
        GPU.context.viewport(0, 0, 512, 512)
        for (let i = 0; i < OmnidirectionalShadows.maxCubeMaps; i++) {
            const current = lightsToUpdate[i]
            if (!current)
                continue
            const entity = current.entity
            OmnidirectionalShadows.shadowMap
                .draw((yaw, pitch, perspective, index) => {
                        vec3.add(cacheVec3, entity._translation, <vec3>CUBE_MAP_VIEWS.target[index])
                        mat4.lookAt(cacheMat4, entity._translation, cacheVec3, <vec3>CUBE_MAP_VIEWS.up[index])
                        OmnidirectionalShadows.loopMeshes(
                            cacheMat4,
                            perspective,
                            current
                        )
                    },
                    current.zFar,
                    current.zNear
                )
        }
        OmnidirectionalShadows.changed = false
        lightsToUpdate.length = 0
    }

    static loopMeshes(view, projection, component) {
        const toRender = ResourceEntityMapper.meshesToDraw.array
        const size = toRender.length
        for (let m = 0; m < size; m++) {

            const current = toRender[m], meshComponent = current.meshComponent
            const mesh = current.meshRef
            if (!mesh || !meshComponent.castsShadows || !current.active || current.materialRef?.renderingMode === MATERIAL_RENDERING_TYPES.SKY)
                continue

            vec3.sub(cacheVec3, current.absoluteTranslation, component.entity.absoluteTranslation)
            const distanceFromLight = vec3.length(cacheVec3)

            if (distanceFromLight > component.cutoff)
                continue
            StaticShaders.omniDirectShadows.bindForUse({
                farPlane: component.zFar,
                viewMatrix: view,
                transformMatrix: current.matrix,
                projectionMatrix: projection,
                lightPosition: component.entity.absoluteTranslation
            })
            mesh.draw()
        }
    }

}