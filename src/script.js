import './style.css'
import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'

class Smoke {

    constructor(options) {
        const defaults = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        Object.assign(this, options, defaults);
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

        const meshGeometry = new THREE.BoxGeometry(200, 200, 200);
        const meshMaterial = new THREE.MeshLambertMaterial({
            color: 0xaa6666,
            wireframe: false
        });
        this.mesh = new THREE.Mesh(meshGeometry, meshMaterial);

        this.cubeSineDriver = 0;

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

        let smokeParticlesLength = smokeParticles.length;

        if(typeof this.modelObject === 'object'){
            this.modelObject.rotation.y += deltaTime * 0.2;
        }

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
        const camera = this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 1, 10000);

        camera.position.z = 1000;
        scene.add(camera);
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

                this.scene.add(object)
                this.modelObject = object;
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
            },
            (error) => {
                console.log(error)
            }
        )
    }

    render() {
        const { mesh } = this;
        let { cubeSineDriver } = this;

        cubeSineDriver += 0.01;

        mesh.rotation.x += 0.005;
        mesh.rotation.y += 0.01;
        mesh.position.z = 100 + Math.sin(cubeSineDriver) * 500;

        this.renderer.render(this.scene, this.camera);
    }

    update() {
        this.evolveSmokeAndModel();
        this.render();

        requestAnimationFrame(this.update.bind(this));
    }

    onResize() {
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

    addEventListeners() {
        window.addEventListener('resize', this.onResize);
    }

}

/* app.js */

const smoke = new Smoke();

smoke.update();
