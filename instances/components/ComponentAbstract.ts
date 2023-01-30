import MovableAbstract from "./MovableAbstract";
import LightComponent from "./LightComponent";
import CullingComponent from "./CullingComponent";
import RigidBodyComponent from "./RigidBodyComponent";
import MeshComponent from "./MeshComponent";
import SpriteComponent from "./SpriteComponent";
import Material from "../Material";
import Mesh from "../Mesh";
import COMPONENTS from "../../static/COMPONENTS";
import Component from "./Component";
import AtmosphereComponent from "./AtmosphereComponent";
import PhysicsColliderComponent from "./PhysicsColliderComponent";
import UIComponent from "./UIComponent";
import CameraComponent from "./CameraComponent";
import DecalComponent from "./DecalComponent";
import LightProbeComponent from "./LightProbeComponent";

export default class ComponentAbstract extends MovableAbstract {
    components = new Map<string, Component>()
    #lightComponent?: LightComponent
    #cullingComponent?: CullingComponent
    #rigidBodyComponent?: RigidBodyComponent
    #meshComponent?: MeshComponent
    #spriteComponent?: SpriteComponent
    #decalComponent?: DecalComponent
    #uiComponent?: UIComponent
    #cameraComponent?: CameraComponent
    #physicsColliderComponent?: PhysicsColliderComponent
    #lightProbeComponent?: LightProbeComponent
    #atmosphereComponent?: AtmosphereComponent
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
    get decalComponent(): DecalComponent | undefined {
        return this.#decalComponent
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



    get physicsColliderComponent(): PhysicsColliderComponent | undefined {
        return this.#physicsColliderComponent
    }

    get lightProbeComponent(): LightProbeComponent | undefined {
        return this.#lightProbeComponent
    }
    get atmosphereComponent(): AtmosphereComponent {
        return this.#atmosphereComponent
    }

    protected updateInternalComponentRef(KEY: string, instance?: Component) {
        switch (KEY) {
            case COMPONENTS.LIGHT:
                this.#lightComponent = !instance ? undefined : <LightComponent>instance
                break
            case COMPONENTS.DECAL:
                this.#decalComponent = !instance ? undefined : <DecalComponent>instance
                break
            case COMPONENTS.MESH:
                this.#meshComponent = !instance ? undefined : <MeshComponent>instance
                break
            case COMPONENTS.CAMERA:
                this.#cameraComponent = !instance ? undefined : <CameraComponent>instance
                break
            case COMPONENTS.LIGHT_PROBE:
                this.#lightProbeComponent = !instance ? undefined : <LightProbeComponent>instance
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
            case COMPONENTS.ATMOSPHERE:
                this.#atmosphereComponent = !instance ? undefined : <AtmosphereComponent>instance
                break
        }
    }

} 