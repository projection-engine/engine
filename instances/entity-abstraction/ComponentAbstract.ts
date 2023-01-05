import MovableAbstract from "./MovableAbstract";
import LightComponent from "../../templates/components/LightComponent";
import CullingComponent from "../../templates/components/CullingComponent";
import RigidBodyComponent from "../../templates/components/RigidBodyComponent";
import MeshComponent from "../../templates/components/MeshComponent";
import SpriteComponent from "../../templates/components/SpriteComponent";
import Material from "../Material";
import Mesh from "../Mesh";
import COMPONENTS from "../../static/COMPONENTS";
import Component from "../../templates/components/Component";
import SkyLightComponent from "../../templates/components/SkyLightComponent";
import PhysicsColliderComponent from "../../templates/components/PhysicsColliderComponent";
import TerrainComponent from "../../templates/components/TerrainComponent";
import UIComponent from "../../templates/components/UIComponent";
import CameraComponent from "../../templates/components/CameraComponent";

export default class ComponentAbstract extends MovableAbstract {
    components = new Map<string, Component>()
    #lightComponent?: LightComponent
    #cullingComponent?: CullingComponent
    #rigidBodyComponent?: RigidBodyComponent
    #meshComponent?: MeshComponent
    #spriteComponent?: SpriteComponent
    #uiComponent?: UIComponent
    #cameraComponent?: CameraComponent
    #skylightComponent?: SkyLightComponent
    #physicsColliderComponent?: PhysicsColliderComponent
    #terrainComponent?: TerrainComponent
    #materialRef?: Material
    #meshRef?: Mesh

    get meshRef(): Mesh | undefined {
        return this.#meshRef
    }

    get materialRef(): Material | undefined {
        return this.#materialRef
    }

    set meshRef(data) {
        this.#meshRef = data
    }

    set materialRef(data) {
        this.#materialRef = data
    }

    get lightComponent(): LightComponent | undefined {
        return this.#lightComponent
    }

    get cullingComponent(): CullingComponent | undefined {
        return this.#cullingComponent
    }

    get rigidBodyComponent(): RigidBodyComponent | undefined {
        return this.#rigidBodyComponent
    }

    get meshComponent(): MeshComponent | undefined {
        return this.#meshComponent
    }

    get spriteComponent(): SpriteComponent | undefined {
        return this.#spriteComponent
    }

    get uiComponent(): UIComponent | undefined {
        return this.#uiComponent
    }

    get cameraComponent(): CameraComponent | undefined {
        return this.#cameraComponent
    }

    get skylightComponent(): SkyLightComponent | undefined {
        return this.#skylightComponent
    }

    get physicsColliderComponent(): PhysicsColliderComponent | undefined {
        return this.#physicsColliderComponent
    }

    get terrainComponent(): TerrainComponent | undefined {
        return this.#terrainComponent
    }

    protected updateInternalComponentRef(KEY: string, instance?: Component) {
        switch (KEY) {
            case COMPONENTS.LIGHT:
                this.#lightComponent = !instance ? undefined : <LightComponent>instance
                break
            case COMPONENTS.MESH:
                this.#meshComponent = !instance ? undefined : <MeshComponent>instance
                break
            case COMPONENTS.CAMERA:
                this.#cameraComponent = !instance ? undefined : <CameraComponent>instance
                break
            case COMPONENTS.SKYLIGHT:
                this.#skylightComponent = !instance ? undefined : <SkyLightComponent>instance
                break
            case COMPONENTS.SPRITE:
                this.#spriteComponent = !instance ? undefined : <SpriteComponent>instance
                break
            case COMPONENTS.PHYSICS_COLLIDER:
                this.#physicsColliderComponent = !instance ? undefined : <PhysicsColliderComponent>instance
                break
            case COMPONENTS.RIGID_BODY:
                this.#rigidBodyComponent = !instance ? undefined : <RigidBodyComponent>instance
                break
            case COMPONENTS.CULLING:
                this.#cullingComponent = !instance ? undefined : <CullingComponent>instance
                break
            case COMPONENTS.UI:
                this.#uiComponent = !instance ? undefined : <UIComponent>instance
                break
            case COMPONENTS.TERRAIN:
                this.#terrainComponent = !instance ? undefined : <TerrainComponent>instance
                break
        }
    }

} 