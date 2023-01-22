import METRICS_FLAGS, {REVERSED_METRICS_FLAGS} from "../../static/METRICS_FLAGS";

let started = false
export default class MetricsController {
    static #elapsed = new Float32Array(Object.keys(METRICS_FLAGS).length)
    static #totalElapsed = 0
    static #start = 0
    static #previousStart = 0

    static set currentState(data: number) {
        if (!started)
            return

        const now = performance.now()
        MetricsController.#elapsed[data]+= now-MetricsController.#previousStart
        MetricsController.#previousStart = now
    }
    static init(){
        if (!started)
            return
        MetricsController.#start = performance.now()
        MetricsController.#previousStart = performance.now()
    }
    static end(){
        if (!started)
            return

        MetricsController.#totalElapsed += performance.now() - MetricsController.#start
        MetricsController.#previousStart = 0
    }
    static start() {
        started = true
        MetricsController.#totalElapsed= 0
        Object.keys(METRICS_FLAGS).forEach((_, i) => MetricsController.#elapsed[i] = 0)
    }

    static getRecord() {
        started = false
        const data = MetricsController.#elapsed
        const totalElapsed = MetricsController.#totalElapsed
        console.log(totalElapsed, data)
        const response = []

        for (let i = 0; i < data.length; i++) {
            const percentage = data[i] / totalElapsed
            response[i] = {
                flag: REVERSED_METRICS_FLAGS[i.toString()],
                percentage: percentage  * 100,
                elapsed: (totalElapsed * percentage).toFixed(1)
            }
        }

        return response
    }

}