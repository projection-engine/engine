import CameraInstance from "./instances/CameraInstance"
import {createTexture} from "./utils/utils"
import Packager from "./Packager"
import VBOInstance from "./instances/VBOInstance"
import ENVIRONMENT from "./data/ENVIRONMENT"
import Picking from "./systems/misc/Picking"
import MiscellaneousPass from "./systems/MiscellaneousPass"
import RenderingPass from "./systems/RenderingPass"
import PostProcessingPass from "./systems/PostProcessingPass"
import IMAGE_WORKER_ACTIONS from "./data/IMAGE_WORKER_ACTIONS"
import cube from "./data/CUBE.json"

const BRDF = "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RImUSIx36atCJESJJERIz36atQkSJESEiRJ6N6pESRERESEiejpUJERCREJEiendSREEIiESDPp0kkAgQhIEx6bmSAoBIBIx6M4kLVpQgEg5deeIttulqgEgODjhda1rVuqUJYA8vDhNb3vW9XWloAA+f4eWunTp03vWtXTQAA+H829uvXr13vetatWgAPx/l79+/br16b3u6ulUAD+ddfT6e/ft0673rWroaAA//8QAHQEAAgMBAQEBAQAAAAAAAAAAAQIAAwQFBggJB//aAAgBAxAAAAD6TStEREVFVFVVVVCqFAUBR/REREREVFCooQKoUKAFAA/oCJWiKiqgVQqhVAAUAAQe7rrREVUCqoUBQAsWAAQT2tdaIiqqhVEUAACAQQSD11aVoiqAoAAAgggkEkk9KiJWihQBAJBIJJJJDJ3K0RUVRAJBDJJIZDCYelXWiqoAkkMhMMJhJJh0V1oqgCQwxoWJhJYkljVWiKsEhJJLMWLEsWLFjzqkVRIYWLMzMzMxcsxZmPCprUSEsWdmdndnZmZmZmZvJ0osjFmZ3d3sd2sZ2ZnZmZvCUoIWdrHsex7bHsd3dnZ2Zmb+a0oC7WWvbZba9tlr2WO7s7MzM/8AJKULPbZbdbddbbZbbZa9juzszMzfxSlS9tt91999911tttlr2uzszMzN/AqA9t2i/To0ab777rbbbHsd2dmLMfnCmW3aNOrVq06tGi++262yx3ZmZmLH5dpa7Rr17NmvXq1aNF911tj2M5YsWJ+SK3069m7du27NevTovuustd3LMSST8Zpdr3b+j0Ohu3bNerRfdbbY7sxLEmH4cmnd0en0+l0uhu269d+i62yx2YsSYTPgSzX0ur1ut1en0t+3Zq0X3WWu7MYSTCfzrv39btdns9fqdPobdmrRfdZY7M0JMjSfmpp6nb7/AHe32Ot0+ju16tF9tju5JMjSSfl9q7XovR+g7va63T6O7Zp0XXPYzMZCZJJ+U230fqPTei7/AG+v1Ohu16r77Xd2MaSSST8jep631vqPSeg7fX6nQ3a9V91ru5LSSSST8cvR+19h6r0vf7nX6fR27NN91ru5aSSSST8V/c+49j6v0voO51+n0duvVfbbY7MZJJJJP//EACUQAAMAAgIBBAEFAAAAAAAAAAABEQJQAxASBDEycWAgISMwoP/aAAgBAQABPwH/AGgP8Af4Ax79j37Hv2Pfse/Y9+x79j3+Qx77IY99kPf5D3+Q9/kMe+zHv8x7/Me/5B/0Tb8g/wBEIQhCbbk9x9whCEIQm15fcfUIQhCEJtuX3fUEiEIQhCE2vL7vpISIQhCE2/L8mJCQkQhCEJt+X5MSEhIhCEITb8nzZijHESIQhCbjP5swxFiQhCE3MvI/s48RYkIQhB7jjVzf2YYniQhBjHuPTYX9zHEhBoYx9Me29Fx/xpniQYxjGMY9t6bj8eLD6IMYxj6Yx7ZY+KSGMYxj6Y+mPp7L/8QAIRABAQEBAQEBAAMAAwEAAAAAEQABECAwQCExQVBhoXH/2gAIAQEAAT8QiPG54PmdOEdOkeCOEeCOkRwiPBER4PG5w7ucOnC3OnTp0i3OkdIjhEeCOkREREfLc87nTpwjpHCOEd3hHCPBEdIjwRERERHxPRw8FucPB0jhERHSOkeSI6REeDh7ObHDwcPG5HCPBHCPRHSI6REeCIiIi3PjvN9nTu8OkeCPBEeSI4REREREREd3Pic3weDpwjhHSI8bnCI6REeSIiIiIiLebnN8b7OkdPRHSPBEREeCIiIiIiIiPhueD2eThHTh4IjwRERHkiIiIiIiIiIjmxw8bno8Ho8keiIiIjwRwiIiI6eTwd3O7nN8HDpbnoiI8ERHgiI8kRERERERERbnNzm283O7w4eTpwj4EREeT8BEREeN975PR6IiOEREeiIiIiIiIiIiIiIi2222Le7bzY+hER5PmRERERERERERHCPW93h06cPtvzIiIiIiIiIiIiIjm83ztvN+RERHgiI+ZERERERERERHCIi3m83/AIc9EREREREREc223ztvC3m/IiIj2REeCIiIiIiIiIiI6RbFvN8bw5vo6REeSI8ER4IiIiIjwRERERERbzbbeb04eiPoRHgjyREREREREREREREW283m+9t+RER0jpERER0iIiIiI6REREREW22823m83u/EiPB4OkcI6RHTpERERERHCItttt7vk9ER8SPRHDwRwiIiIiOkREREW22228Lbeb9Dp04R5IiOEREREdIiIiIjpFttttttvjfJw4fI4Rw4Rw4R0iIiIiI6REREW22283xvzOnDyRHkiOEcI6RHSIiIiOEW222+Nt9Hs4dPJw4cOERHCIjhERER0iIjm22222/Q+ZHSOHDyRHCIiI6RER0iLbbbbbbbfmcI4R6OEeThEcOkdIiOkRERHG222+z4HThEcPJHCOER0iIjhHCOEREdONttt/GcOHg4RwjpERHDwREREdI4R0223m832eT0RHgiOkcI4dOHCIjpHCOEdNtttt+5HSIjhHSOEeSIjhEdOEcI8HTbbbbfuR4PJwiPJ04eSIjhHSOnbbeb8yPRHSOEcI6Rw6dPBwjpHTp2237kR06R06RwiOHg4eDwdOkebbbfZwjwR0jwdI4RwjycOHk6dI8Edtttt+BHk8EcIjhwjwcPJ04dOEeDwdttt6eyOkRERwjwdI4R08nDh08EeD0Nt+JHCI8HSI4R06R4Ijh5PB4PJ4G2+CI6RERERERERER4PJHCI4Rw8Hg8Ho23yRERERHCI8EeSOkdI8HojpHg+DtvSI4RERERERERERERHk8nk8keCPZ323wRERERERERERHCIiPZ4OHTh4I9kd/34iIiIiIiIiIiIiIjwRER5PR9SPWP53nbc4REREREREREcIjpwjpHT8Z8P77zvCIiIiIiIiIiIiPqdPJ09nwOf33nYiIiIiIiIiIjhER+A+h8Dxg3edyIiIjgiIiIjhERER4IjweD9P8AfeSLMsmTPAERERERERw8EfkPge/7r+0WZZMmegCIiIiIjp0j4Hgt4eD4Hx/s4zLJkyZ5AREREREcOHD9Z9NuWcGTLnoAiIiIiOH2PufbHRy55wRFuRFucI/Hvk5vg/HDcueYEW5bluW5bnC39W8Pw/8Au8W55xs3Lcty3Lcty222377+7/2+Mc7tmzcty3Lcty3Lcty3Lbbbeb8N8b3f1Yf/AL9rOe3Zs3Lcty3Lcty2222237b539Yv4c8Hs2bMW5bluW5bbbbbbbbbb+DfRb+N7BzP4s47NmLFi3Lcty3LbbbbbfG8234789/G3f8AtsOc7wYsWLc4xbbltttttttvjbeb43u2+8/N/Is/uwWzFixY8httttttvNt5vx23n+2/tFn+bbixZ6b4G2222222283m/He76z8+OL/mFn1bem9N422223m831vd7v7f/8QAHhEBAAMAAgMBAQAAAAAAAAAAEQABEAIgAxIwBED/2gAIAQIBAQIAlYxx1xji4uKuuOri9FxVVfg9XFirFVXqx6rixVxVXq9FjqqqqqtSpUrXXFiqxVVVro93VVVVVVlbXZdVVVVValSsr5Kqqqqq1Kla9FVVVVVVWpUqVK16KqqqqqrUr4PZdVVVWpUqVK+asYqqqtSpUrurisWKqqtSpXZ1xYrFiqrxlSvkuOKuKsXjKlZXwWLjiuOLxlSpWKriqqxi4sXhKldVcVVcdYuPCVK6qrFxcXHXPHK1VViuLi64545UVVVVdXoxenilRVVVV6PzfFKtfZVV+L3c8Mbv29lVXVV7vTwy7vl7eyqqxfi9vFfLlfP39lq1cdWLH4cL5875+9cqurq6tf5efLn5PeuVXV1dXV1KlSv5P1eW/JXLjy43xurqVK+Fff8AZ5q58b43xnGVKlSpWVK6VlfXl5eF8JxnGcZUqVKlSpUrtX1//8QAIhEAAQMCBgMAAAAAAAAAAAAAAQIRUAADEiEiMUBxUWGQ/9oACAECAQM/APmBkIDIQGkQGkQDIEA1sdQGFCeoDCyfVPz3vLD7Gn55uXFL8kmA/8QAHxEBAAIDAQEBAQEBAAAAAAAAAQISAAMRBBAgMBMF/9oACAEDAQECAERERERE4iIiMa1rVjWta1rWtaoiIiIiInE5yrGta1rWta1rWtaoiIiInETiJXla1rWta1rWta0oiIiIiIic5zla1rWta1rWtaUpRERExMROJznOV5Wta1rWtaVpSjjiI4mJxOc5znK1rWta1rWtKUpRxxxxPqZznOc5yta1rWta1pSlKOOOOOJ95nOc5zla1rWta0pSlKUljjjjjj+OZznK1rWta1rWtaUpSjjjjj++c5znK1rWta1rWhClKSxXH9c+c5wOVCta1qQrSlKUpLFXud795nOBwOVIka1rUhStKUpJVe979PpgcCoESNa1rWtKVIEKSWS9734YYYYAAAESJEiRIkSJAiRpSlJSZWt3o9MMMMAAACJEiRIkSJEiRIka1rOTJlYkIiYYYYAAAABEiRIkSJEiRIkSJGc2d7EiQjFjhkciABEiBEiRIkSJEiRI1I1IzmzvckSixY5HI5EiRIhEiRIkSJEiRIkSJEjzlZ7HZcmSjKMosGOQyORIkQiRIkSJEiRAA5yvOcnsdhsJxnCUGDDIZDIESJEjGMYxIkSJEiR5znA5wJ7f9TZGcJwlBgwyGQyBAiRIgEQAACoc4HOc5Pb/AKx2QnCeuWt15rzXkCBAiQIgAAAAc5wOc58nuNsNsNmueqWp15qzWQIECMYxiAAAAc5znM585LdHbDZrnqnplpdWas1msgQIESIEQAAOc5nPnPjuju17dM9MtDpzTmrNZrIECBEiAAAHPzz4GG+G7Tt0T0S0OjNOajUayBAgRIgAABzOZz6HyO/Xu0bPNPzPndGaM0mo1msgQIkQAAA5nPnK/iG7Vu82zyy8r5s8+aDSajUayBAiRAAwwzn3n6N/n3eSfkfLnlzzmg0mo1GsgQIkQwAMPofwl6PHt8UvG+TPLnnzRmnNRrNeQyIZHDDD4YH8pejwT8D4s8meXPNmjNOas1ZryGQyORwwww/r493/ADnwZ4s8meXPPmjNOas15ryGQwyOGGGGR/p//8QAJBEAAgEDAwUAAwAAAAAAAAAAADEBAhFAECEwAxIgMmFQUZD/2gAIAQMBAz8A/lF9zt3+A3fisv74oQhY150+6oQhC1WMt9EIQhZW0bl5L2EIQhCyLU0l5gQhCELRY9pppuXmBCEIQtFyX4+7r1REqbF+0QhCELRcd+Ser1Zr/dVz1PUQhHqIQsf/2Q=="
let gpu, specularProbes = {}, diffuseProbes = {}
export default class Renderer {
    entitiesMap = new Map()
    meshes = new Map()
    activeEntitiesSize = 0 // DEV
    entities = []
    materials = []

