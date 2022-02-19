import System from "../basic/System";

const si = window.require('systeminformation');


export default class PerformanceSystem extends System {
    _framesRendered = 0
    _times = []
    _lowest
    _samplesCounted
    _visible = true
    _entitiesLength = 0

    constructor(gpu) {
        super();
        this.gpu = gpu
        // this.debug = gpu.getExtension('webgl_debug_renderer_info');
        // this._vendor = gpu.getParameter(this.debug.UNMASKED_VENDOR_WEBGL)
        // this._renderer = gpu.getParameter(this.debug.UNMASKED_RENDERER_WEBGL)
        //

        const canvas = document.getElementById(this.gpu.canvas.id)
        const targetID = canvas.id.replace('-canvas', '-performance-metrics')
        if (document.getElementById(targetID) !== null)
            this.renderTarget = document.getElementById(targetID)
        else {
            this.renderTarget = document.createElement('div')
            this.renderTarget.id = targetID
            Object.assign(this.renderTarget.style, {
                backdropFilter: "blur(10px) brightness(70%)", borderRadius: "5px", width: "fit-content",
                height: 'fit-content', position: 'absolute', top: '4px', left: '4px', zIndex: '10',
                color: 'white', padding: '8px', fontSize: '.75rem'
            });
            canvas.parentNode.appendChild(this.renderTarget)
        }

    }

    execute(entities, params, _ , filteredEntities) {
        super.execute();
        if (params.performanceMetrics) {

            if (this._entitiesLength !== entities.length) {
                const filteredMeshes = this._find(entities, e => filteredEntities.meshes[e.id] !== undefined)
                    .map(e => params.meshes.find(m => m.id === e.components.MeshComponent.meshID))
                this._triangles = filteredMeshes.filter(m => m !== undefined).map(m => m.trianglesQuantity).reduce((p, a) => p + a, 0)
                this._meshesQuantity = filteredMeshes.length
                this._entitiesLength = entities.length
            }

            if (!this._visible) {
                this._visible = true
                this.renderTarget.style.display = 'block'
            }
            // FRAMERATE - FRAME-TIME
            let start = performance.now()
            while (this._times.length > 0 && this._times[0] <= start - 1000) {
                this._times.shift();
            }
            this._times.push(start);
            this._framesRendered = this._times.length;

            // if (!this._lowest || this._framesRendered < this._lowest)
            //     this._lowest = this._framesRendered

            // MEMORY
            let totalMemUsage = 0
            Object.entries(process.memoryUsage())
                .forEach(item => {
                    totalMemUsage += (item[1] / 1024 / 1024)
                })
            totalMemUsage = totalMemUsage.toFixed(0)


            this.renderTarget.innerHTML = `
                <div style="display: grid; align-items: flex-start; gap: 8px">
                    <div style="display: flex; align-items: center; gap: 4px">
                        <div>
                            <b>${this._framesRendered}</b> fps
                        </div>
                       |
                        <div>
                           <b>${(start - this._previusStartTime).toFixed(2)}</b> ms
                        </div>
                    </div>
                   <div>
                       RAM: <b>${totalMemUsage}</b> mb
                    </div>
                    <div>
                        Meshes:  <b>${this._meshesQuantity}</b>
                    </div>
                    <div>
                        Triangles:  <b>${this._triangles}</b>
                    </div>
                </div>
            `
            this._previusStartTime = start
        } else if (this._visible) {
            this._visible = false
            this.renderTarget.style.display = 'none'
        }
    }
}