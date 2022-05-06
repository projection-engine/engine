export class WebWorker {
    _worker

    _build(m) {
        this._worker = new Worker(URL.createObjectURL(new Blob([`(${m})()`])));
    }

    async createExecution(data, execute) {
        return await new Promise((resolve) => {
            this._build(execute)
            this._worker.addEventListener('message', e => {
                this._worker.terminate()
                resolve(e.data)
            });
            this._worker.postMessage(data);
        })
    }
}
