export default class MetricsPass {
    static #times = []
    static #renderTarget
    static then = 0

    static set renderTarget(renderTarget) {
        MetricsPass.#renderTarget = renderTarget
        MetricsPass.#renderTarget.innerHTML = `
            <div id="${renderTarget.id + "-fps"}"></div>
            |
            <div id="${renderTarget.id + "-frame-time"}"></div>
            |
            <div id="${renderTarget.id + "-mem"}"></div>
        `
        MetricsPass.fpsRef = document.getElementById(renderTarget.id + "-fps")
        MetricsPass.frameTimeRef = document.getElementById(renderTarget.id + "-frame-time")
        MetricsPass.ramRef = document.getElementById(renderTarget.id + "-mem")

        setInterval(() => {
            MetricsPass.updateMemory()
        }, 250)
    }

    static updateMemory() {
        let totalMemUsage = 0
        Object.entries(process.memoryUsage())
            .forEach(item => {
                totalMemUsage += (item[1] / 1024 / 1024)
            })

        MetricsPass.ramRef.textContent = totalMemUsage.toFixed(0) + " RAM"
    }

    static execute() {
        if (MetricsPass.#renderTarget) {
            const start = performance.now()
            while (MetricsPass.#times.length > 0 && MetricsPass.#times[0] <= start - 1000)
                MetricsPass.#times.shift()
            MetricsPass.#times.push(start)
            MetricsPass.fpsRef.textContent = MetricsPass.#times.length + " fps"
            MetricsPass.frameTimeRef.textContent = (start - MetricsPass.then).toFixed(2) + " ms"
            MetricsPass.then = start
        }
    }
}