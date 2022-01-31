import {vec2, vec3} from "gl-matrix";

export default function loadObj(data) {
    let txt = data.trim() + "\n";
    let line,
        itm,
        ary,
        i,
        ind,
        isQuad = false,
        aCache = [],
        cVert = [],
        cNorm = [],
        cUV = [],
        fVert = [],
        fNorm = [],
        fTangents = [],
        fUV = [],
        fIndex = [],
        fIndexCnt = 0,
        posA = 0,
        posB = txt.indexOf("\n", 0),
        groupedUVS = []

    while (posB > posA) {
        line = txt.substring(posA, posB).trim();
        switch (line.charAt(0)) {
            case "v":
                itm = line.split(" ");
                itm.shift();
                switch (line.charAt(1)) {
                    case " ":
                        cVert.push(parseFloat(itm[0]), parseFloat(itm[1]), parseFloat(itm[2]));
                        break;		//VERTEX
                    case "t":
                        cUV.push(parseFloat(itm[0]), parseFloat(itm[1]));
                        break;							//UV
                    case "n":
                        cNorm.push(parseFloat(itm[0]), parseFloat(itm[1]), parseFloat(itm[2]));
                        break;	//NORMAL
                }
                break;
            case "f":
                itm = line.split(" ");
                itm.shift();
                isQuad = false;
                let allUVs = []
                for (i = 0; i < itm.length; i++) {
                    const column = itm[i].split("/");
                    allUVs.push(parseInt(column[1]) - 1)

                    if (i === 3 && !isQuad) {
                        i = 2
                        isQuad = true;
                    }
                    if (itm[i] in aCache)
                        fIndex.push(aCache[itm[i]]);
                    else {
                        ary = itm[i].split("/");
                        ind = (parseInt(ary[0]) - 1) * 3;
                        let currentVertices = [cVert[ind], cVert[ind + 1], cVert[ind + 2]],
                            currentUVS = []
                        fVert.push(...currentVertices);
                        ind = (parseInt(ary[2]) - 1) * 3;
                        fNorm.push(cNorm[ind], cNorm[ind + 1], cNorm[ind + 2]);
                        if (ary[1] !== "") {
                            ind = (parseInt(ary[1]) - 1) * 2;
                            currentUVS = [
                                cUV[ind],
                                cUV[ind + 1]
                            ]

                            fUV.push(...currentUVS)
                        }
                        aCache[itm[i]] = fIndexCnt;
                        fIndex.push(fIndexCnt);
                        fIndexCnt++;
                    }
                    if (i === 3 && isQuad) fIndex.push(aCache[itm[0]]);
                }
                groupedUVS.push(allUVs)
                break;
        }
        posA = posB + 1;
        posB = txt.indexOf("\n", posA);
    }

    try {
        const faces = groupInto(3, fIndex)
        const vertices = groupInto(3, fVert)
        const uvs = groupInto(2, fVert)

        const mappedUVS = groupedUVS.map(face => {
            return [uvs[face[0]], uvs[face[1]], uvs[face[2]]]
        })

        const mappedPositions = faces.map(face => {
            return [vertices[face[0]], vertices[face[1]], vertices[face[2]]]
        })

        for (let f = 0; f < mappedPositions.length; f++) {
            const currentFace = mappedPositions[f]
            const currentUV = mappedUVS[f]

            let deltaPositionOne = [],
                deltaPositionTwo = [],
                deltaUVOne = [],
                deltaUVTwo = []

            vec3.sub(deltaPositionOne, currentFace[1], currentFace[0])
            vec3.sub(deltaPositionTwo, currentFace[2], currentFace[0])

            vec2.sub(deltaUVOne, currentUV[1], currentUV[0])
            vec2.sub(deltaUVTwo, currentUV[2], currentUV[0])

            let r = 1 / (deltaUVOne[0] * deltaUVTwo[1] - deltaUVOne[1] * deltaUVTwo[0]),
                tangent = [],
                tangentP1 = [],
                tangentP2 = []

            // TANGENT
            vec3.scale(tangentP1, deltaPositionOne, deltaUVTwo[1])
            vec3.scale(tangentP2, deltaPositionTwo, deltaUVOne[1])
            vec3.sub(tangent, tangentP1, tangentP2)
            vec3.scale(tangent, tangent, r)

            fTangents.push(tangent)

        }

        fTangents = fTangents.flat()
    } catch (e) {
    }


    return {
        vertices: fVert,
        indices: fIndex,
        normals: fNorm,
        uvs: fUV,
        tangents: fTangents
    }
}


export function groupInto(size, mainArray) {
    let arrayOfArrays = [];
    for (let i = 0; i < mainArray.length; i += size) {
        arrayOfArrays.push(mainArray.slice(i, i + size));
    }

    return arrayOfArrays
}