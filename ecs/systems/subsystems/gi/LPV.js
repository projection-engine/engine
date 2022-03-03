import GIFramebuffer from "../../../../elements/buffer/gi/GIFramebuffer";
import GeometryInjectionShader from "../../../../shaders/classes/gi/GeometryInjectionShader";
import LightInjectionShader from "../../../../shaders/classes/gi/LightInjectionShader";
import LightPropagationShader from "../../../../shaders/classes/gi/LightPropagationShader";

export default class LightPropagationVolumes {
    size =  2048;
    framebufferSize =  32;

    constructor(gpu){
        this.gpu = gpu
        this.injectionFramebuffer =  new GIFramebuffer(this.framebufferSize, gpu)
        this.geometryInjectionFramebuffer =   new GIFramebuffer(this.framebufferSize, gpu)
        this.propagationFramebuffer =   new GIFramebuffer(this.framebufferSize, gpu)
        this.accumulatedBuffer =   new GIFramebuffer(this.framebufferSize, gpu)


        this.createInjectionDrawCall()
        this.createPropagationDrawCall()
        this.createGeometryInjectDrawCall()
    }
    createInjectionPointCloud (){
        const positionData = new Float32Array(this.size * this.size * 2);

        let positionIndex = 0;
        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                positionData[positionIndex++] = x;
                positionData[positionIndex++] = y;
            }
        }

        return positionData;
    }

    createInjectionDrawCall() {
        const s = new LightInjectionShader(this.gpu)
        this.injectionProgram = s.program
        const c = createD(this.createInjectionPointCloud(), this.gpu)
        this.injectionPointPositionsLength = c.dataLength
        this.injection = c
    }

    createGeometryInjectDrawCall() {
        const s = new GeometryInjectionShader(this.gpu)
        this.geometryProgram = s.program
        const c = createD(this.createInjectionPointCloud(), this.gpu)
        this.geometryPositionsLength = c.dataLength
        this.geometry = c
    }

    createPropagationDrawCall() {
        const positionData = new Float32Array(this.framebufferSize * this.framebufferSize * this.framebufferSize * 2);
        let positionIndex = 0;
        for(let x = 0; x < this.framebufferSize * this.framebufferSize; x++) {
            for(let y = 0; y < this.framebufferSize; y++) {
                positionData[positionIndex++] = x;
                positionData[positionIndex++] = y;
            }
        }
        const s = new LightPropagationShader(this.gpu)
        this.program = s.program
        const c = createD(positionData, this.gpu)
        this.pointPositionsLength = c.dataLength
        this.propagation = c
        this.ready = true
    }

    lightInjection(_RSMFrameBuffer) {
        this.injectionFinished = false;

        if(_RSMFrameBuffer) {
            const rsmFlux = _RSMFrameBuffer.rsmFluxTexture;
            const rsmPositions = _RSMFrameBuffer.rsmWorldPositionTexture;
            const rsmNormals = _RSMFrameBuffer.rsmNormalTexture;


            if (this.injectionProgram && this.injectionFramebuffer) {
                this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, this.injectionFramebuffer.frameBufferObject)
                this.gpu.viewport(0,0, this.framebufferSize ** 2, this.framebufferSize)
                this.gpu.disable(this.gpu.DEPTH_TEST);
                this.gpu.enable(this.gpu.BLEND);
                this.gpu.blendFunc(this.gpu.ONE, this.gpu.ONE);


                if(!this.injectionRsmFluxULocation){
                    this.injectionRsmFluxULocation = this.gpu.getUniformLocation(this.injectionProgram, 'u_rsm_flux')
                    this.injectionRsmWorldULocation = this.gpu.getUniformLocation(this.injectionProgram, 'u_rsm_world_positions')
                    this.injectionRsmNormalsULocation = this.gpu.getUniformLocation(this.injectionProgram, 'u_rsm_world_normals')
                    this.injectionRsmSizeULocation = this.gpu.getUniformLocation(this.injectionProgram, 'u_rsm_size')
                    this.injectionGridSizeULocation = this.gpu.getUniformLocation(this.injectionProgram, 'u_grid_size')
                }

                this.gpu.useProgram(this.injectionProgram)

                this.gpu.uniform1i(this.injectionRsmSizeULocation, this.size)
                this.gpu.uniform1i(this.injectionGridSizeULocation, this.framebufferSize)

                bindTexture(0, rsmFlux, this.injectionRsmFluxULocation, this.gpu)
                bindTexture(1, rsmPositions, this.injectionRsmWorldULocation, this.gpu)
                bindTexture(2, rsmNormals, this.injectionRsmNormalsULocation, this.gpu)


                this.gpu.bindVertexArray(this.injection.pointArray)
                this.gpu.enableVertexAttribArray(0)
                this.gpu.bindBuffer(this.gpu.ARRAY_BUFFER, this.injection.pointPositions)
                this.gpu.vertexAttribPointer(0, 2, this.gpu.FLOAT, false, 8, 0)

                this.gpu.drawArrays(this.gpu.POINTS, 0, this.injectionPointPositionsLength/2)

                this.injectionFinished = true;
            }
        }
    }

    geometryInjection(_RSMFrameBuffer, lightDir) {
        this.geometryInjectionFinished = false;

        if(_RSMFrameBuffer) {
            const rsmFlux = _RSMFrameBuffer.rsmFluxTexture;
            const rsmPositions = _RSMFrameBuffer.rsmWorldPositionTexture;
            const rsmNormals = _RSMFrameBuffer.rsmNormalTexture;


            if (this.geometryProgram && this.geometryInjectionFramebuffer && this.injectionFinished) {

                this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, this.geometryInjectionFramebuffer.frameBufferObject)
                this.gpu.viewport(0,0, this.framebufferSize ** 2, this.framebufferSize)
                this.gpu.enable(this.gpu.DEPTH_TEST);
                this.gpu.depthFunc(this.gpu.LEQUAL);
                this.gpu.disable(this.gpu.BLEND);
                this.gpu.clear(this.gpu.COLOR_BUFFER_BIT | this.gpu.DEPTH_BUFFER_BIT | this.gpu.STENCIL_BUFFER_BIT )



                if(!this.geometryRsmFluxULocation){
                    this.geometryRsmFluxULocation = this.gpu.getUniformLocation(this.geometryProgram, 'u_rsm_flux')
                    this.geometryRsmWorldULocation = this.gpu.getUniformLocation(this.geometryProgram, 'u_rsm_world_positions')
                    this.geometryRsmNormalsULocation = this.gpu.getUniformLocation(this.geometryProgram, 'u_rsm_world_normals')
                    this.geometryRsmSizeULocation = this.gpu.getUniformLocation(this.geometryProgram, 'u_rsm_size')
                    this.geometryTexel = this.gpu.getUniformLocation(this.geometryProgram, 'u_texture_size')
                    this.geometryDir = this.gpu.getUniformLocation(this.geometryProgram, 'u_light_direction')
                }


                this.gpu.useProgram(this.geometryProgram)

                this.gpu.uniform3fv(this.geometryDir, lightDir)
                this.gpu.uniform1i(this.geometryTexel, this.framebufferSize)
                this.gpu.uniform1i(this.geometryRsmSizeULocation, this.size)

                bindTexture(0, rsmFlux, this.geometryRsmFluxULocation, this.gpu)
                bindTexture(1, rsmPositions, this.geometryRsmWorldULocation, this.gpu)
                bindTexture(2, rsmNormals, this.geometryRsmNormalsULocation, this.gpu)


                this.gpu.bindVertexArray(this.geometry.pointArray)
                this.gpu.enableVertexAttribArray(0)
                this.gpu.bindBuffer(this.gpu.ARRAY_BUFFER, this.geometry.pointPositions)
                this.gpu.vertexAttribPointer(0, 2, this.gpu.FLOAT, false, 8, 0)

                this.gpu.drawArrays(this.gpu.POINTS, 0, this.geometryPositionsLength/2)

                this.geometryInjectionFinished = true;
            }
        }
    }

    clear() {
        this.gpu.disable(this.gpu.BLEND)
        this.gpu.viewport(0, 0, this.framebufferSize ** 2, this.framebufferSize)

        this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, this.accumulatedBuffer.frameBufferObject)
        this.gpu.clear(this.gpu.COLOR_BUFFER_BIT | this.gpu.DEPTH_BUFFER_BIT | this.gpu.STENCIL_BUFFER_BIT )

        this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, this.injectionFramebuffer.frameBufferObject)
        this.gpu.clear(this.gpu.COLOR_BUFFER_BIT | this.gpu.DEPTH_BUFFER_BIT | this.gpu.STENCIL_BUFFER_BIT )
        this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER,null)

    }

    lightPropagation(_propagationIterations) {

        let LPVS = [ this.injectionFramebuffer, this.propagationFramebuffer ];
        let lpvIndex;

        console.log(_propagationIterations)
        for (let i = 0; i < _propagationIterations; i++) {

            lpvIndex = i & 1;
            var readLPV = LPVS[lpvIndex];
            var nextIterationLPV = LPVS[lpvIndex ^ 1];


            this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, nextIterationLPV.frameBufferObject)
            this.gpu.clear(this.gpu.COLOR_BUFFER_BIT | this.gpu.DEPTH_BUFFER_BIT | this.gpu.STENCIL_BUFFER_BIT )
            this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, null)


            this.lightPropagationIteration(i, readLPV, nextIterationLPV);
        }
    }

    lightPropagationIteration(iteration, readLPV, nextIterationLPV) {

        if (this.ready && this.injectionFinished && this.geometryInjectionFinished) {
            this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, this.accumulatedBuffer.frameBufferObject);
            this.gpu.framebufferTexture2D(
                this.gpu.FRAMEBUFFER,
                this.gpu.COLOR_ATTACHMENT3,
                this.gpu.TEXTURE_2D,
                nextIterationLPV.redTexture,
                0);

            this.gpu.framebufferTexture2D(
                this.gpu.FRAMEBUFFER,
                this.gpu.COLOR_ATTACHMENT4,
                this.gpu.TEXTURE_2D,
                nextIterationLPV.greenTexture,
                0);
            this.gpu.framebufferTexture2D(
                this.gpu.FRAMEBUFFER,
                this.gpu.COLOR_ATTACHMENT5,
                this.gpu.TEXTURE_2D,
                nextIterationLPV.blueTexture,
                0);
            this.gpu.drawBuffers([
                this.gpu.COLOR_ATTACHMENT0,
                this.gpu.COLOR_ATTACHMENT1,
                this.gpu.COLOR_ATTACHMENT2,

                this.gpu.COLOR_ATTACHMENT3,
                this.gpu.COLOR_ATTACHMENT4,
                this.gpu.COLOR_ATTACHMENT5
            ])

            this.gpu.viewport(0,0, this.framebufferSize ** 2, this.framebufferSize)
            this.gpu.disable(this.gpu.DEPTH_TEST);
            this.gpu.enable(this.gpu.BLEND);
            this.gpu.blendFunc(this.gpu.ONE, this.gpu.ONE);

            this.firstIteration = iteration <= 0;


            this.gpu.useProgram(this.program)
            if(!this.gridSizeULocation) {
                this.gridSizeULocation = this.gpu.getUniformLocation(this.program, 'u_grid_size')
                this.redULocation = this.gpu.getUniformLocation(this.program, 'u_red_contribution')
                this.greenULocation = this.gpu.getUniformLocation(this.program, 'u_green_contribution')
                this.blueULocation = this.gpu.getUniformLocation(this.program, 'u_blue_contribution')
                this.redGeometryULocation = this.gpu.getUniformLocation(this.program, 'u_red_geometry_volume')
                this.greenGeometryULocation = this.gpu.getUniformLocation(this.program, 'u_green_geometry_volume')
                this.blueGeometryULocation = this.gpu.getUniformLocation(this.program, 'u_blue_geometry_volume')
                this.firstIterationULocation = this.gpu.getUniformLocation(this.program, 'u_first_iteration')
            }

            this.gpu.uniform1i(this.firstIterationULocation, this.firstIteration)
            this.gpu.uniform1i(this.gridSizeULocation, this.framebufferSize)

            bindTexture(0, readLPV.redTexture, this.redULocation, this.gpu)
            bindTexture(1, readLPV.greenTexture, this.greenULocation, this.gpu)
            bindTexture(2, readLPV.blueTexture, this.blueULocation, this.gpu)

            bindTexture(3, this.geometryInjectionFramebuffer.redTexture, this.redGeometryULocation, this.gpu)
            bindTexture(4, this.geometryInjectionFramebuffer.greenTexture, this.greenGeometryULocation, this.gpu)
            bindTexture(5, this.geometryInjectionFramebuffer.blueTexture, this.blueGeometryULocation, this.gpu)


            this.gpu.bindVertexArray(this.propagation.pointArray)
            this.gpu.enableVertexAttribArray(0)
            this.gpu.bindBuffer(this.gpu.ARRAY_BUFFER, this.propagation.pointPositions)
            this.gpu.vertexAttribPointer(0, 2, this.gpu.FLOAT, false, 8, 0)

            this.gpu.drawArrays(this.gpu.POINTS, 0, this.pointPositionsLength)

        }
    }
}


function bindTexture(index, texture, location, gpu) {
    gpu.activeTexture(gpu.TEXTURE0 + index)
    gpu.bindTexture(gpu.TEXTURE_2D, texture)
    gpu.uniform1i(location, index)
}


function createD(positionData, gpu){
    const pointPositions = gpu.createBuffer();
    gpu.bindBuffer(gpu.ARRAY_BUFFER, pointPositions);
    gpu.bufferData(gpu.ARRAY_BUFFER, positionData, gpu.STATIC_DRAW);

    const pointArray = gpu.createVertexArray()
    gpu.bindVertexArray(pointArray);
    gpu.bindBuffer(gpu.ARRAY_BUFFER, pointPositions);

    gpu.vertexAttribPointer(
        0,
        2,
        gpu.FLOAT,
        false,
        8,
        0
    );

    gpu.enableVertexAttribArray(0);
    gpu.bindVertexArray(null);
    gpu.bindBuffer(gpu.ARRAY_BUFFER, null);

    return {
        dataLength: positionData.length,
        pointArray,
        pointPositions
    }
}