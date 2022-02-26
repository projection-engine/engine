export default class RenderLoop {
    _currentFrame = 0
    get currentFrame() {
        return this._currentFrame
    }


    _loop(callback) {
        callback(performance.now() - this._startedOn)
        this._currentFrame = requestAnimationFrame(() => this._loop(callback));
    }

    start(callback) {

        this._startedOn = performance.now()
        this._currentFrame = requestAnimationFrame(() => this._loop(callback));
    }
}