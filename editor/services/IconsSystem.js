import RendererController from "../../production/controllers/RendererController";
import CameraAPI from "../../production/libs/CameraAPI";
import GPU from "../../production/controllers/GPU";
import STATIC_MESHES from "../../static/STATIC_MESHES";
import EditorRenderer from "../EditorRenderer";
import STATIC_SHADERS from "../../static/STATIC_SHADERS";
import SelectionStore from "../../../../stores/SelectionStore";
import STATIC_TEXTURES from "../../static/STATIC_TEXTURES";
import SpritePass from "../../production/templates/passes/SpritePass";
import GizmoSystem from "./GizmoSystem";

const SCALE = (new Array(3)).fill(.15)
const SCALE_CURSOR = (new Array(3)).fill(.5)

export default class IconsSystem {
    static cameraMesh
    static shader
    static selectedMap
    static textureOrange
    static textureYellow
    static cursorTexture


    static initialize() {
        IconsSystem.cameraMesh = GPU.meshes.get(STATIC_MESHES.CAMERA)
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
        const {iconsVisibility} = RendererController.params
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

            GPU.quad.use()
            if (!GizmoSystem.translation) {
                attr.scale = SCALE_CURSOR
                attr.transformationMatrix = EditorRenderer.cursor.transformationMatrix
                attr.iconSampler = IconsSystem.cursorTexture
                attr.attributes = [1, 1]
                SpritePass.shader.bindForUse(attr)
                GPU.quad.drawQuad()
            }
            const size = selected?.length
            entitiesLoop: if (size > 0) {
                attr.attributes = [1, 1]
                for (let i = 0; i < size; i++) {
                    const current = RendererController.entitiesMap.get(selected[i])
                    if(!current)
                        continue
                    attr.scale = SCALE
                    attr.transformationMatrix = current.transformationMatrix
                    attr.iconSampler = i === 0 ? IconsSystem.textureYellow : IconsSystem.textureOrange

                    SpritePass.shader.bindForUse(attr)
                    GPU.quad.drawQuad()
                }
            } else {
                attr.attributes = [1, 1]
                const current = RendererController.entitiesMap.get(SelectionStore.lockedEntity)
                if(!current)
                    break entitiesLoop
                attr.scale = SCALE
                attr.transformationMatrix = current.transformationMatrix
                attr.iconSampler = IconsSystem.textureYellow

                SpritePass.shader.bindForUse(attr)
                GPU.quad.drawQuad()
            }


            GPU.quad.finish()
            gpu.enable(gpu.DEPTH_TEST)
        }

    }


}