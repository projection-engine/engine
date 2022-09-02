import RendererController from "../../production/controllers/RendererController";
import CameraAPI from "../../production/libs/CameraAPI";
import GPU from "../../production/controllers/GPU";
import STATIC_MESHES from "../../static/STATIC_MESHES";
import EditorRenderer from "../EditorRenderer";
import STATIC_SHADERS from "../../static/STATIC_SHADERS";


export default class IconsSystem {
    static cameraMesh
    static cube
    static shader

    static initialize() {
        IconsSystem.shader = GPU.shaders.get(STATIC_SHADERS.PRODUCTION.UNSHADED)
        IconsSystem.cameraMesh = GPU.meshes.get(STATIC_MESHES.CAMERA)
        IconsSystem.cube = GPU.meshes.get(STATIC_MESHES.CUBE)
    }


    static execute() {
        const {cameras} = RendererController.data
        const {
            iconsVisibility,
            selected
        } = RendererController.params

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
                attr.selectedAxis = selected.includes(cameras[i].id) ? 3 : 0
                attr.transformMatrix = cameras[i].transformationMatrix

                IconsSystem.shader.bindForUse(attr)
                IconsSystem.cameraMesh.draw()
            }

            gpu.disable(gpu.DEPTH_TEST)

            attr.translation = EditorRenderer.cursor.translation
            attr.sameSize = true
            attr.transformMatrix = EditorRenderer.cursor.matrix
            attr.axis = -1

            IconsSystem.shader.bindForUse(attr)
            IconsSystem.cube.draw()
            gpu.enable(gpu.DEPTH_TEST)
        }

    }


}