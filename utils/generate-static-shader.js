import {v4} from "uuid";

function generateStaticShader(length,uniforms){
    let bindCode = "", currentSamplerIndex = 0
    const uniformMap = {}
    for (let v = 0; v < length; v++) {
        const current = uniforms[v]
        if (current.arraySize !== undefined) {
            if (current.uLocations)
                for (let i = 0; i < current.uLocations.length; i++) {
                    const uniformID = v4()

                    uniformMap[uniformID] = current.uLocations[i]
                    const uLocation = `uniformMap["${uniformID}"]`
                    let data
                    if (current.parent)
                        data = `data[${i}].${current.name}`
                    else
                        data = `data.${current.parent !== undefined ? current.parent : current.name}`

                    if (current.type === "samplerCube" || current.type === "sampler2D") {
                        bindCode += `
                                    gpu.activeTexture(${gpu.TEXTURE0 + currentSamplerIndex})
                                    gpu.bindTexture(gpu.${current.type === "sampler2D" ? "TEXTURE_2D" : "TEXTURE_CUBE_MAP"}, ${data})
                                    gpu.uniform1i(${uLocation}, ${currentSamplerIndex})
                                `
                        currentSamplerIndex++
                    } else {
                        let middle = ""
                        if (current.type.includes("mat"))
                            middle = `false, `

                        bindCode += `
                                if (${data} != null)
                                    gpu.${TYPES[current.type]}(${uLocation}, ${middle} ${data})\n`
                    }
                }
        } else {
            const uniformID = v4()
            uniformMap[uniformID] = current.uLocation
            let middle = ""
            if (current.type.includes("mat"))
                middle = `false, `
            const data = `data.${current.parent !== undefined ? `${current.parent}.${current.name}` : current.name}`
            if (current.type === "samplerCube" || current.type === "sampler2D") {

                bindCode += `
                                    gpu.activeTexture(${gpu.TEXTURE0 + currentSamplerIndex})
                                    gpu.bindTexture(gpu.${current.type === "sampler2D" ? "TEXTURE_2D" : "TEXTURE_CUBE_MAP"}, ${data})
                                    gpu.uniform1i(uniformMap["${uniformID}"], ${currentSamplerIndex})
                                `
                currentSamplerIndex++
            } else
                bindCode += `
                      if (${data} != null)
                        gpu.${TYPES[current.type]}(uniformMap["${uniformID}"], ${middle} ${data})\n`
        }

    }
    const res = {}
    res.uniformMap = uniformMap
    res.method = new Function("uniformMap, static, gpu", bindCode)
    return res
}