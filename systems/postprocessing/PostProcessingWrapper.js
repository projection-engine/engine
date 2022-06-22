import System from "../../basic/System"
import CompositePass from "./CompositePass"
import FinalPass from "./FinalPass"


export default class PostProcessingWrapper extends System {
    constructor( postProcessingResolution) {
        super()
        this.compositPass = new CompositePass(postProcessingResolution)
        this.finalPass = new FinalPass( postProcessingResolution)
    }

    execute(options, systems, data, entities, entitiesMap, [a, b]) {
        super.execute()
        let worker = a, output = b

        this.compositPass.execute(options, systems, data, entities, entitiesMap, [worker, output])
        worker = b
        output = a

        this.finalPass.execute(options, [worker, output])


    }
}