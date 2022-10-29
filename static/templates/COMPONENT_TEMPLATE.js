export default `
/**
 * @global GPUResources - Access meshes/materials/framebuffers/shaders
 * @global GPUController - Create/destroy meshes/textures/framebuffers/cubemaps
 * @global PhysicsAPI - Access to Ammo.JS instance;
 * @global UIAPI - Destry/create/update UI elements; Access to document
 * @global TransformationAPI - Transform/interpolate matrices 
 * @global EntityAPI - Add/remove/update entities
 * @global InputEventsAPI - Bind events to document
 * @global ConsoleAPI - log/warn/error messages to built-in console
 * @global Component - Access static methods to generate inputs or create your custom component
 * @global COMPONENTS - Native components structure 
 * @global CameraAPI - Apply custom transformations to view, change projection attributes, bind to entity
 * @global QueryAPI - Query engine entities 
 */

 
// You can also declare functions outside class
class MyComponent extends Component {
    myNumber = 10
    entity // will be initialized with entity reference after constructor    
    constructor(entity){
        super()
        // Executed on first frame update
    }
    
    onUpdate(){
        // executed every frame  
    }
    
    // Component metadata
    _name = "My component" // Ideally unique
    _props = [
        Component.number("My example input", "myNumber")
    ]
}

return MyComponent // Required return statement for class reference
 `