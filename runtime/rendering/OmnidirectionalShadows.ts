import {mat4, vec3} from "gl-matrix"
import COMPONENTS from "../../static/COMPONENTS.js"
import CUBE_MAP_VIEWS from "../../static/CUBE_MAP_VIEWS";
import ShadowProbe from "../../instances/ShadowProbe";
import VisibilityRenderer from "./VisibilityRenderer";
import LightComponent from "../../templates/components/LightComponent";
import Shader from "../../instances/Shader";

const cacheVec3 = vec3.create()
const cacheMat4 = mat4.create()
let lightsToUpdate:LightComponent[]
export default class OmnidirectionalShadows {
    static changed = false
    static maxCubeMaps = 2
    static shadowMap?:ShadowProbe
    static sampler?:WebGLTexture
    static shader?:Shader
    static lightsToUpdate:LightComponent[] = []

    static initialize() {
        OmnidirectionalShadows.shadowMap = new ShadowProbe(512)
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
        const toRender = VisibilityRenderer.meshesToDraw.array
        const size = toRender.length
        for (let m = 0; m < size; m++) {

            const current = toRender[m], meshComponent = current.components.get(COMPONENTS.MESH)
            const mesh = current.__meshRef
            if (!mesh || !meshComponent.castsShadows || !current.active || current.__materialRef?.isSky)
                continue

            vec3.sub(cacheVec3, current.absoluteTranslation, component.__entity.absoluteTranslation)
            const distanceFromLight = vec3.length(cacheVec3)

            if (distanceFromLight > component.cutoff)
                continue
            OmnidirectionalShadows.shader.bindForUse({
                farPlane: component.zFar,
                viewMatrix: view,
                transformMatrix: current.matrix,
                projectionMatrix: projection,
                lightPosition: component.__entity.absoluteTranslation
            })
            mesh.draw()
        }
    }

}