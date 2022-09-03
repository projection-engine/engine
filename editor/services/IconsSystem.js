import RendererController from "../../production/controllers/RendererController";
import CameraAPI from "../../production/libs/CameraAPI";
import GPU from "../../production/controllers/GPU";
import STATIC_MESHES from "../../static/STATIC_MESHES";
import EditorRenderer from "../EditorRenderer";
import STATIC_SHADERS from "../../static/STATIC_SHADERS";
import SelectionStore from "../../../../stores/SelectionStore";
import STATIC_TEXTURES from "../../static/STATIC_TEXTURES";
import COMPONENTS from "../../production/data/COMPONENTS";
import SpritePass from "../../production/templates/passes/SpritePass";
import TransformationAPI from "../../production/libs/TransformationAPI";

const SCALE = (new Array(3)).fill(.3)
const SCALE_CURSOR = (new Array(3)).fill(.5)
const PIXEL = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAMSURBVBhXY/hfrw4ABCYBppQw0l8AAAAASUVORK5CYII=`
export default class IconsSystem {
    static cameraMesh
    static shader
    static selectedMap
    static texture
    static cursorTexture


    static initialize() {
        IconsSystem.cameraMesh = GPU.meshes.get(STATIC_MESHES.CAMERA)
        IconsSystem.selectedMap = SelectionStore.map

        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        canvas.width = 128
        canvas.height = 128

        // LOCKED ENTITY
        ctx.fillStyle = "rgb(255, 69, 0)"
        ctx.arc(64, 64, 10, 0, Math.PI * 2)
        ctx.fill()

        GPU.allocateTexture(canvas.toDataURL(), STATIC_TEXTURES.PIXEL).then(texture => {
            IconsSystem.texture = texture.texture
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


    static execute() {
        const {cameras} = RendererController.data
        const {iconsVisibility} = RendererController.params
        let current
        if (iconsVisibility) {
            const attr = {
                viewMatrix: CameraAPI.viewMatrix,
                cameraPosition: CameraAPI.position,
                projectionMatrix: CameraAPI.projectionMatrix,
                translation: [0, 0, 0],
                sameSize: false
            }
            for (let i = 0; i < cameras.length; i++) {

                attr.axis = 3
                attr.selectedAxis = IconsSystem.selectedMap.get(cameras[i].id) ? 3 : 0
                attr.transformMatrix = cameras[i].transformationMatrix

                IconsSystem.shader.bindForUse(attr)
                IconsSystem.cameraMesh.draw()
            }

            gpu.disable(gpu.DEPTH_TEST)

            GPU.quad.use()

            current = EditorRenderer.cursor
            attr.scale = SCALE_CURSOR
            attr.transformationMatrix = current.transformationMatrix
            attr.iconSampler = IconsSystem.cursorTexture
            attr.attributes = [1, 1]
            SpritePass.shader.bindForUse(attr)
            GPU.quad.drawQuad()

            const locked = SelectionStore.lockedEntity
            if (IconsSystem.texture && locked) {
                current = RendererController.entitiesMap.get(locked)
                attr.scale = SCALE
                attr.transformationMatrix = current.transformationMatrix
                attr.iconSampler = IconsSystem.texture

                SpritePass.shader.bindForUse(attr)
                GPU.quad.drawQuad()
            }

            GPU.quad.finish()
            gpu.enable(gpu.DEPTH_TEST)
        }

    }


}