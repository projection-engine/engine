import System from "../../basic/System";
import pointLightIcon from "../../../../../static/icons/point_light.png";
import directionalLightIcon from "../../../../../static/icons/directional_light.png";
import spotLightIcon from "../../../../../static/icons/spot_light.png";
import cubeMapIcon from "../../../../../static/icons/cubemap.png";
import TextureInstance from "../../../instances/TextureInstance";
import BillboardsInstance from "../../../instances/BillboardsInstance";
import * as shaderCode from '../../../shaders/misc/gizmo.glsl'
import Shader from "../../../utils/workers/Shader";
import COMPONENTS from "../../../templates/COMPONENTS";
import MeshInstance from "../../../instances/MeshInstance";
import camera from "../../../../../static/assets/Camera.json";

export default class BillboardSystem extends System {
    _ready = false

    constructor(gpu) {
        super([]);
        this.gpu = gpu
        this.billboardRenderer = new BillboardsInstance(gpu)
        this.cameraShader = new Shader(shaderCode.shadedVertex, shaderCode.shadedFragment, gpu)
        this.cameraMesh = new MeshInstance({
            gpu,
            vertices: camera.vertices,
            indices: camera.indices,
            normals: camera.normals,
            uvs: [],
            tangents: [],
        })
    }

    async initializeTextures() {
        this.pointLightTexture = new TextureInstance(pointLightIcon, false, this.gpu)
        this.directionalLightTexture = new TextureInstance(directionalLightIcon, false, this.gpu)

        this.spotLightTexture = new TextureInstance(spotLightIcon, false, this.gpu)
        this.cubemapTexture = new TextureInstance(cubeMapIcon, false, this.gpu)

        this._ready = true
    }

    _map(billboards) {
        let point = [], directional = [], spot = [], cubemaps = []


        for (let i = 0; i < billboards.length; i++) {
            if (billboards[i].components.PointLightComponent)
                point.push(Array.from(billboards[i].components.TransformComponent.transformationMatrix))
            else if (billboards[i].components.DirectionalLightComponent)
                directional.push(Array.from(billboards[i].components.DirectionalLightComponent?.transformationMatrix))
            else if (billboards[i].components.SpotLightComponent)
                spot.push(Array.from(billboards[i].components.SpotLightComponent.transformationMatrix))
            else if (billboards[i].components.CubeMapComponent)
                cubemaps.push(Array.from(billboards[i].components.TransformComponent.transformationMatrix))
        }

        return {
            pointLights: point,
            directionalLights: directional,
            spotLights: spot,
            cubemaps: cubemaps
        }
    }

    execute(pointLights, directionalLights, spotLights, cubeMaps, camera, iconsVisibility, skylight, cameras) {
        super.execute()
        if (this._ready) {
            const billboards = [...pointLights, ...directionalLights, ...spotLights, ...cubeMaps]
            if (iconsVisibility) {
                const mapped = this._map(billboards)
                this.billboardRenderer.draw(mapped.pointLights, this.pointLightTexture.texture, camera)
                this.billboardRenderer.draw(mapped.directionalLights, this.directionalLightTexture.texture, camera)
                if (skylight)
                    this.billboardRenderer.draw([skylight.transformationMatrix], this.directionalLightTexture.texture, camera)
                this.billboardRenderer.draw(mapped.spotLights, this.spotLightTexture.texture, camera)
                this.billboardRenderer.draw(mapped.cubemaps, this.cubemapTexture.texture, camera)

                this.cameraShader.use()
                this.gpu.bindVertexArray(this.cameraMesh.VAO)
                this.gpu.bindBuffer(this.gpu.ELEMENT_ARRAY_BUFFER, this.cameraMesh.indexVBO)
                this.cameraMesh.vertexVBO.enable()
                this.cameraMesh.normalVBO.enable()

                for (let i = 0; i < cameras.length; i++) {

                    this.cameraShader.bindForUse({
                        viewMatrix: camera.viewMatrix,
                        transformMatrix: cameras[i].components[COMPONENTS.TRANSFORM].transformationMatrix,
                        projectionMatrix: camera.projectionMatrix,
                        axis: 3,
                        selectedAxis: 0
                    })
                    this.gpu.drawElements(this.gpu.TRIANGLES, this.cameraMesh.verticesQuantity, this.gpu.UNSIGNED_INT, 0)
                }
                this.cameraMesh.vertexVBO.disable()
                this.cameraMesh.normalVBO.disable()
            }
        }
    }

}