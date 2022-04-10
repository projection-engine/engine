import {useEffect, useReducer, useState} from "react";
import entityReducer from "../utils/entityReducer";

export default function useEngineEssentials(renderingTarget) {
    const [meshes, setMeshes] = useState([])
    const [materials, setMaterials] = useState([])
    const [entities, dispatchEntities] = useReducer(entityReducer, [])
    const [scripts, setScripts] = useState([])
    const [gpu, setGpu] = useState()
    useEffect(() => {
        if (renderingTarget) {
            const target = document.getElementById(renderingTarget)
            if (target) {
                const ctx = target.getContext('webgl2', {
                        antialias: false,
                        preserveDrawingBuffer: true,
                        premultipliedAlpha: false
                    })

                    ctx.getExtension("EXT_color_buffer_float")
                    ctx.getExtension('OES_texture_float')
                    ctx.getExtension('OES_texture_float_linear')
                ctx.enable(ctx.BLEND);
                ctx.blendFunc(ctx.SRC_ALPHA, ctx.ONE_MINUS_SRC_ALPHA);
                ctx.enable(ctx.CULL_FACE);
                ctx.cullFace(ctx.BACK);
                ctx.enable(ctx.DEPTH_TEST);
                ctx.depthFunc(ctx.LESS);
                ctx.frontFace(ctx.CCW);

                setGpu(ctx)
            }
        }
    }, [renderingTarget])


    return {
        gpu,
        entities, dispatchEntities,
        meshes, setMeshes,
        materials, setMaterials,
        scripts, setScripts
    }
}