    environment = ENVIRONMENT.PROD
    rootCamera = new CameraInstance()
    frameID = undefined
    data = {}
    params = {}
    #ready = false
    then = 0

    constructor(resolution, whenReady) {
        gpu = window.gpu
        window.imageWorker(IMAGE_WORKER_ACTIONS.IMAGE_BITMAP, {base64: BRDF, onlyData: true})
            .then(async bitmap => {
                this.brdf = createTexture(
                    512,
                    512,
                    gpu.RGBA32F,
                    0,
                    gpu.RGBA,
                    gpu.FLOAT,
                    // BRDFBitmap,
                    bitmap,
                    gpu.LINEAR,
                    gpu.LINEAR,
                    gpu.CLAMP_TO_EDGE,
                    gpu.CLAMP_TO_EDGE
                )
                this.params.brdf = this.brdf
                this.cubeBuffer = new VBOInstance(1, new Float32Array(cube), gpu.ARRAY_BUFFER, 3, gpu.FLOAT)
                this.data.cubeBuffer = this.cubeBuffer

                this.#ready = true
                whenReady(this)
            })
            .catch(err => console.error(err))

        this.picking = new Picking()
        this.miscellaneousPass = new MiscellaneousPass(resolution)
        this.renderingPass = new RenderingPass(resolution)
        this.postProcessingPass = new PostProcessingPass(this.renderingPass.currentFrameFBO, resolution)
        specularProbes = this.renderingPass.specularProbe.probes
        diffuseProbes = this.renderingPass.diffuseProbe.probes

        // CAMERA ASPECT RATIO OBSERVER
        new ResizeObserver(() => {
            const bBox = gpu.canvas.getBoundingClientRect()
            if (this.params.camera) {
                this.params.camera.aspectRatio = bBox.width / bBox.height
                this.params.camera.updateProjection()
            }
        }).observe(gpu.canvas)
    }

