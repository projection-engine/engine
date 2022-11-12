import Engine from "../../Engine";
import GPU from "../../GPU";
import STATIC_MESHES from "../../static/resources/STATIC_MESHES";

import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";
import SelectionStore from "../../../../src/stores/SelectionStore";
import STATIC_TEXTURES from "../../static/resources/STATIC_TEXTURES";
import SpritePass from "../../runtime/rendering/SpritePass";
import QueryAPI from "../../lib/utils/QueryAPI";
import {mat4} from "gl-matrix";
import GPUAPI from "../../lib/rendering/GPUAPI";
import CollisionVisualizationSystem from "./CollisionVisualizationSystem";
import CameraAPI from "../../lib/utils/CameraAPI";
import TransformationAPI from "../../lib/math/TransformationAPI";
import Wrapper from "../Wrapper";

const SCALE = (new Array(3)).fill(.25)
const EMPTY_MATRIX = mat4.create()
const CAMERA_SCALE = [0.8578777313232422, 0.5202516317367554, 0.2847398519515991]
export default class IconsSystem {
    static cameraMesh
    static shader
    static textureOrange
    static textureYellow

    static initialize() {
        IconsSystem.cameraMesh = GPU.meshes.get(STATIC_MESHES.EDITOR.CAMERA)
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
            if (translation) {
                m[12] += translation[0]
                m[13] += translation[1]
                m[14] += translation[2]
            }

            entity.__cacheCenterMatrix = m
        }
    }

    static execute(selected) {
        const cameras = Engine.data.cameras
        const attr = {
            translation: [0, 0, 0],
            sameSize: false,
            highlight: false
        }

        for (let i = 0; i < cameras.length; i++) {
            const current = cameras[i]
            if (CameraAPI.trackingEntity === current)
                continue
            if (!current.active)
                continue
            attr.highlight = Wrapper.selectionMap.get(current.id) != null
            if (current.__changedBuffer[1] === 1 || !current.cacheIconMatrix)
                current.cacheIconMatrix = TransformationAPI.mat4.fromRotationTranslationScale([], current._rotationQuat, current._translation, CAMERA_SCALE)

            attr.transformMatrix = current.cacheIconMatrix
            IconsSystem.shader.bindForUse(attr)
            IconsSystem.cameraMesh.draw()
        }

        gpu.clear(gpu.DEPTH_BUFFER_BIT)
        const size = selected.length
        if (size > 0) {
            attr.attributes = [1, 1]
            for (let i = 0; i < size; i++) {
                const current = selected[i]
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
    }

}