import System from "../basic/System";

const SAMPLES = 25
export default class MetricsSystem extends System {
    #framesRendered = 0
    #times = []
    _visible = true
    _entitiesLength = 0
    samples = []
    bars = []
    highest = 1
    constructor(gpu, canvasID) {
        super();
        this.gpu = gpu

        const canvas = document.getElementById(canvasID)
        const targetID = canvas.id + '-performance-metrics'
        if (document.getElementById(targetID) !== null) {
            this.renderTarget = document.getElementById(targetID)
            this.  #bindComponents()
        } else {
            this.renderTarget = document.createElement('div')
            this.renderTarget.id = targetID
            Object.assign(this.renderTarget.style, {
                backdropFilter: "blur(10px) brightness(70%)", borderRadius: "3px", width: "fit-content",
                height: 'fit-content', position: 'absolute', bottom: '4px', left: '4px', zIndex: '10',
                color: 'white', padding: '4px', fontSize: '.75rem', display: 'none'
            });
            canvas.parentNode.appendChild(this.renderTarget)
            this.  #bindComponents()
        }


    }

    #bindComponents() {
        const s = []
        for (let i = 0; i < SAMPLES; i++) {
            const id = 'performance-bar-' + i
            this.bars.push(id)
            s.push(`<div id=${id} style='display: none; background: #0095ff; width: 5px;'></div>`)
        }
        this.renderTarget.innerHTML = `
                <div style="display: grid; align-items: flex-start; gap: 8px">
                  
                        <h3 style="margin: 0; padding: 0">
                            <b id="performance-frames"></b> fps
                        </h3>
             
                        <h4 style="margin: 0; padding: 0" id="performance-frametime"></h4>
           
                     <div style="display: flex; align-items: flex-end; height: 35px; gap: 1px; overflow: hidden">
                        <div style="margin-right: 4px">
                            FPS:
                        </div>
                         ${s.join(' ')}
                    </div>
                   <div>
                       RAM: <b id="performance-ram"></b>mb
                    </div>
                </div>
            `
        this.bars = this.bars.map(b => {
            return document.getElementById(b)
        })
        this.ramRef = document.getElementById('performance-ram')
        this.fpsRef = document.getElementById('performance-frames')
        this.ftRef = document.getElementById('performance-frametime')
        setInterval(() => {
            this.updateMemory()
        }, 1000)


    }
    updatePerformance(start){
        if (this.samples.length >= SAMPLES) {
            this.samples.shift()
            for (let i = 0; i < SAMPLES; i++) {
                this.bars[i].style.height = this.bars[i + 1] ? this.bars[i + 1].style.height : 100 * (this.#framesRendered / this.highest) + '%'
            }
        } else {
            this.bars[this.samples.length - 1].style.display = 'block'
            this.bars[this.samples.length - 1].style.height = 100 * (this.#framesRendered / this.highest) + '%'
        }


        this.fpsRef.innerText = this.#framesRendered
        this.ftRef.innerText = (start - this.previousStartTime).toFixed(2) + 'ms'

    }
    updateMemory(){
        let totalMemUsage = 0
        Object.entries(process.memoryUsage())
            .forEach(item => {
                totalMemUsage += (item[1] / 1024 / 1024)
            })

        this.ramRef.innerText = totalMemUsage.toFixed(0)
    }
    execute(options, systems, data) {
        super.execute()
        if (options.performanceMetrics) {
            if(this.#framesRendered > this.highest)
                this.highest = this.#framesRendered

            if (!this._visible) {
                this._visible = true
                this.renderTarget.style.display = 'block'
            }
            // FRAMERATE - FRAME-TIME
            let start = performance.now()
            while (this.#times.length > 0 && this.#times[0] <= start - 1000) {
                this.#times.shift();
            }
            this.#times.push(start);
            this.#framesRendered = this.#times.length;
            this.samples.push(this.#framesRendered)
        this.updatePerformance(start)
            this.previousStartTime = start
        } else if (this._visible) {
            this._visible = false
            this.renderTarget.style.display = 'none'
        }
    }
}