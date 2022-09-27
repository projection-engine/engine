export default function getTerrainMaterial(layers) {
    const multiplierType = layers === 1 ? "vec3" : "mat3"
    let samplers = ""
    let samplersData = ""
    for (let i = 0; i < layers; i++) {
        samplers += `
        
      uniform sampler2D albedo${i};
      uniform sampler2D normal${i};
      uniform sampler2D roughness${i};
      `
        let currentMultiplier
        switch (i) {
            case 0:
                if (layers > 1)
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
            vec3 currentMultiplier = ${currentMultiplier};        
            float layerMultiplier = layerData.${i === 0 ? "x" : i === 1 ? "y" : "z"};
            gAlbedo += vec4(texture(albedo${i}, texCoord).rgb * layerMultiplier * currentMultiplier.x;
            gNormal += vec4(normalize(toTangentSpace * ((texture(normal${i}, texCoord).rgb * 2.0)- 1.0)) * layerMultiplier * currentMultiplier.y;
            gBehaviour.g += texture(roughness${i}, texCoord).r  * layerMultiplier * currentMultiplier.z;
        `
    }

    return `
        #version 300 es
        precision highp float;
        
        in vec3 normalVec;
        in mat3 toTangentSpace; 
        in vec2 texCoord;
        in vec4 vPosition; 
        
        uniform sampler2D layerController;
        uniform ${multiplierType} multipliers;
        ${samplers}
        
        layout (location = 0) out vec4 gPosition;
        layout (location = 1) out vec4 gNormal;
        layout (location = 2) out vec4 gAlbedo;   
        layout (location = 3) out vec4 gBehaviour; // AO ROUGHNESS METALLIC
        layout (location = 4) out vec4 gAmbient;
        
        
        void main(){  
            gPosition = vPosition;
            gAmbient = vec4(0., 0., 0., 1.);
            gBehaviour =  vec4(1., 0., 0., 1.); 
            vec3 layerData = texture(layerController, texCoords).rgb; 
            ${samplersData}
        }
`
}