export default class RenderLoop {
    _currentFrame = 0
    _framesRendered = 0
    _times = []

    _performanceRef

    constructor(id) {
        this._performanceRef = document.getElementById(id + '-frames')
    }

    get currentFrame() {
        return this._currentFrame
    }

    get fps() {
        return this._framesRendered
    }

    _loop(callback) {
        let start = performance.now()

        callback(performance.now() - this._startedOn)

        while (this._times.length > 0 && this._times[0] <= start - 1000) {
            this._times.shift();
        }
        this._times.push(start);
        this._framesRendered = this._times.length;
        if (this._performanceRef)
            this._performanceRef.innerText = `${this._framesRendered}`

        this._currentFrame = requestAnimationFrame(() => this._loop(callback));
    }

    start(callback) {

        this._startedOn = performance.now()
        this._currentFrame = requestAnimationFrame(() => this._loop(callback));
    }
}