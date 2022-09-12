import STATIC_MESHES from "../../static/resources/STATIC_MESHES";
import GPU from "../../production/GPU";
import COMPONENTS from "../../static/COMPONENTS";
import COLLISION_TYPES from "../../static/COLLISION_TYPES";
import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";
import WIREFRAMEGlsl from "../templates/WIREFRAME.glsl";
import CameraAPI from "../../production/apis/CameraAPI";
import Engine from "../../production/Engine";

export default class WireframeSystem {
    static cube
    static sphere
    static shader

    static initialize() {
        WireframeSystem.shader = GPU.allocateShader(STATIC_SHADERS.DEVELOPMENT.WIREFRAME, WIREFRAMEGlsl.vertex, WIREFRAMEGlsl.fragment)
        WireframeSystem.cube = GPU.meshes.get(STATIC_MESHES.PRODUCTION.CUBE)
        WireframeSystem.sphere = GPU.meshes.get(STATIC_MESHES.PRODUCTION.SPHERE)

    }

    static execute(selected) {
        const size = selected.length

        if(size === 0 )
            return
        const entities = Engine.entitiesMap
        const obj = {
            viewMatrix: CameraAPI.viewMatrix,
            projectionMatrix: CameraAPI.projectionMatrix
        }

        for (let i = 0; i < size; i++) {
            const entity = entities.get(selected[i])
            if (!entity.active || !entity.collisionTransformationMatrix)
                continue
            const collision = entity.components.get(COMPONENTS.PHYSICS_COLLIDER)
            if (!collision)
                continue

            obj.transformMatrix = entity.collisionTransformationMatrix
            WireframeSystem.shader.bindForUse(obj)
            switch (collision.collisionType) {
                case COLLISION_TYPES.SPHERE:
                    WireframeSystem.sphere.drawLines()
                    break
                case COLLISION_TYPES.BOX:
                    WireframeSystem.cube.drawLines()
                    break
            }
        }
    }
}