    callback() {

        this.params.elapsed = performance.now() - this.then
        gpu.clear(gpu.COLOR_BUFFER_BIT | gpu.DEPTH_BUFFER_BIT)

        this.miscellaneousPass.execute(
            this.params,
            this.data,
            this.entities,
            this.data.entitiesMap,
            Packager.lights,
        )
        this.renderingPass.execute(
            this.params,
            this.data,
            this.entities,
            this.data.entitiesMap,
            Packager.lights,
            this.params.onWrap
        )
        this.postProcessingPass.execute(
            this.params,
            this.data,
            this.entities,
            this.data.entitiesMap,
            this.params.onWrap
        )

        this.frameID = requestAnimationFrame(() => this.callback())
    }

    start() {
        if (this.#ready && !this.frameID)
            this.frameID = requestAnimationFrame(() => this.callback())
    }

    stop() {
        cancelAnimationFrame(this.frameID)
        this.frameID = undefined
    }

    getEnvironment(entity) {
        const specular = specularProbes[entity.id]
        const diffuse = diffuseProbes[entity.id]

        if (diffuse)
            return {
                irradiance0: diffuse[0]?.texture,
                irradiance1: diffuse[1]?.texture,
                irradiance2: diffuse[2]?.texture,

                prefilteredMap: specular?.texture,
                ambientLODSamples: specular?.mipmaps
            }
        return {
            prefilteredMap: specular?.texture,
            ambientLODSamples: specular?.mipmaps
        }
    }
}
