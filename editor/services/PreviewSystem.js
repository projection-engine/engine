import {mat4} from "gl-matrix"
import Mesh from "../../lib/instances/Mesh"
import Material from "../../lib/instances/Material"
import MaterialAPI from "../../lib/apis/rendering/MaterialAPI";
import GPUResources from "../../GPUResources";
import STATIC_MESHES from "../../static/resources/STATIC_MESHES";
import STATIC_FRAMEBUFFERS from "../../static/resources/STATIC_FRAMEBUFFERS";
import FALLBACK_MATERIAL from "../../templates/materials/simple/FALLBACK_MATERIAL";
import Framebuffer from "../../lib/instances/Framebuffer";
import GPUController from "../../GPUController";


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
        PreviewSystem.frameBuffer = GPUController.allocateFramebuffer(STATIC_FRAMEBUFFERS.EDITOR.PREVIEW, 300, 300).texture()
    }

    static execute(materialMesh, meshEntity) {
        let response

        PreviewSystem.frameBuffer.startMapping()
        if (meshEntity && materialMesh instanceof Mesh) {
            const maxX = materialMesh.maxBoundingBox[0] - materialMesh.minBoundingBox[0],
                maxY = materialMesh.maxBoundingBox[1] - materialMesh.minBoundingBox[1],
                maxZ = materialMesh.maxBoundingBox[2] - materialMesh.minBoundingBox[2]
            const radius = Math.max(maxX, maxY, maxZ)
            const cam = getCameraData(0, RADIAN_90, radius + 2, meshEntity.translation)
            const transformMatrix = meshEntity.matrix
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

            MaterialAPI.drawMesh(
                undefined,
                materialMesh,
                GPUResources.materials.get(FALLBACK_MATERIAL),
                undefined,
                {
                    cameraVec: cam[1],
                    viewMatrix: cam[0],
                    projectionMatrix: PreviewSystem.projection,
                    transformMatrix,

                    normalMatrix: PreviewSystem.identity,
                    directionalLightsQuantity: 0,
                    directionalLightsData: [],
                    dirLightPOV: [],
                    lightQuantity: 2,
                    pointLightData: pointLightData,
                    useCubeMapShader: true
                })
        } else if (materialMesh instanceof Material) {
            const [viewMatrix, cameraVec] = PreviewSystem.cameraData
            MaterialAPI.drawMesh(
                undefined,
                GPUResources.meshes.get(STATIC_MESHES.PRODUCTION.SPHERE),
                materialMesh,
                undefined,
                {
                    cameraVec,
                    viewMatrix,
                    projectionMatrix: PreviewSystem.projection,
                    transformMatrix: PreviewSystem.identity,
                    normalMatrix: PreviewSystem.identity,
                    directionalLightsQuantity: 0,
                    directionalLightsData: [],
                    dirLightPOV: [],
                    lightQuantity: 2,
                    pointLightData: PreviewSystem.pointLightData,

                    useCubeMapShader: true
                })
        }
        PreviewSystem.frameBuffer.stopMapping()

        response = Framebuffer.toImage(PreviewSystem.frameBuffer.FBO)

        return response
    }
}

