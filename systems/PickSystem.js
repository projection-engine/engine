import System from "../basic/System"
import * as shaderCode from "../shaders/PICK.glsl"
import ShaderInstance from "../instances/ShaderInstance"
import FramebufferInstance from "../instances/FramebufferInstance"
import {mat4} from "gl-matrix"
import MeshInstance from "../instances/MeshInstance"
import COMPONENTS from "../templates/COMPONENTS"


export default class PickSystem extends System {
    constructor(gpu) {
        super()
        this.gpu = gpu

        this.frameBuffer = new FramebufferInstance(gpu, 1, 1)
        this.frameBuffer
            .texture({attachment: 0, linear: true, repeat: true, storage: false, precision: this.gpu.RGBA, format: this.gpu.RGBA, type: this.gpu.UNSIGNED_BYTE})
            .depthTest(this.gpu.DEPTH_COMPONENT16)


        this.shader = new ShaderInstance(shaderCode.vertex, shaderCode.fragment, gpu)
        this.shaderSameSize = new ShaderInstance(shaderCode.sameSizeVertex, shaderCode.fragment, gpu)

        this.mesh = new MeshInstance({
            gpu,
            vertices: [-1, -1, 1, -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1, -1, 1, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 1, -1, -1, 1, -1, -1, 1, -1, 1, -1, 1, 1, -1, 1, 1, -1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1, 1, -1],
            indices: [0, 3, 9, 0, 9, 6, 8, 10, 21, 8, 21, 19, 20, 23, 17, 20, 17, 14, 13, 15, 4, 13, 4, 2, 7, 18, 12, 7, 12, 1, 22, 11, 5, 22, 5, 16]
        })
    }

    readBlock(depthFBO, start, end){
        const s = performance.now()
        const w = Math.round(Math.abs(start.x - end.x))
        const h = Math.round(Math.abs(start.y - end.y))

        this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, depthFBO.FBO)
        let dd = new Float32Array(w * h * 4)

        this.gpu.readPixels(
            end.x > start.x ? start.x : end.x,
            end.y > start.y ? start.y : end.y,
            w,
            h,
            this.gpu.RGBA,
            this.gpu.FLOAT,
            dd
        )
        this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, null)

        return dd
    }
    depthPick(depthFBO, coords) {
        this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, depthFBO.FBO)
        let dd = new Float32Array(4)
        this.gpu.readPixels(
            coords.x,
            coords.y,
            1,
            1,
            this.gpu.RGBA,
            this.gpu.FLOAT,
            dd
        )
        this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, null)
        return dd
    }
    pickElement(drawCallback, pickCoords, camera, sameSize, isOrtho) {

        this.shader.use()
        this.frameBuffer.startMapping()

        const pickerProjection = this._getProjection(pickCoords, camera, isOrtho)
        drawCallback(sameSize ? this.shaderSameSize : this.shader, pickerProjection)
        let data = new Uint8Array(4)
        this.gpu.readPixels(
            0,
            0,
            1,
            1,
            this.gpu.RGBA,
            this.gpu.UNSIGNED_BYTE,
            data
        )

        this.frameBuffer.stopMapping()
        return data[0] + data[1] + data[2]
    }

    _getProjection({x, y}, camera, isOrtho) {
        let m = mat4.create()


        if (isOrtho)
            m = camera.projectionMatrix
        else {
            const aspect = camera.aspectRatio
            let top = Math.tan(camera.fov / 2) * camera.zNear,
                bottom = -top,
                left = aspect * bottom,
                right = aspect * top

            const width = Math.abs(right - left)
            const height = Math.abs(top - bottom)

            const pixelX = x * this.gpu.canvas.width / this.gpu.canvas.clientWidth
            const pixelY = this.gpu.canvas.height - y * this.gpu.canvas.height / this.gpu.canvas.clientHeight - 1

            const subLeft = left + pixelX * width / this.gpu.canvas.width
            const subBottom = bottom + pixelY * height / this.gpu.canvas.height
            const subWidth = 1 / this.gpu.canvas.width
            const subHeight = 1 / this.gpu.canvas.height

            mat4.frustum(
                m,
                subLeft,
                subLeft + subWidth,
                subBottom,
                subBottom + subHeight,
                camera.zNear,
                camera.zFar)
        }


        return m

    }

    static drawMesh(mesh, instance, viewMatrix, projectionMatrix, transformMatrix, shader, gpu) {
        shader.bindForUse({
            uID: [...instance.components[COMPONENTS.PICK].pickID, 1],
            projectionMatrix,
            transformMatrix,
            viewMatrix
        })

        gpu.bindVertexArray(mesh.VAO)
        gpu.bindBuffer(gpu.ELEMENT_ARRAY_BUFFER, mesh.indexVBO)
        mesh.vertexVBO.enable()

        gpu.drawElements(gpu.TRIANGLES, mesh.verticesQuantity, gpu.UNSIGNED_INT, 0)
        gpu.bindVertexArray(null)
        gpu.bindBuffer(gpu.ELEMENT_ARRAY_BUFFER, null)
        mesh.vertexVBO.disable()
    }
}