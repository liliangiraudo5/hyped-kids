import './style/main.scss'
import * as THREE from 'three'
import nftPaths from "../static/nft/path.json" //load image from firebase

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
        this.currentSection = 0; //permet de savoir le numéro de section dans laquelle on se trouve
        this.previousTime = 0
        this.deltaTime = 0
        this.kids = [];
        this.particles = [];
        this.cursor = {
            x: 0,
            y: 0
        }
        this.parameters = {
            materialColor: '#ffeded'
        }

        // Canvas
        this.canvas = document.querySelector('canvas.webgl')

        this.addEventListeners();
        this.init();

        console.log("Initialized")
    }

    init() {
        this.clock = new THREE.Clock();

        const renderer = this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true
        });

        renderer.setSize(this.width, this.height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

        this.scene = new THREE.Scene();

        this.addCamera();
        this.addLights();
        this.addParticles();
        this.addKids()
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

    /**
     * Créer les particules qui servent de fond de scène
     */
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

        this.particles.push(particles)
        scene.add(particles);
    }

    /**
     * Permet de load les NFT de kids et de les ajouter comme textures
     */
    addKids(){
        const { scene } = this;
        const textureLoader = new THREE.TextureLoader();

        let kidTextures = [];

        for(let url of nftPaths){
            let kidTexture = new Promise((resolve) => {
                textureLoader.load(url, texture => {
                    if (texture instanceof THREE.Texture) resolve(texture);
                });
            })

            kidTextures.push(kidTexture)
        }

        /* Le temps d'avoir + de kids */
        let kidTextures_tmp = [...kidTextures]
        kidTextures = kidTextures.concat(kidTextures_tmp)
        kidTextures = kidTextures.concat(kidTextures_tmp)

        Promise.all(kidTextures).then(loadedTextures => {
            loadedTextures.forEach(texture => {
                const kidMaterial = new THREE.MeshBasicMaterial({
                    map: texture,
                });
                kidMaterial.map.minFilter = THREE.LinearFilter;

                const randomShape = this.getRandomFloat(0.3, 0.7, 1)
                const kidGeometry = new THREE.PlaneGeometry(randomShape, randomShape);

                let kid = new THREE.Mesh(kidGeometry, kidMaterial);

                kid.position.z = this.getRandomFloat(-0.5, -20, 2)
                kid.position.x = this.getRandomFloat(-2, 2, 2, -1, 1)
                kid.position.y = this.getRandomFloat(-2, 2, 2, -1, 1)

                this.kids.push(kid);
                scene.add(kid)
            })
        })
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Fonction trigger à chaque mise à jour de la frame
     * Ici on vient animer les objets
     */
    update() {
        const elapsedTime = this.clock.getElapsedTime()
        this.deltaTime = elapsedTime - this.previousTime
        this.previousTime = elapsedTime

        //change camera on scroll
        this.camera.position.y = (- this.scrollY / this.height) * this.objectsDistance

        this.triggerParallax();

        this.animateKids()

        this.updateParticles();

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

    animateKids(){
        if(this.kids.length > 0) {
            this.kids.forEach((kid, kidId) => {
                if(this.currentSection > 1) {
                    kid.visible = false
                } else {
                    if(!kid.visible){
                        kid.visible = true;
                    }

                    kid.position.z += this.deltaTime * 7;
                    kid.position.x += this.deltaTime * 0.1 * (kidId % 2 === 0 ? -1 : 1)
                    kid.position.y += this.deltaTime * 0.1 * (kidId % 2 === 0 ? -1 : 1)

                    if(kid.position.z > 5){
                        kid.position.z = -10;
                        kid.position.x = this.getRandomFloat(-2, 2, 2, -1, 1)
                        kid.position.y = this.getRandomFloat(-2, 2, 2, -1, 1)
                    }
                }
            })
        }
    }

    updateParticles(){
        if(this.particles.length > 0){
            this.particles.forEach(particle => {
                particle.visible = this.currentSection >= 1;
            })
        }
    }

    addEventListeners() {
        window.addEventListener('mousemove', (event) => {
            this.cursor.x = event.clientX / this.width - 0.5
            this.cursor.y = event.clientY / this.height - 0.5
        })

        window.addEventListener('scroll', () => {
            this.scrollY = window.scrollY

            this.currentSection = this.round(this.scrollY / this.height, 2)
        })

        window.addEventListener('resize', () => {

            console.log("Event resize triggered")

            const { camera } = this;

            const windowWidth  = window.innerWidth;
            const windowHeight = window.innerHeight;

            camera.aspect = windowWidth / windowHeight;
            camera.updateProjectionMatrix();

            this.width = windowWidth
            this.height = windowHeight
            this.renderer.setSize(windowWidth, windowHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        });
    }

    /**
     * Permet d'arrondir un nombre à n'importe quelle décimale
     * @param number
     * @param decimals
     * @returns {number}
     */
    round(number, decimals = 0) {
        const tenFactor = Math.pow(10, decimals);
        return Math.round(number * tenFactor) / tenFactor;
    }

    /**
     * Génère un nombre aléatoire dans un range précis
     * @param min
     * @param max
     * @param decimals
     * @param minExclude
     * @param maxExclude
     * @returns {number}
     */
    getRandomFloat(min = 0, max = 10, decimals = 0, minExclude, maxExclude){
        const str = (Math.random() * (max - min) + min).toFixed(decimals);

        let random = parseFloat(str);

        if(minExclude && maxExclude) {
            if(minExclude < random && random < maxExclude ){
                this.getRandomFloat(min, max, decimals, minExclude, maxExclude)
            }
        }

        return random;
    }
}
