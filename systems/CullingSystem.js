import System from "../basic/System"

export default class CullingSystem extends System {
    _ready = false

    constructor() {
        super()
    }

    execute() {
        super.execute()

        // TODO - REMOVE NOT VISIBLE - REMOVE FRUSTUM CULLED - REMOVE GPU OCCLUSION CULLED
        // const filteredMeshes = this._find(entities, e => filteredEntities.meshes[e.id] !== undefined)
        // filteredMeshes.forEach(m => {
        //     if(!m.query)
        //         m.query = window.gpu.createQuery()
        //
        //     if (m.queryInProgress && window.gpu.getQueryParameter(m.query, window.gpu.QUERY_RESULT_AVAILABLE)) {
        //         m.occluded = !window.gpu.getQueryParameter(m.query, window.gpu.QUERY_RESULT);
        //         m.queryInProgress = false;
        //     }
        //     if (!m.queryInProgress) {
        //         window.gpu.beginQuery(window.gpu.ANY_SAMPLES_PASSED_CONSERVATIVE, m.query);
        //         window.gpu.drawArrays(window.gpu.TRIANGLES, 0, m.boundingBoxNumVertices);
        //         window.gpu.endQuery(window.gpu.ANY_SAMPLES_PASSED_CONSERVATIVE);
        //         m.queryInProgress = true;
        //     }
        // })
    }
}