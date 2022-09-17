import CameraWorker from "./apis/camera/CameraWorker";

self.onmessage = (event) => CameraWorker.initialize(...event.data)