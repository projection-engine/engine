import getGlslSizes from "../utils/get-glsl-sizes";


export default class UBO {
    items = []
    keys = []
    buffer
    blockName
    blockPoint

    static #blockPointIncrement = 0

    constructor(blockName, dataArray) {
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


        this.buffer = gpu.createBuffer();
        gpu.bindBuffer(gpu.UNIFORM_BUFFER, this.buffer);
        gpu.bufferData(gpu.UNIFORM_BUFFER, bufferSize, gpu.DYNAMIC_DRAW);
        gpu.bindBuffer(gpu.UNIFORM_BUFFER, null);
        gpu.bindBufferBase(gpu.UNIFORM_BUFFER, this.blockPoint, this.buffer);
    }

    bindWithShader(shaderProgram) {
        gpu.useProgram(shaderProgram)

        const index = gpu.getUniformBlockIndex(shaderProgram, this.blockName)
        console.log(index, this.blockName)
        gpu.uniformBlockBinding(shaderProgram, index, this.blockPoint)
    }

    bind() {
        gpu.bindBuffer(gpu.UNIFORM_BUFFER, this.buffer)
    }

    unbind() {
        gpu.bindBuffer(gpu.UNIFORM_BUFFER, null)
    }

    updateData(name, data) {
        gpu.bufferSubData(gpu.UNIFORM_BUFFER, this.items[name].offset, data, 0, null)
    }

    static #calculate(dataArray) {
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
            } else if (tsize < 0 && chunk === 16) {
            } else if (tsize === 0) {
                if (dataArray[i].type === "vec3" && chunk === 16) chunk -= size[1];
                else chunk = 16;

            } else chunk -= size[1];


            dataArray[i].offset = offset;
            dataArray[i].chunkSize = size[1];
            dataArray[i].dataSize = size[1];

            offset += size[1];
        }


        return offset;
    }

}