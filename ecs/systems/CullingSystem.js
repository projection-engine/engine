import System from "../basic/System";

export default class CullingSystem extends System {
    _ready = false

    constructor(gpu) {
        super([]);
        this.gpu = gpu
    }

    execute(entities, params, systems, filteredEntities) {
        super.execute()
         // TODO
        // const filteredMeshes = this._find(entities, e => filteredEntities.meshes[e.id] !== undefined)
        // filteredMeshes.forEach(m => {
        //     if(!m.query)
        //         m.query = this.gpu.createQuery()
        //
        //     if (m.queryInProgress && this.gpu.getQueryParameter(m.query, this.gpu.QUERY_RESULT_AVAILABLE)) {
        //         m.occluded = !this.gpu.getQueryParameter(m.query, this.gpu.QUERY_RESULT);
        //         m.queryInProgress = false;
        //     }
        //     if (!m.queryInProgress) {
        //         this.gpu.beginQuery(this.gpu.ANY_SAMPLES_PASSED_CONSERVATIVE, m.query);
        //         this.gpu.drawArrays(this.gpu.TRIANGLES, 0, m.boundingBoxNumVertices);
        //         this.gpu.endQuery(this.gpu.ANY_SAMPLES_PASSED_CONSERVATIVE);
        //         m.queryInProgress = true;
        //     }
        // })
    }
}