type AmmoJS = {
    btDefaultCollisionConfiguration: btDefaultCollisionConfiguration
    btCollisionDispatcher: btCollisionDispatcher
    btDbvtBroadphase: btDbvtBroadphase
    btSequentialImpulseConstraintSolver: btSequentialImpulseConstraintSolver
    btDiscreteDynamicsWorld: btDiscreteDynamicsWorld
    btTransform: btTransform
    btVector3: btVector3
    btBoxShape: btBoxShape
    btSphereShape: btSphereShape
    btQuaternion: btQuaternion
    btDefaultMotionState: btDefaultMotionState
    btRigidBodyConstructionInfo: btRigidBodyConstructionInfo
    btRigidBody: btRigidBody
    _malloc: any
    HEAPF32: any
    btHeightfieldTerrainShape: any

}

interface btSequentialImpulseConstraintSolver {
    new(): btSequentialImpulseConstraintSolver
}

interface btDbvtBroadphase {
    new(): btDbvtBroadphase
}

interface btCollisionDispatcher {
    new(conf: btDefaultCollisionConfiguration): btCollisionDispatcher
}

interface btDefaultCollisionConfiguration {
    new(): btDefaultCollisionConfiguration
}

interface btVector3 {
    new(x: number, y: number, z: number): btVector3
}

interface btQuaternion {
    new(x: number, y: number, z: number, w: number): btQuaternion
}

interface btTransform {
    new():btTransform

    setIdentity()
    getRotation():{x:Function,y:Function,z:Function,w:Function}
    setOrigin(btVec3?:btVector3)
    getOrigin():{x:Function,y:Function,z:Function}
    setRotation(quat?: btQuaternion)
}


interface btDefaultMotionState {
    new(transform: btTransform): btDefaultMotionState
    getWorldTransform(transform:btTransform)

}

interface btRigidBodyConstructionInfo {
    new(
        mass:number,
        motionState:btDefaultMotionState,
        shape:btSphereShape|btBoxShape,
        inertia:btVector3
    ): btRigidBodyConstructionInfo
}

interface btRigidBody {
    new(info: btRigidBodyConstructionInfo): btRigidBody
}

interface btBoxShape {
    new(size:btVector3):btBoxShape

    calculateLocalInertia(mass: number, inertia: btVector3)

    setMargin(margin: number)
}

interface btSphereShape {
    new(radius:number):btSphereShape
    calculateLocalInertia(mass: number, inertia: btVector3)

    setMargin(margin: number)
}

interface btDiscreteDynamicsWorld {
    new(d: btCollisionDispatcher, b: btDbvtBroadphase, s: btSequentialImpulseConstraintSolver, c: btCollisionDispatcher): btDiscreteDynamicsWorld

    addRigidBody(body: btRigidBody),

    setGravity(gravity: btVector3)

    removeRigidBody(body: btRigidBody)
    stepSimulation(stepSize:number, subSteps:number)
}
