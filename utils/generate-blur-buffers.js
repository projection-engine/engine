import FramebufferInstance from "../instances/FramebufferInstance"

export default function generateBlurBuffers(quantity, w, h, downscaleStrength=2){
    const blurBuffers = [],
        upSampledBuffers = []

    let pW = w, pH = h
    for (let i = 0; i < quantity; i++) {
        const [wW, hH] = [pW / downscaleStrength, pH / downscaleStrength]
        const wBlurFrameBuffer = new FramebufferInstance( wW, hH).texture({linear: true})
        const hBlurFrameBuffer = new FramebufferInstance( wW, hH).texture({linear: true})
        blurBuffers.push({
            height: hBlurFrameBuffer,
            width: wBlurFrameBuffer
        })
        pW = wW
        pH = hH
    }

    for (let i = 0; i < quantity; i++) {
        const [wW, hH] = [pW * downscaleStrength, pH * downscaleStrength]
        const b = new FramebufferInstance(wW, hH).texture({linear: true})
        upSampledBuffers.push(b)
        pW = wW
        pH = hH
    }
    return [blurBuffers, upSampledBuffers]
}