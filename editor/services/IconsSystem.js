import Engine from "../../production/Engine";
import CameraAPI from "../../production/apis/camera/CameraAPI";
import GPU from "../../production/GPU";
import STATIC_MESHES from "../../static/resources/STATIC_MESHES";

import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";
import SelectionStore from "../../../../src/editor/stores/SelectionStore";
import STATIC_TEXTURES from "../../static/resources/STATIC_TEXTURES";
import SpritePass from "../../production/passes/effects/SpritePass";
import QuadAPI from "../../production/apis/rendering/QuadAPI";

const SCALE = (new Array(3)).fill(.25)
const SCALE_CURSOR = (new Array(3)).fill(.5)

export default class IconsSystem {
    static cameraMesh
    static shader
    static selectedMap
    static textureOrange
    static textureYellow
    static cursorTexture


    static initialize() {
        IconsSystem.cameraMesh = GPU.meshes.get(STATIC_MESHES.EDITOR.CAMERA)
        IconsSystem.selectedMap = SelectionStore.map

        IconsSystem.shader = GPU.shaders.get(STATIC_SHADERS.DEVELOPMENT.UNSHADED)

        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        canvas.width = 128
        canvas.height = 128

        // LOCKED ENTITY
        ctx.fillStyle = "yellow"
        ctx.arc(64, 64, 10, 0, Math.PI * 2)
        ctx.fill()
        GPU.allocateTexture(canvas.toDataURL(), STATIC_TEXTURES.PIXEL).then(texture => {
            IconsSystem.textureYellow = texture.texture
        })

        ctx.clearRect(0, 0, 128, 128)

        ctx.fillStyle = "rgb(255, 69, 0)"
        ctx.arc(64, 64, 10, 0, Math.PI * 2)
        ctx.fill()
        GPU.allocateTexture(canvas.toDataURL(), STATIC_TEXTURES.PIXEL_ORANGE).then(texture => {
            IconsSystem.textureOrange = texture.texture
        })

        ctx.clearRect(0, 0, 128, 128)

        ctx.lineWidth = 5
        ctx.strokeStyle = "white"
        ctx.arc(64, 64, 10, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()

        GPU.allocateTexture(canvas.toDataURL(), STATIC_TEXTURES.CURSOR).then(texture => {
            IconsSystem.cursorTexture = texture.texture
        })
    }


    static execute(selected) {
        const {iconsVisibility} = Engine.params
        if (iconsVisibility) {
            const attr = {
                viewMatrix: CameraAPI.viewMatrix,
                cameraPosition: CameraAPI.position,
                projectionMatrix: CameraAPI.projectionMatrix,
                translation: [0, 0, 0],
                sameSize: false,
                highlight: false
            }
            gpu.disable(gpu.DEPTH_TEST)

            QuadAPI.use()

            attr.scale = SCALE_CURSOR
            attr.transformationMatrix = window.engineCursor.matrix
            attr.iconSampler = IconsSystem.cursorTexture
            attr.attributes = [1, 1]
            SpritePass.shader.bindForUse(attr)
            QuadAPI.drawQuad()

            const size = selected?.length
            entitiesLoop: if (size > 0) {
                attr.attributes = [1, 1]
                for (let i = 0; i < size; i++) {
                    const current = Engine.entitiesMap.get(selected[i])
                    if (!current)
                        continue
                    attr.scale = SCALE
                    attr.transformationMatrix = current.matrix
                    attr.iconSampler = i === 0 ? IconsSystem.textureYellow : IconsSystem.textureOrange

                    SpritePass.shader.bindForUse(attr)
                    QuadAPI.drawQuad()
                }
            } else {
                attr.attributes = [1, 1]
                const current = Engine.entitiesMap.get(SelectionStore.lockedEntity)
                if (!current)
                    break entitiesLoop
                attr.scale = SCALE
                attr.transformationMatrix = current.matrix
                attr.iconSampler = IconsSystem.textureYellow

                SpritePass.shader.bindForUse(attr)
                QuadAPI.drawQuad()
            }


            QuadAPI.finish()
            gpu.enable(gpu.DEPTH_TEST)
        }

    }


}