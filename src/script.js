import './style.css'
import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM ready")

    const smoke = new Smoke();
    smoke.update();

    setTimeout(function(){
        document.querySelector('body').dispatchEvent(new Event('resize'))
    },2000);
})

class Smoke {

    constructor() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.modelLoaded = false;
        this.cursor = {
            x: 0,
            y: 0
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
        this.previousTime = 0

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
        this.addModel();
    }

    evolveSmokeAndModel() {
        const { smokeParticles } = this;
        const elapsedTime = this.clock.getElapsedTime()
        const deltaTime = elapsedTime - this.previousTime
        this.previousTime = elapsedTime

        const parallaxX = this.cursor.x * 30
        const parallaxY = - this.cursor.y * 30
        this.cameraGroup.position.x += (parallaxX - this.cameraGroup.position.x) * 5 * deltaTime
        this.cameraGroup.position.y += (parallaxY - this.cameraGroup.position.y) * 5 * deltaTime

        if(this.modelLoaded && typeof this.modelObject === 'object'){
            this.modelObject.rotation.y += deltaTime * 0.2;
        }

        let smokeParticlesLength = smokeParticles.length;
        while(smokeParticlesLength--) {
            smokeParticles[smokeParticlesLength].rotation.z += deltaTime * 0.2;
        }
    }

    addLights() {
        const { scene } = this;
        const light = new THREE.DirectionalLight(0xffffff, 0.75);

        light.position.set(-1, 0, 1);
        scene.add(light);
    }

    addCamera() {
        const { scene } = this;
        const cameraGroup = this.cameraGroup = new THREE.Group()
        const camera = this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 1, 10000);

        camera.position.z = 1000;
        scene.add(cameraGroup)
        cameraGroup.add(camera);
    }

    addParticles() {
        const { scene } = this;
        const textureLoader = new THREE.TextureLoader();
        this.smokeParticles = [];

        textureLoader.load('/textures/clouds.png', texture => {
            const smokeMaterial = new THREE.MeshLambertMaterial({
                color: 0xCC00FF,
                map: texture,
                transparent: true
            });
            smokeMaterial.map.minFilter = THREE.LinearFilter;
            const smokeGeometry = new THREE.PlaneBufferGeometry(300, 300);

            const smokeMeshes = [];
            let limit = 80;

            while(limit--) {
                smokeMeshes[limit] = new THREE.Mesh(smokeGeometry, smokeMaterial);
                smokeMeshes[limit].position.set(Math.random() * 500 - 250, Math.random() * 500 - 250, Math.random() * 1000 - 100);
                smokeMeshes[limit].rotation.z = Math.random() * 360;
                this.smokeParticles.push(smokeMeshes[limit]);
                scene.add(smokeMeshes[limit]);
            }
        });
    }

    addModel(){
        const fbxLoader = new FBXLoader()
        fbxLoader.load(
            'models/hypedkids-polygon.fbx',
            (object) => {
                object.traverse( function ( child ) {
                    if( child.material ) {
                        child.material = new THREE.MeshPhongMaterial( {
                            color: 0xCC00FF,
                            wireframe: true
                        } );
                    }
                });

                object.scale.set(10, 10, 10)
                object.position.set(20, -1800, 100)

                this.modelLoaded = true;
                this.scene.add(object)
                this.modelObject = object;

                console.log("Model loaded & mounted")
            },
            (xhr) => {
                console.log('Model : ' + (xhr.loaded / xhr.total) * 100 + '% loaded')
            },
            (error) => {
                console.log("Model", error)
            }
        )
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    update() {
        this.evolveSmokeAndModel();
        this.render();

        window.requestAnimationFrame(this.update.bind(this));
    }

    addEventListeners() {
        window.addEventListener('resize', this.onResize);

        window.addEventListener('mousemove', (event) => {
            this.cursor.x = event.clientX / this.width - 0.5
            this.cursor.y = event.clientY / this.height - 0.5
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
