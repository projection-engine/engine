import Culling from "./misc/Culling"
import Transformations from "./misc/Transformations"
import Scripting from "./misc/Scripting"
import Physics from "./misc/Physics"
import PerformanceMetrics from "./misc/PerformanceMetrics"

export default class MiscellaneousPass{
    constructor(resolution) {
        this.culling = new Culling(resolution)
        this.metrics = new PerformanceMetrics(resolution)
        this.physics = new Physics(resolution)
        this.scripting = new Scripting(resolution)
        this.transformations = new Transformations(resolution)
    }

    execute(options,  data, entities, entitiesMap, updateAllLights) {
        this.culling.execute(options,  data, entities, entitiesMap, updateAllLights)
        this.scripting.execute(options,  data, entities, entitiesMap, updateAllLights)
        this.metrics.execute(options,  data, entities, entitiesMap, updateAllLights)
        this.physics.execute(options,  data, entities, entitiesMap, updateAllLights)
        this.transformations.execute(options,  data, entities, entitiesMap, updateAllLights)
    }
}