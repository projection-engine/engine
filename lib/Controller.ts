export default class Controller{
    private static initialized = false;
    static initialize(){
        if(Controller.initialized)
            return
        Controller.initialized = true
    }
}