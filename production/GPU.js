export default class GPU{
    static context

    static activeShader
    static activeFramebuffer
    static activeMesh
    static activeMaterial
    static shaders = new Map()
    static meshes = new Map()


    static initializeContext(){
        if(GPU.context)
            return

    }

    static allocateMesh(){

    }
    static destroyMesh(){

    }

    static allocateFramebuffer(){

    }
    static destroyFramebuffer(){

    }

    static allocateShader(){

    }
    static destroyShader(){

    }
}