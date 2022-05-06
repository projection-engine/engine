### Engine core

#### Structure

- **Systems**
> Systems are the rendering pipe-line it-self. They work by updating and using components present on each entity relevant to it-self. 
 
- **Entities**
> Entities are wrappers for the components, every system works with entities as the basis.
An entity will always have a `components` key holding an objects that stores the components.

- **Components**
> Components are classes that primarily store data for the systems to use. Systems usually use filters for entities with a certain component that is required for it to work,
like the `MeshComponent`, it is used by multiple systems that need a `MeshInstance` to work.

- **Instances**
> Instances are classes that serve data or actions to multiple systems, for example, the `FrameBufferInstance` offers an easy-to-use abstraction for frameBuffers in webgl2,
it can be used by multiple systems. `MaterialInstance` is another abstraction for shaders and textures.

#### Renderer

<img src="https://github.com/projection-engine/engine/blob/v0.1.x-alpha/flow.jpg?raw=true" alt="Editor material"/>

- **start**
> Starts the render loop and stores the current frame inside the `_currentFrame` variable.
- **stop**
> Stops the render loop by canceling the current frame.
- **updatePackage**
> Receives the data required to initialize the rendering loop and structures it inside 4 objects, those being:
> - **systems**: Private variable holding the systems structure by their respective execution order.
> - **data**: Object holding filtered entities relevant to the systems (like lights, meshes, cubemaps and etc..), it also holds the hashMap for all mesh instances and material instances
> - **params**: Object holding rendering settings, camera information and callbacks


#### Hooks

- **useEditorEngine**: Hook for the full editor window.
- **useMinimalEngine**: Minimal wrapper for the renderer to work with only the primordial systems to work.
- **useEngineEssentials**: Hook offering states for meshes, materials, entities, scripts. On startup it will prepare the context and store it inside the `gpu` state.



#### Rendering observations:

- Point lights uniforms and light limit
> Point light uniforms are structure all inside a mat4 matrix per light, this means that all data necessary for it to work is present inside this single matrix.
  the shader will receive an array of this matrix to perform the calculations.

```
// [
//    POSITION [0][0] [0][1] [0][2] EMPTY
//    COLOR [1][0] [1][1] [1][2]  EMPTY
//    ATTENUATION [2][0] [2][1] [2][2] EMPTY
//    zFar [3][0] zNear [3][1] hasShadowMap [3][2] EMPTY
// ] = mat4
```

- Directional lights
```
// [
//    DIRECTION [0][0]     [0][1] [0][2] 
//    COLOR     [1][0]     [1][1] [1][2] 
//    atlasX  [2][0] atlasY [2][1] hasShadowMap [2][2]  
// ] = mat3
```

- Shader Settings
```
// [
//     dirLightQuantity,   shadowMapResolution, indirectLightAttenuation,
//     gridSize,           noGI,                lightQuantity,
//     noShadowProcessing, shadowMapsQuantity,  0
// ] 
```