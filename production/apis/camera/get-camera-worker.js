export default function getCameraWorker(){
    const w = `
        let initialized = false
        self.onmessage = () => {
            if(initialized)
                return
            initialized = true
        }
    `
}