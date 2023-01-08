import getGlslSizes from "../utils/get-glsl-sizes";
import GPU from "../GPU";

interface Item{
    offset:number,
    dataSize:number,
    chunkSize:number
}
interface Data{
    name:string
    type:string
    offset?:number
    dataSize?:number
    chunkSize?:number
    dataLength?:number
}
export default class UBO {
    items:Item[] = []
    keys:string[] = []
    buffer?:WebGLBuffer
    blockName?:string
    blockPoint?:number

    static #blockPointIncrement = 0

    constructor(blockName:string, dataArray:Data[]) {

        const bufferSize = UBO.#calculate(dataArray);
        for (let i = 0; i < dataArray.length; i++) {
            this.items[dataArray[i].name] = {
                offset: dataArray[i].offset,
                dataSize: dataArray[i].dataSize,
                chunkSize: dataArray[i].chunkSize
            };
            this.keys[i] = dataArray[i].name;
        }

        this.blockName = blockName;
        this.blockPoint = UBO.#blockPointIncrement;
        UBO.#blockPointIncrement += 1

        this.buffer = GPU.context.createBuffer();
        GPU.context.bindBuffer(GPU.context.UNIFORM_BUFFER, this.buffer);
        GPU.context.bufferData(GPU.context.UNIFORM_BUFFER, bufferSize, GPU.context.DYNAMIC_DRAW);
        GPU.context.bindBuffer(GPU.context.UNIFORM_BUFFER, null);
        GPU.context.bindBufferBase(GPU.context.UNIFORM_BUFFER, this.blockPoint, this.buffer);
    }

    bindWithShader(shaderProgram:WebGLProgram) {
        GPU.context.useProgram(shaderProgram)
        const index = GPU.context.getUniformBlockIndex(shaderProgram, this.blockName)
        GPU.context.uniformBlockBinding(shaderProgram, index, this.blockPoint)
    }

    bind() {
        GPU.context.bindBuffer(GPU.context.UNIFORM_BUFFER, this.buffer)
    }

    unbind() {
        GPU.context.bindBuffer(GPU.context.UNIFORM_BUFFER, null)
    }

    updateData(name, data) {
        GPU.context.bufferSubData(GPU.context.UNIFORM_BUFFER, this.items[name].offset, data, 0, null)
    }
    updateBuffer(data) {
        GPU.context.bufferSubData(GPU.context.UNIFORM_BUFFER, 0, data, 0, null)
    }
    static #calculate(dataArray:Data[]):number {
        let chunk = 16,
            tsize = 0,
            offset = 0,
            size;

        for (let i = 0; i < dataArray.length; i++) {
            if (!dataArray[i].dataLength || dataArray[i].dataLength === 0)
                size = getGlslSizes(dataArray[i].type);
            else
                size = [dataArray[i].dataLength * 16 * 4, dataArray[i].dataLength * 16 * 4];

            tsize = chunk - size[0];

            if (tsize < 0 && chunk < 16) {
                offset += chunk;
                if (i > 0) dataArray[i - 1].chunkSize += chunk;
                chunk = 16;
            }
             else if (tsize === 0) {
                if (dataArray[i].type === "vec3" && chunk === 16) chunk -= size[1];
                else chunk = 16;
            } else if(tsize >= 0 || chunk !== 16) chunk -= size[1];


            dataArray[i].offset = offset;
            dataArray[i].chunkSize = size[1];
            dataArray[i].dataSize = size[1];

            offset += size[1];
        }


        return offset;
    }

}