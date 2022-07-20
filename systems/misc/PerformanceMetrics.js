
export default class PerformanceMetrics {
    #times = []
    #renderTarget
    ramUsage = 0

    set renderTarget(renderTarget) {
        this.#renderTarget = renderTarget
    }

    updateMemory() {
        let totalMemUsage = 0
        Object.entries(process.memoryUsage())
            .forEach(item => {
                totalMemUsage += (item[1] / 1024 / 1024)
            })

        this.ramUsage = totalMemUsage.toFixed(0)
    }

    execute() {
        if (this.#renderTarget !== undefined) {
            this.updateMemory()
            const start = performance.now()
            while (this.#times.length > 0 && this.#times[0] <= start - 1000)
                this.#times.shift()
            this.#times.push(start)
            this.#renderTarget.innerText = this.#times.length + " fps | " + this.ramUsage + " mb"
        }
    }
}