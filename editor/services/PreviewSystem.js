import {mat4} from "gl-matrix"
import MeshInstance from "../../production/controllers/instances/MeshInstance"
import MaterialInstance from "../../production/controllers/instances/MaterialInstance"
import MaterialController from "../../production/controllers/MaterialController";
import RendererController from "../../production/controllers/RendererController";
import BundlerAPI from "../../production/libs/BundlerAPI";
import GPU from "../../production/controllers/GPU";
import STATIC_MESHES from "../../static/STATIC_MESHES";
import STATIC_FRAMEBUFFERS from "../../static/STATIC_FRAMEBUFFERS";


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
    static identity = mat4.create()
    static frameBuffer
    static cameraData = getCameraData(0, RADIAN_90, 2.5, [0, 0, 0])
    static projection = mat4.perspective([], RADIAN_60, 1, .1, 10000)
    static pointLightData = [
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

    static initialize() {
        PreviewSystem.frameBuffer = GPU.allocateFramebuffer(STATIC_FRAMEBUFFERS.EDITOR.PREVIEW, 300, 300)
            .texture({precision: window.gpu.RGBA32F, format: window.gpu.RGBA, type: window.gpu.FLOAT})
    }

    static execute(materialMesh, meshEntity) {
        const {elapsed} = RendererController.params
        let response
        PreviewSystem.frameBuffer.startMapping()


        if (meshEntity && materialMesh instanceof MeshInstance) {
            const maxX = materialMesh.maxBoundingBox[0] - materialMesh.minBoundingBox[0],
                maxY = materialMesh.maxBoundingBox[1] - materialMesh.minBoundingBox[1],
                maxZ = materialMesh.maxBoundingBox[2] - materialMesh.minBoundingBox[2]
            const radius = Math.max(maxX, maxY, maxZ)
            const cam = getCameraData(0, RADIAN_90, radius + 2, meshEntity.translation)
            const transformMatrix = meshEntity.transformationMatrix
            const pointLightData = [[
                0, meshEntity.translation[1] / 2, radius * 10, 0,
                1, 1, 1, 0,
                .5, 0, 0, 0,
                100, .1, 0, 0
            ],
                [
                    0, meshEntity.translation[1] / 2, -radius * 10, 0,
                    1, 1, 1, 0,
                    .5, 0, 0, 0,
                    100, .1, 0, 0
                ]]

            MaterialController.drawMesh({
                mesh: materialMesh,
                camPosition: cam[1],
                viewMatrix: cam[0],
                projectionMatrix: PreviewSystem.projection,
                transformMatrix,
                material: RendererController.fallbackMaterial,
                normalMatrix: PreviewSystem.identity,
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
        } else if (materialMesh instanceof MaterialInstance) {
            const [viewMatrix, camPosition] = PreviewSystem.cameraData
            MaterialController.drawMesh({
                mesh: GPU.meshes.get(STATIC_MESHES.SPHERE),
                camPosition,
                viewMatrix,
                projectionMatrix: PreviewSystem.projection,
                transformMatrix: PreviewSystem.identity,
                material: materialMesh,
                normalMatrix: PreviewSystem.identity,
                directionalLightsQuantity: 0,
                directionalLightsData: [],
                dirLightPOV: [],
                pointLightsQuantity: 2,
                pointLightData: PreviewSystem.pointLightData,
                materialComponent: {},
                elapsed,
                ambient: {},
                useCubeMapShader: true
            })
        }
        PreviewSystem.frameBuffer.stopMapping()
        response = BundlerAPI.framebufferToImage(PreviewSystem.frameBuffer.FBO)
        gpu.bindVertexArray(null)
        return response
    }
}

