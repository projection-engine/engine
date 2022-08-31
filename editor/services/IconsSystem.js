import * as cameraShaderCode from "../templates/GIZMO.glsl"
import * as iconShaderCode from "../../production/data/shaders/SPRITE.glsl"
import ShaderInstance from "../../production/controllers/instances/ShaderInstance"
import COMPONENTS from "../../production/data/COMPONENTS"
import RendererController from "../../production/controllers/RendererController";
import CameraAPI from "../../production/libs/apis/CameraAPI";
import GPU from "../../production/controllers/GPU";
import STATIC_MESHES from "../../static/STATIC_MESHES";
import CAMERA from "../data/CAMERA.json";
import EditorRenderer from "../EditorRenderer";
import STATIC_TEXTURES from "../../static/STATIC_TEXTURES";
import STATIC_SHADERS from "../../static/STATIC_SHADERS";


export default class IconsSystem {
    static cameraMesh
    static spriteShader
    constructor() {
        GPU.allocateInstancedGroup(COMPONENTS.POINT_LIGHT)
        GPU.allocateInstancedGroup(COMPONENTS.DIRECTIONAL_LIGHT)
        GPU.allocateInstancedGroup(COMPONENTS.PROBE)

        IconsSystem.spriteShader = GPU.shaders.get(STATIC_SHADERS.SPRITE)
        GPU.allocateMesh(STATIC_MESHES.CAMERA, CAMERA)
        IconsSystem.cameraMesh = GPU.meshes.get(STATIC_MESHES.CAMERA)

        this.cameraShader = new ShaderInstance(cameraShaderCode.shadedVertex, cameraShaderCode.shadedFragment)
        this.selectedShader = new ShaderInstance(iconShaderCode.selectedVertex, iconShaderCode.selectedFragment)

        this.directionalLightTexture = GPU.textures.get(STATIC_TEXTURES.DIRECTIONAL_LIGHT)
        this.pointLightTexture = GPU.textures.get(STATIC_TEXTURES.POINT_LIGHT)
        this.probeTexture = GPU.textures.get(STATIC_TEXTURES.PROBE)
        this.checkerboardTexture = GPU.textures.get(STATIC_TEXTURES.CURSOR)
    }


    getIcon(entity) {
        const c = entity.components
        const isDLight = c[COMPONENTS.DIRECTIONAL_LIGHT] !== undefined
        const isPLight = c[COMPONENTS.POINT_LIGHT] !== undefined
        const isProbe = c[COMPONENTS.PROBE] !== undefined

        switch (true) {
            case isDLight:
                return this.directionalLightTexture.texture
            case isPLight:
                return this.pointLightTexture.texture
            case isProbe:
                return this.probeTexture.texture
            default:
                return
        }
    }


    #drawIcons(texture, iconSize, group) {
        if (group.bufferSize > 0) {
            group.bind()
            IconsSystem.spriteShader.bindForUse({
                cameraPosition: CameraAPI.position,
                viewMatrix: CameraAPI.viewMatrix,
                projectionMatrix: CameraAPI.projectionMatrix,

                iconSampler: texture,
                iconSize
            })
            GPU.quad.drawInstanced(group.bufferSize)

        }
    }

    #drawCameras(cameras, selected) {
        if (cameras.length > 0) {

            for (let i = 0; i < cameras.length; i++) {
                this.cameraShader.bindForUse({
                    viewMatrix: CameraAPI.viewMatrix,
                    transformMatrix: cameras[i].transformationMatrix,
                    projectionMatrix: CameraAPI.projectionMatrix,
                    axis: 3,
                    selectedAxis: selected.includes(cameras[i].id) ? 3 : 0
                })
                IconsSystem.cameraMesh.draw()
            }
        }

    }

    drawHighlighted(entity, sampler, forceAsIcon, iconSize) {
        this.selectedShader.bindForUse({
            cameraIsOrthographic: CameraAPI.isOrthographic,
            camPos: CameraAPI.position,
            viewMatrix: CameraAPI.viewMatrix,
            projectionMatrix: CameraAPI.projectionMatrix,

            transformMatrix: entity.transformationMatrix,
            translation: entity.translation,
            sampler,
            forceAsIcon,
            iconSize,
        })
        GPU.quad.drawQuad()
    }

    #drawSelected(selected, iconSize) {
        for (let i = 0; i < selected.length; i++) {
            const entity = RendererController.entitiesMap.get(selected[i])
            if (!entity)
                continue
            const icon = entity.active ? this.getIcon(entity) : undefined

            if (!icon)
                continue
            this.drawHighlighted(
                entity,
                icon,
                true,
                iconSize
            )
        }
    }

    execute() {
        const {cameras} = RendererController.data
        const {
            iconsVisibility,
            iconSize,
            selected
        } = RendererController.params

        if (iconsVisibility) {
            this.#drawCameras(cameras, selected)
            GPU.quad.use()

            gpu.disable(gpu.DEPTH_TEST)
            this.#drawSelected(selected, iconSize)
            this.drawHighlighted(EditorRenderer.cursor, this.checkerboardTexture.texture)
            gpu.enable(gpu.DEPTH_TEST)

            this.#drawIcons(this.directionalLightTexture.texture, iconSize, GPU.instancingGroup.get(COMPONENTS.DIRECTIONAL_LIGHT))
            this.#drawIcons(this.pointLightTexture.texture, iconSize, GPU.instancingGroup.get(COMPONENTS.POINT_LIGHT))
            this.#drawIcons(this.probeTexture.texture, iconSize, GPU.instancingGroup.get(COMPONENTS.PROBE))

            GPU.quad.finish()
            gpu.bindBuffer(gpu.ARRAY_BUFFER, null)
        }

    }


}