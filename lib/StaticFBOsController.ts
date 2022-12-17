import Controller from "./Controller";
import GPU from "./GPU";

export default class StaticFBOsController extends Controller{

    static initialize(){
        super.initialize()
        const halfResW = GPU.internalResolution.w / 2, halfResH = GPU.internalResolution.h / 2
    }
}