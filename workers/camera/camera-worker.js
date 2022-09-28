import CameraWorker from "./CameraWorker";

self.onmessage = (event) => CameraWorker.initialize(...event.data)