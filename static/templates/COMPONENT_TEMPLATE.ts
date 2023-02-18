export default `
/**
 * @global GPUResources - Access meshes/materials/framebuffers/shaders
 * @global GPUAPI - Create/destroy meshes/textures/framebuffers/cubemaps
 * @global PhysicsAPI - Access to Ammo.JS instance;
 * @global UIAPI - Destry/create/update UI elements; Access to document
 * @global EntityAPI - Add/remove/update entities
 * @global InputEventsAPI - Bind events to document
 * @global ConsoleAPI - log/warn/error messages to built-in console
 * @global Component - Access static methods to generate inputs or create your custom component
 * @global COMPONENTS - Native components structure 
 * @global CameraAPI - Apply custom transformations to view, change projection attributes, bind to entity
 * @global QueryAPI - Query engine entities
 * @global entity - Entity reference
 * @global FileSystemAPI - Read methods and orther data
 */

let myModule 
FileSystemAPI.importAsset("my-asset-id").then(data => {
    myModule = data
})

return {
    
    myNumber: 10,
    onCreation(){  
        // Executed when entity is created
    },
    onDestruction(){  
        // Executed when entity is destroyed
    },
    onUpdate(){
        // executed every frame  
    },
    // Component metadata
    name: "My component", // Component name that will be showed on editor
    props: [
        Component.number("My example input", "myNumber") // Inputs for inspector
    ]
}
`