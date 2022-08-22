import FramebufferInstance from "../../production/libs/instances/FramebufferInstance"
import {mat4} from "gl-matrix"
import MeshInstance from "../../production/libs/instances/MeshInstance"
import COMPONENTS from "../../production/data/COMPONENTS"
import MaterialInstance from "../../production/libs/instances/MaterialInstance"
import MaterialRenderer from "../../production/services/MaterialRenderer";
import RendererController from "../../production/RendererController";
import EditorRenderer from "../EditorRenderer";
import BundlerAPI from "../../production/libs/apis/BundlerAPI";


function getCameraData(pitch, yaw, radius, centerOn) {
    const position = []
    const cosPitch = Math.cos(pitch)
    position[0] = radius * cosPitch * Math.cos(yaw) + centerOn[0]
    position[1] = radius * Math.sin(pitch) + centerOn[1]
    position[2] = radius * cosPitch * Math.sin(yaw) + centerOn[2]
    return [mat4.lookAt([], position, centerOn, [0, 1, 0]), position]
}

const RADIAN_60 = 1.0472, RADIAN_90 = 1.57
export default class PreviewSystem {
    identity = mat4.create()

    constructor() {
        this.frameBuffer = new FramebufferInstance(300, 300)
            .texture({precision: window.gpu.RGBA32F, format: window.gpu.RGBA, type: window.gpu.FLOAT})

        this.cameraData = getCameraData(0, RADIAN_90, 2.5, [0, 0, 0])
        this.projection = mat4.perspective([], RADIAN_60, 1, .1, 10000)
        this.pointLightData = [
            [
                0, 0, 10, 0,
                1, 1, 1, 0,
                .5, 0, 0, 0,
                100, .1, 0, 0
            ],
            [
                0, 0, -10, 0,
                1, 1, 1, 0,
                .5, 0, 0, 0,
                100, .1, 0, 0
            ]
        ]
    }

    execute(data, materialMesh, meshEntity) {
        const {elapsed} = RendererController.params
        let response
        this.frameBuffer.startMapping()


        if (meshEntity && materialMesh instanceof MeshInstance) {
            const maxX = materialMesh.maxBoundingBox[0] - materialMesh.minBoundingBox[0],
                maxY = materialMesh.maxBoundingBox[1] - materialMesh.minBoundingBox[1],
                maxZ = materialMesh.maxBoundingBox[2] - materialMesh.minBoundingBox[2]
            const radius = Math.max(maxX, maxY, maxZ)
            const cam = getCameraData(0, RADIAN_90, radius + 2, meshEntity.components[COMPONENTS.TRANSFORM].translation)
            const transformMatrix = meshEntity.components[COMPONENTS.TRANSFORM].transformationMatrix
            const pointLightData = [[
                0, meshEntity.components[COMPONENTS.TRANSFORM].translation[1] / 2, radius * 10, 0,
                1, 1, 1, 0,
                .5, 0, 0, 0,
                100, .1, 0, 0
            ],
                [
                    0, meshEntity.components[COMPONENTS.TRANSFORM].translation[1] / 2, -radius * 10, 0,
                    1, 1, 1, 0,
                    .5, 0, 0, 0,
                    100, .1, 0, 0
                ]]

            MaterialRenderer.drawMesh({
                mesh: materialMesh,
                camPosition: cam[1],
                viewMatrix: cam[0],
                projectionMatrix: this.projection,
                transformMatrix,
                material: RendererController.fallbackMaterial,
                normalMatrix: this.identity,
                directionalLightsQuantity: 0,
                directionalLightsData: [],
                dirLightPOV: [],
                pointLightsQuantity: 2,
                pointLightData: pointLightData,
                materialComponent: {},
                elapsed,
                ambient: {},
                useCubeMapShader: true
            })
            materialMesh.finish()
        } else if (materialMesh instanceof MaterialInstance) {
            const [viewMatrix, camPosition] = this.cameraData
            MaterialRenderer.drawMesh({
                mesh: EditorRenderer.sphereMesh,
                camPosition,
                viewMatrix,
                projectionMatrix: this.projection,
                transformMatrix: this.identity,
                material: materialMesh,
                normalMatrix: this.identity,
                directionalLightsQuantity: 0,
                directionalLightsData: [],
                dirLightPOV: [],
                pointLightsQuantity: 2,
                pointLightData: this.pointLightData,
                materialComponent: {},
                elapsed,
                ambient: {},
                useCubeMapShader: true
            })
        }
        this.frameBuffer.stopMapping()
        response = BundlerAPI.framebufferToImage(this.frameBuffer.FBO)
        EditorRenderer.sphereMesh.finish()
        window.gpu.bindVertexArray(null)
        return response
    }
}

