import GPU from "../../GPU";
import ResourceEntityMapper from "../../resource-libs/ResourceEntityMapper";
import StaticShaders from "../../lib/StaticShaders";
import StaticMeshes from "../../lib/StaticMeshes";
import MetricsController from "../../lib/utils/MetricsController";
import METRICS_FLAGS from "../../static/METRICS_FLAGS";
import SceneRenderer from "./SceneRenderer";
import UberShader from "../../utils/UberShader";
import StaticFBO from "../../lib/StaticFBO";
import AtmosphereComponent from "../../instances/components/AtmosphereComponent";
import {mat4} from "gl-matrix";

const resources = mat4.create().fill(0)
export default class AtmosphereRenderer {
    static execute() {
        const shader = StaticShaders.atmosphere
        const uniforms = StaticShaders.atmosphereUniforms
        const context = GPU.context
        const entities = ResourceEntityMapper.atmosphere.array
        const size = entities.length
        if (size === 0)
            return
        for (let i = 0; i < size; i++) {
            if (i === 0) {
                shader.bind()
                context.disable(context.DEPTH_TEST)
            }
            const entity = entities[i]
            const component = entity.atmosphereComponent
            if (!entity.active)
                continue
            AtmosphereComponent.bindResources(resources, component)
            context.uniform1i(uniforms.type, component.renderingType)
            context.uniformMatrix4fv(uniforms.information, false, resources)

            StaticMeshes.drawQuad()
        }
        context.enable(context.DEPTH_TEST)

        MetricsController.currentState = METRICS_FLAGS.ATMOSPHERE
    }
}