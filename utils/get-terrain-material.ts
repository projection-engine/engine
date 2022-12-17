export default function getTerrainMaterial(layers) {
    const multiplierType = layers === 0 ? "vec3" : "mat3"
    let samplers = ""
    let samplersData = ""
    for (let i = 0; i <= layers; i++) {
        samplers += `
        
      uniform sampler2D albedo${i};
      uniform sampler2D normal${i};
      uniform sampler2D roughness${i};
      `
        let currentMultiplier
        switch (i) {
            case 0:
                if (layers === 0)
                    currentMultiplier = `multipliers`
                else
                    currentMultiplier = `vec3(multipliers[0][0],multipliers[0][1],multipliers[0][2])`
                break
            case 1:
                currentMultiplier = `vec3(multipliers[1][0],multipliers[1][1],multipliers[1][2])`
                break
            case 2:
                currentMultiplier = `vec3(multipliers[2][0],multipliers[2][1],multipliers[2][2])`
                break
        }
        samplersData += `
            ${i === 0 ? "vec3" : ""}  currentMultiplier = ${currentMultiplier};        
            ${i === 0 ? "float" : ""} layerMultiplier = layerData.${i === 0 ? "x" : i === 1 ? "y" : "z"};
            gAlbedo.rgb ${i > 0 ? "+" : ""}= texture(albedo${i}, texCoords).rgb * layerMultiplier;
            gNormal.rgb ${i > 0 ? "+" : ""}= normalize(toTangentSpace * ((texture(normal${i}, texCoords).rgb * 2.0)- 1.0)) * layerMultiplier;
            gBehaviour.g ${i > 0 ? "+" : ""}= texture(roughness${i}, texCoords).r  * layerMultiplier;
        `
    }

    return `


precision highp float;

in vec3 normalVec;
in mat3 toTangentSpace; 
in vec2 texCoords;
in vec3 worldSpacePosition;
in vec3 viewSpacePosition; 

uniform sampler2D layerController;
uniform ${multiplierType} multipliers;
${samplers}

layout (location = 0) out vec4 gPosition;
layout (location = 1) out vec4 gNormal;
layout (location = 2) out vec4 gAlbedo;   
layout (location = 3) out vec4 gBehaviour; 

void main(){  
    gPosition = vec4(viewSpacePosition, 1.);
    gAlbedo = vec4(0., 0., 0., 1.);
    gNormal = vec4(0., 0., 0., 1.);
    // gAmbient = vec4(0., 0., 0., 1.);
    gBehaviour =  vec4(1., 0., 0., 1.); 
    vec3 layerData = texture(layerController, texCoords).rgb; 
    ${samplersData}

    gAlbedo.rgb /=${layers + 1}.;
    gNormal.rgb /=${layers + 1}.;
    gBehaviour.g /= ${layers + 1}.; 
}
`
}