import Component from "../basic/Component";
import {mat4} from "gl-matrix";

export default class CubeMapComponent extends Component{

    _position = [0,0,0]
    _resolution = 128
    _transformationMatrix = Array.from(mat4.create())
    cubemap

    constructor(id, resolution, position) {
        super(id, CubeMapComponent.constructor.name);
        if(resolution)
            this._resolution = resolution
        if(position)
            this.position = position
    }


    compile(gpu, renderScene){
        // const temporaryGBufferShader = new DeferredShader(gpu)
        // const temporaryGBuffer = new GBuffer(gpu)
        // const meshShader = new MeshShader(gpu)
        //
        // meshShader.use()
        // temporaryGBuffer.gpu.clearDepth(1);
        // temporaryGBuffer.startMapping()
        //
        // for (let m = 0; m < filtered.length; m++) {
        //     const meshIndex = filteredEntities.meshSources[filtered[m].components.MeshComponent.meshID]
        //     const mesh = meshes[meshIndex]
        //     const meshInstance = filtered[m]
        //     if (mesh !== undefined) {
        //         const t = meshInstance.components.TransformComponent
        //         const mat =meshInstance.components.MaterialComponent?.materialID ? materials[filteredEntities.materials[meshInstance.components.MaterialComponent.materialID]] : undefined
        //
        //         MeshSystem.drawMesh(
        //             meshShader,
        //             gpu,
        //             mesh,
        //             camera.position,
        //             camera.viewMatrix,
        //             camera.projectionMatrix,
        //             t.transformationMatrix,
        //             mat ? mat : this.fallbackMaterial,
        //             meshInstance.components.MeshComponent.normalMatrix,
        //             selectedElement === meshInstance.id
        //         )
        //     }
        // }
        // temporaryGBuffer.stopMapping()
        //
        //
        // this.cubeMap = new CubeMap(_, gpu, this.resolution, (c) => {

        // })
    }

    get position () {
        return this._position
    }
    set position (data) {
        this._position = data

        this._transformationMatrix[12] = data[0]
        this._transformationMatrix[13] = data[1]
        this._transformationMatrix[14] = data[2]
    }
    get transformationMatrix () {
        return this._transformationMatrix
    }

}