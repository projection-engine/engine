import Shader from "../../../utils/workers/Shader";

import {fragment, vertex} from '../../resources/gi/rsmSampling.glsl'
import {bindTexture} from "../../../utils/misc/utils";


export default class RSMSamplerShader extends Shader{

    constructor(gpu) {
        super(vertex, fragment, gpu);
        this.positionLocation = gpu.getAttribLocation(this.program, 'position')

        this.indirectLightAmountULocation = gpu.getUniformLocation(this.program, 'indirectLightAmount')
        this.sampleRadiusULocation = gpu.getUniformLocation(this.program, 'sampleRadius')
        this.samplesQuantityULocation = gpu.getUniformLocation(this.program, 'samplesQuantity')
        this.samplesTextureSizeULocation = gpu.getUniformLocation(this.program, 'samplesTextureSize')

        this.gNormalTexULocation = gpu.getUniformLocation(this.program, 'gNormalTex')
        this.gWorldPosTexULocation = gpu.getUniformLocation(this.program, 'gWorldPosTex')
        this.rNormalTexULocation = gpu.getUniformLocation(this.program, 'rNormalTex')
        this.rWorldPosTexULocation = gpu.getUniformLocation(this.program, 'rWorldPosTex')
        this.rFluxTexULocation = gpu.getUniformLocation(this.program, 'rFluxTex')
        this.samplesTexULocation = gpu.getUniformLocation(this.program, 'samplesTex')

        this.lightProjectionULocation = gpu.getUniformLocation(this.program, 'lightProjection')
        this.lightViewULocation = gpu.getUniformLocation(this.program, 'lightView')

        this.rsmResolutionULocation = gpu.getUniformLocation(this.program, 'rsmResolution')

    }

    bindUniforms(quantityIndirect, sRadius, sQuantity, sTexel, gNormal, gWorld, rNormal, rWorld, rFlux, samplesTexture, projection, view, rsmResolution){
        this.gpu.uniform1f(this.indirectLightAmountULocation, quantityIndirect)
        this.gpu.uniform1f(this.sampleRadiusULocation, sRadius)
        this.gpu.uniform1f(this.samplesQuantityULocation, sQuantity)
        this.gpu.uniform1f(this.samplesTextureSizeULocation, sTexel)
        this.gpu.uniform1f(this.rsmResolutionULocation, rsmResolution)


        this.gpu.uniformMatrix4fv(this.lightProjectionULocation, false, projection)
        this.gpu.uniformMatrix4fv(this.lightViewULocation, false, view)

        bindTexture(0, gNormal, this.gNormalTexULocation, this.gpu)
        bindTexture(1, gWorld, this.gWorldPosTexULocation, this.gpu)
        bindTexture(2, rNormal, this.rNormalTexULocation, this.gpu)
        bindTexture(3, rWorld, this.rWorldPosTexULocation, this.gpu)
        bindTexture(4, rFlux, this.rFluxTexULocation, this.gpu)
        bindTexture(5, samplesTexture, this.samplesTexULocation, this.gpu)

    }
}