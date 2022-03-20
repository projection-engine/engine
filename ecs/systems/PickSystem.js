import System from "../basic/System";
import * as shaderCode from "../../shaders/misc/picker.glsl";
import Shader from "../../utils/workers/Shader";
import FramebufferInstance from "../../instances/FramebufferInstance";
import {mat4} from "gl-matrix";

export default class PickSystem extends System {
    constructor(gpu) {
        super([]);
        this.gpu = gpu

        this.frameBuffer = new FramebufferInstance(gpu, 1, 1)
        this.frameBuffer
            .texture(1, 1, 0, this.gpu.RGBA, this.gpu.RGBA, this.gpu.UNSIGNED_BYTE, false, true, true)
            .depthTest(this.gpu.DEPTH_COMPONENT16)
        this.shader = new Shader(shaderCode.vertex, shaderCode.fragment, gpu)
    }

    execute(options, systems, {meshes, meshSources}) {
        super.execute()
        const {
            setSelected,
            currentCoords,
            clicked,
            camera,
            setClicked
        } = options

        if (clicked && typeof currentCoords === "object") {
            setClicked(false)

            const index = this.pickElement((shader, proj) => {
                for (let m = 0; m < meshes.length; m++) {
                    const currentInstance = meshes[m]
                    const mesh = meshSources[currentInstance.components.MeshComponent.meshID]

                    if (mesh !== undefined) {
                        const t = currentInstance.components.TransformComponent
                        this._drawMesh(mesh, currentInstance, camera.viewMatrix, proj, t.transformationMatrix)
                    }
                }
            }, currentCoords, camera)

            if (index > 0)
                setSelected([meshes.find(e => e.components.PickComponent.pickID[0] * 255 === index)?.id])

        }

    }

    pickElement(drawCallback, pickCoords, camera) {
        this.shader.use()
        this.frameBuffer.startMapping()

        const pickerProjection = this._getProjection(pickCoords, camera)
        drawCallback(this.shader, pickerProjection)
        let data = new Uint8Array(4);
        this.gpu.readPixels(
            0,
            0,
            1,
            1,
            this.gpu.RGBA,
            this.gpu.UNSIGNED_BYTE,
            data
        );

        this.frameBuffer.stopMapping();
        return data[0] + data[1] + data[2];
    }

    _getProjection({x, y}, camera) {

        const aspect = camera.aspectRatio
        let top = Math.tan(camera.fov / 2) * camera.zNear,
            bottom = -top,
            left = aspect * bottom,
            right = aspect * top

        const width = Math.abs(right - left);
        const height = Math.abs(top - bottom);

        const pixelX = x * this.gpu.canvas.width / this.gpu.canvas.clientWidth;

        const pixelY = this.gpu.canvas.height - y * this.gpu.canvas.height / this.gpu.canvas.clientHeight - 1;

        const subLeft = left + pixelX * width / this.gpu.canvas.width;
        const subBottom = bottom + pixelY * height / this.gpu.canvas.height;
        const subWidth = 1 / this.gpu.canvas.width;
        const subHeight = 1 / this.gpu.canvas.height;

        let m = mat4.create()

        mat4.frustum(
            m,
            subLeft,
            subLeft + subWidth,
            subBottom,
            subBottom + subHeight,
            camera.zNear,
            camera.zFar);

        return m
    }

    _drawMesh(mesh, instance, viewMatrix, projectionMatrix, transformMatrix) {
        this.shader.bindForUse({
            uID: [...instance.components.PickComponent.pickID, 1],
            projectionMatrix,
            transformMatrix,
            viewMatrix
        })


        this.gpu.bindVertexArray(mesh.VAO)
        this.gpu.bindBuffer(this.gpu.ELEMENT_ARRAY_BUFFER, mesh.indexVBO)
        mesh.vertexVBO.enable()

        this.gpu.drawElements(this.gpu.TRIANGLES, mesh.verticesQuantity, this.gpu.UNSIGNED_INT, 0)
        this.gpu.bindVertexArray(null)
        this.gpu.bindBuffer(this.gpu.ELEMENT_ARRAY_BUFFER, null)
        mesh.vertexVBO.disable()
    }
}