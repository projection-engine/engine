
export default class PerformanceMetrics {
    #times = []
    #renderTarget

    set renderTarget(renderTarget) {
        this.#renderTarget = renderTarget
        this.#renderTarget.innerHTML = `
            <div id="${renderTarget.id + "-fps"}"></div>
            |
            <div id="${renderTarget.id + "-mem"}"></div>
        `
        this.fpsRef = document.getElementById(renderTarget.id + "-fps")
        this.ramRef = document.getElementById(renderTarget.id + "-mem")

        setInterval(() => {
            this.updateMemory()
        }, 250)
    }

    updateMemory() {
        let totalMemUsage = 0
        Object.entries(process.memoryUsage())
            .forEach(item => {
                totalMemUsage += (item[1] / 1024 / 1024)
            })

        this.ramRef.innerText = totalMemUsage.toFixed(0) + " mem"
    }

    execute() {
        if (this.#renderTarget !== undefined) {

            const start = performance.now()
            while (this.#times.length > 0 && this.#times[0] <= start - 1000)
                this.#times.shift()
            this.#times.push(start)
            this.fpsRef.innerText = this.#times.length + " fps"
        }
    }
}