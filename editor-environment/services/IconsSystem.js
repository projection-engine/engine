import Engine from "../../Engine";
import CameraAPI from "../../api/CameraAPI";
import GPU from "../../GPU";
import STATIC_MESHES from "../../static/resources/STATIC_MESHES";

import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";
import SelectionStore from "../../../../src/stores/SelectionStore";
import STATIC_TEXTURES from "../../static/resources/STATIC_TEXTURES";
import SpritePass from "../../runtime/renderers/SpritePass";
import QueryAPI from "../../api/utils/QueryAPI";
import {mat4} from "gl-matrix";
import GPUAPI from "../../api/GPUAPI";

const SCALE = (new Array(3)).fill(.25)
const EMPTY_MATRIX = mat4.create()

export default class IconsSystem {
    static cameraMesh
    static shader
    static selectedMap
    static textureOrange
    static textureYellow

    static initialize() {
        IconsSystem.cameraMesh = GPU.meshes.get(STATIC_MESHES.EDITOR.CAMERA)
        IconsSystem.selectedMap = SelectionStore.map

        IconsSystem.shader = GPU.shaders.get(STATIC_SHADERS.DEVELOPMENT.UNSHADED)

        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        canvas.width = 128
        canvas.height = 128

        // LOCKED ENTITY
        ctx.fillStyle = "rgb(255, 69, 0)"
        ctx.arc(64, 64, 10, 0, Math.PI * 2)
        ctx.fill()
        GPUAPI.allocateTexture(canvas.toDataURL(), STATIC_TEXTURES.PIXEL).then(texture => {
            IconsSystem.textureYellow = texture.texture
        })

        ctx.clearRect(0, 0, 128, 128)

        ctx.fillStyle = "yellow"
        ctx.arc(64, 64, 10, 0, Math.PI * 2)
        ctx.fill()
        GPUAPI.allocateTexture(canvas.toDataURL(), STATIC_TEXTURES.PIXEL_ORANGE).then(texture => {
            IconsSystem.textureOrange = texture.texture
        })

    }

    static getMatrix(entity) {

        if (entity.changesApplied || !entity.__cacheCenterMatrix || entity.__pivotChanged) {
            entity.__pivotChanged = false
            const m = !entity.__cacheCenterMatrix ? mat4.clone(EMPTY_MATRIX) : entity.__cacheCenterMatrix

            m[12] = entity.pivotPoint[0]
            m[13] = entity.pivotPoint[1]
            m[14] = entity.pivotPoint[2]
            const translation = entity.parent?._translation
            if(translation){
                m[12] += translation[0]
                m[13] += translation[1]
                m[14] += translation[2]
            }

            entity.__cacheCenterMatrix = m
        }
    }

    static execute(selected) {
        const {iconsVisibility} = Engine.params


        if (iconsVisibility) {
            const attr = {

                translation: [0, 0, 0],
                sameSize: false,
                highlight: false
            }
            gpu.disable(gpu.DEPTH_TEST)

            const size = selected?.length
            if (size > 0) {

                attr.attributes = [1, 1]
                for (let i = 0; i < size; i++) {
                    const current = QueryAPI.getEntityByID(selected[i])
                    if (!current)
                        continue
                    attr.scale = SCALE
                    IconsSystem.getMatrix(current)
                    attr.transformationMatrix = current.__cacheCenterMatrix
                    attr.iconSampler = i === 0 ? IconsSystem.textureYellow : IconsSystem.textureOrange

                    SpritePass.shader.bindForUse(attr)
                    drawQuad()
                }
            }

            gpu.enable(gpu.DEPTH_TEST)
        }

    }


}