## Projection Engine
This repository manages UI, graphics and physics related stuff and is under the **MIT License**.

### Structure
#### Editor
Editor only code like gizmo structure and grid.

#### Physics
AmmoJS and wasm binary.

#### Production
Production code that is used in both editor and final project like core render loop and native components.

#### Static
Static data used by both production and editor related contexts.

### Initializers
- **initializer** (editor): Generates editor related necessities like icons and meshes for gizmos and camera icon.
- **GPU**: Singleton context for webGL graphics.
- **Engine**: Singleton wrapper for engine actions (starting, stop, camera update and data storage)