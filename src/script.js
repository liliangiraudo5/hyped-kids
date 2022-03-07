import './style/main.scss'
import * as THREE from 'three'

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM ready")

    const app = new App();
    app.update();

    setTimeout(function(){
        window.dispatchEvent(new Event('resize'))
    },2000);
})

class App {

    constructor() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.scrollY = window.scrollY;
        this.objectsDistance = 4;
        this.previousTime = 0
        this.deltaTime = 0
        this.cursor = {
            x: 0,
            y: 0
        }
        this.parameters = {
            materialColor: '#ffeded'
        }

        this.onResize = this.onResize.bind(this);

        // Canvas
        this.canvas = document.querySelector('canvas.webgl')

        this.addEventListeners();
        this.init();

        console.log("Initialized")
    }

    init() {
        const { width, height } = this;

        this.clock = new THREE.Clock();

        const renderer = this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true
        });

        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

        this.scene = new THREE.Scene();

        this.addCamera();
        this.addLights();
        this.addParticles();
    }

    addLights() {
        const { scene } = this;
        const light = new THREE.DirectionalLight(('#ffffff'), 1);

        light.position.set(1, 1, 0);
        scene.add(light);
    }

    addCamera() {
        const { scene } = this;
        const cameraGroup = this.cameraGroup = new THREE.Group()
        scene.add(cameraGroup)

        const camera = this.camera = new THREE.PerspectiveCamera(35, this.width / this.height, 0.1, 100)

        camera.position.z = 6;
        cameraGroup.add(camera);
    }

    addParticles() {
        const { scene, objectsDistance } = this;
        const particlesCount = 400
        const positions = new Float32Array(particlesCount * 3)

        for(let i = 0; i < particlesCount; i++)
        {
            positions[i * 3] = (Math.random() - 0.5) * 10
            positions[i * 3 + 1] = objectsDistance * 0.5 - Math.random() * objectsDistance * 3
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10
        }

        const particlesGeometry = new THREE.BufferGeometry()
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

        // Material
        const particlesMaterial = new THREE.PointsMaterial({
            color: this.parameters.materialColor,
            sizeAttenuation: true,
            size: 0.03
        })

        // Points
        const particles = new THREE.Points(particlesGeometry, particlesMaterial)

        scene.add(particles);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    update() {
        const elapsedTime = this.clock.getElapsedTime()
        this.deltaTime = elapsedTime - this.previousTime
        this.previousTime = elapsedTime

        //change camera on scroll
        this.camera.position.y = (- this.scrollY / this.height) * this.objectsDistance

        this.triggerParallax();

        this.render();

        // Call update again on the next frame
        window.requestAnimationFrame(this.update.bind(this));
    }

    triggerParallax() {
        const parallaxX = this.cursor.x * 0.5
        const parallaxY = - this.cursor.y * 0.5
        this.cameraGroup.position.x += (parallaxX - this.cameraGroup.position.x) * 5 * this.deltaTime
        this.cameraGroup.position.y += (parallaxY - this.cameraGroup.position.y) * 5 * this.deltaTime
    }

    addEventListeners() {
        window.addEventListener('resize', this.onResize);

        window.addEventListener('mousemove', (event) => {
            this.cursor.x = event.clientX / this.width - 0.5
            this.cursor.y = event.clientY / this.height - 0.5
        })

        window.addEventListener('scroll', () => {
            this.scrollY = window.scrollY
        })
    }

    onResize() {
        console.log('Resize Event Triggered')

        const { camera } = this;

        const windowWidth  = window.innerWidth;
        const windowHeight = window.innerHeight;

        camera.aspect = windowWidth / windowHeight;
        camera.updateProjectionMatrix();

        this.width = windowWidth
        this.height = windowHeight
        this.renderer.setSize(windowWidth, windowHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }

}

