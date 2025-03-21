import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { GUI } from 'dat.gui';

import vertexShaderRings from '../shaders/vertexShaderRing.glsl';
import fragmentShaderRings from '../shaders/fragmentShaderRing.glsl';
import vertexShaderBlack from '../shaders/vertexShaderBlack.glsl';
import fragmentShaderBlack from '../shaders/fragmentShaderBlack.glsl';
import vertexShaderExp from '../shaders/vertexShaderExp.glsl';
import fragmentShaderExp from '../shaders/fragmentShaderExp.glsl';
import vertexShaderLightning from '../shaders/vertexShaderLightning.glsl';
import fragmentShaderLightning from '../shaders/fragmentShaderLightning.glsl';

// Clase para la escena
export class Rings {
    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    public renderer: THREE.WebGLRenderer;
    public material: THREE.RawShaderMaterial;
    public controls: OrbitControls;
    public gui: GUI;
    private saturn: THREE.Group;
    private particleSystemBlack: THREE.Points;
    private blackHolePosition = new THREE.Vector3(2000, 100, 2000);
    private explosions: THREE.Points[] = [];

    public cameraConfig = {
        fov: 75,
        aspect: window.innerWidth / window.innerHeight,
        near: 0.1,
        far: 20000
    };

    // Uniforms para los anillos
    public uniforms = {
        u_time: { value: 0.0 },
        u_speed: { value: 3.0 },
        u_amplitude: { value: 0.1 },
        u_waveHeight: { value: 0.1 },
        u_ringAngle: { value: 0.0 },
        u_yAngle: { value: 0.0 },
    };

    // Uniforms para las particulas del agujero negro
    public uniformsBlack = {
        u_time: { value: 0.0 },
        u_blackHolePos: { value: this.blackHolePosition },
        u_turbulence: { value: 0.05 },
    };

    // Uniforms para las explosiones
    public uniformsExp = {
        u_intensity: { value: 1.0 },
    };

    // Uniforms para rayos
    public uniformsLigh = {
        u_time: { value: 0.0 },
        u_colorStart: { value: new THREE.Color(0.8, 0.8, 1.0) },
        u_colorEnd: { value: new THREE.Color(1.0, 0.5, 0.2) },
    }

    // Constructor
    constructor() {
        // Crear escena
        this.scene = new THREE.Scene();

        // Crear cámara
        this.camera = new THREE.PerspectiveCamera(
            this.cameraConfig.fov,
            this.cameraConfig.aspect,
            this.cameraConfig.near,
            this.cameraConfig.far
        );
        this.camera.position.set(0, 15, 40);

        // Crear renderizador
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        // Controles de cámara
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;

        // Añadir Skybox
        this.addSkybox();

        // Crear GUI
        this.gui = new GUI();
        this.setupGUI();

        // Inicializar partículas
        this.initParticles();
        this.initSaturn();
        this.addMoons();
        this.createBlackHole(this.blackHolePosition);
        this.particleSystemBlack = this.createMeteoriteParticles(50, this.blackHolePosition);
        this.setupExplosions();
        this.createMultipleLightnings(10);

        // Manejar eventos de redimensionamiento
        window.addEventListener('resize', () => this.onWindowResize());

        // Animar la escena
        this.animate();
    }

    // Crear particulas para los anillos
    private initParticles(): void {
        const n_particles = 100000;
        const positions = new Float32Array(n_particles * 3);
        const sizes = new Float32Array(n_particles);
        const colors = new Float32Array(n_particles * 3);

        for (let i = 0; i < n_particles; i++) {
            const band = Math.random();
            let radius;
            let color;
            if (band < 0.4) {
                radius = Math.random() * 2 + 12; // Banda más interna
                color = [101, 95, 69];
            } else if (band < 0.7) {
                radius = Math.random() * 6 + 13; // Banda media
                color = [216, 174, 109];
            } else {
                radius = Math.random() * 2 + 14; // Banda externa
                color = [255, 225, 171];
            }
    
            // Posiciones de las partículas
            const angle = Math.random() * Math.PI * 2;            // Ángulo
            positions[i * 3] = Math.cos(angle) * radius;          // eje x
            positions[i * 3 + 1] = (Math.random() - 0.5) * 0.2;   // eje
            positions[i * 3 + 2] = Math.sin(angle) * radius;      // eje z

            // Tamaño de las particulas
            sizes[i] = Math.random() * 2 + 1;

            // Colores para las partículas
            colors[i * 3] = color[0];
            colors[i * 3 + 1] = color[1];
            colors[i * 3 + 2] = color[2];
        }

        // Crear geometría
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        // Crear material
        this.material = new THREE.RawShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: vertexShaderRings,
            fragmentShader: fragmentShaderRings,
            transparent: true,
            vertexColors: true, 
            glslVersion: THREE.GLSL3,
        });

        const particlesSystem = new THREE.Points(geometry, this.material);
        this.scene.add(particlesSystem);
    }

    // Crear Saturno
    private initSaturn(): void {
        this.saturn = new THREE.Group();

        const planetGeometry = new THREE.SphereGeometry(10, 32, 32);
        const textureLoader = new THREE.TextureLoader();
        const saturnTexture = textureLoader.load('system_1/Saturn242.webp');
        const planetMaterial = new THREE.MeshStandardMaterial({
            map: saturnTexture,
            roughness: 0.5,
            metalness: 0.0,
        });
        const planet = new THREE.Mesh(planetGeometry, planetMaterial);

        this.saturn.add(planet);

        this.scene.add(this.saturn);

        // Se crea una luz puntual
        const light = new THREE.PointLight(0xffffff, 500, 100);
        light.position.set(0, 20, 30);
        this.scene.add(light);

        // Se crea una luz ambiental
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
        this.scene.add(ambientLight);   
    }

    // Añadir Skybox
    private addSkybox(): void {
        const textureLoader = new THREE.TextureLoader();
        // Configuración de las texturas para cada lado del cubo
        const materialArray = [
            new THREE.MeshBasicMaterial({ map: textureLoader.load('system_1/skybox_left.png'), side: THREE.BackSide }),
            new THREE.MeshBasicMaterial({ map: textureLoader.load('system_1/skybox_right.png'), side: THREE.BackSide }),
            new THREE.MeshBasicMaterial({ map: textureLoader.load('system_1/skybox_up.png'), side: THREE.BackSide }),
            new THREE.MeshBasicMaterial({ map: textureLoader.load('system_1/skybox_down.png'), side: THREE.BackSide }),
            new THREE.MeshBasicMaterial({ map: textureLoader.load('system_1/skybox_front.png'), side: THREE.BackSide }),
            new THREE.MeshBasicMaterial({ map: textureLoader.load('system_1/skybox_back.png'), side: THREE.BackSide }),
        ];
    
        const skyboxGeometry = new THREE.BoxGeometry(10000, 10000, 10000);
        const skybox = new THREE.Mesh(skyboxGeometry, materialArray);
        this.scene.add(skybox);
    }

    // Añadir lunas a Saturno
    private addMoons(): void {
        const moonData = [
            { name: 'Mimas', radius: 0.8, distance: 22, speed: 0.025, color: 0xffffff },
            { name: 'Enceladus', radius: 1, distance: 26, speed: 0.02, color: 0xccccff },
            { name: 'Rhea', radius: 1.2, distance: 30, speed: 0.015, color: 0xaaaaaa },
            { name: 'Titan', radius: 2, distance: 35, speed: 0.01, color: 0xffcc66 },
        ];
    
        const moonsGroup = new THREE.Group();
    
        moonData.forEach((moon) => {
            const geometry = new THREE.SphereGeometry(moon.radius, 16, 16);
            const material = new THREE.MeshStandardMaterial({ color: moon.color });
            const moonMesh = new THREE.Mesh(geometry, material);
    
            moonMesh.position.set(moon.distance, 0, 0);
            (moonMesh as any).orbitData = { distance: moon.distance, speed: moon.speed };
    
            moonsGroup.add(moonMesh);
        });
    
        this.saturn.add(moonsGroup);
    }

    // Crear la esfera para el agujero negro
    private createBlackHole(position: THREE.Vector3): THREE.Mesh {
        const geometry = new THREE.SphereGeometry(5, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: 0x000000, // Negro puro
            emissive: new THREE.Color(0x222222), // Resplandor tenue
            emissiveIntensity: 0.5,
        });
    
        const blackHole = new THREE.Mesh(geometry, material);
        blackHole.position.copy(position);
        this.scene.add(blackHole);
    
        return blackHole;
    }

    // Crear partículas para las meteoritos alrededor del agujero negro
    private createMeteoriteParticles(numParticles: number, blackHolePosition: THREE.Vector3): THREE.Points {
        const positions = new Float32Array(numParticles * 3);
        const velocities = new Float32Array(numParticles * 3);
        const colors = new Float32Array(numParticles * 3);
        const sizes = new Float32Array(numParticles);
    
        const minRadius = 500;
        const maxRadius = 1000;
    
        for (let i = 0; i < numParticles; i++) {
            // Generar posición aleatoria dentro del rango
            const r = Math.random() * (maxRadius - minRadius) + minRadius;
            const theta = Math.random() * Math.PI * 2; 
            const phi = Math.acos(2 * Math.random() - 1);
    
            // Convertir coordenadas esféricas a cartesianas
            positions[i * 3] = blackHolePosition.x + r * Math.sin(phi) * Math.cos(theta); // X
            positions[i * 3 + 1] = blackHolePosition.y + r * Math.sin(phi) * Math.sin(theta); // Y
            positions[i * 3 + 2] = blackHolePosition.z + r * Math.cos(phi); // Z
    
            // Velocidades iniciales
            velocities[i * 3] = (Math.random() - 0.5) * 0.05;
            velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.05;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
    
            
            const grey = Math.random() * 0.5 + 0.5;
            colors[i * 3] = grey;
            colors[i * 3 + 1] = grey;
            colors[i * 3 + 2] = grey;
    

            sizes[i] = Math.random() * 4 + 1;
        }
    
        // Crear geometría de las partículas
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
        // Crear material
        const material = new THREE.RawShaderMaterial({
            uniforms: this.uniformsBlack,
            vertexShader: vertexShaderBlack, // Vertex shader para partículas
            fragmentShader: fragmentShaderBlack, // Fragment shader para partículas
            transparent: true,
            vertexColors: true,
            glslVersion: THREE.GLSL3,
        });
    
        const particleSystem = new THREE.Points(geometry, material);
        this.scene.add(particleSystem);
    
        return particleSystem;
    }

    // Animación de las particulas del agujero negro
    private animateMeteoriteParticles(particleSystem: THREE.Points, blackHolePosition: THREE.Vector3): void {
        const positions = particleSystem.geometry.attributes.position.array as Float32Array;
        const velocities = particleSystem.geometry.attributes.velocity.array as Float32Array;
    
        const collisionRadius = 50;
    
        for (let i = 0; i < positions.length / 3; i++) {
            // Calcular dirección hacia el agujero negro
            const dirX = blackHolePosition.x - positions[i * 3];
            const dirY = blackHolePosition.y - positions[i * 3 + 1];
            const dirZ = blackHolePosition.z - positions[i * 3 + 2];
    
            const distance = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
    
            // Detectar si la partícula está dentro del radio del agujero negro
            if (distance < collisionRadius) {
                const minRadius = 500;
                const maxRadius = 1000;
    
                const r = Math.random() * (maxRadius - minRadius) + minRadius;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
    
                positions[i * 3] = blackHolePosition.x + r * Math.sin(phi) * Math.cos(theta);
                positions[i * 3 + 1] = blackHolePosition.y + r * Math.sin(phi) * Math.sin(theta);
                positions[i * 3 + 2] = blackHolePosition.z + r * Math.cos(phi);
    
                // Reiniciar velocidades
                velocities[i * 3] = (Math.random() - 0.5) * 0.05;
                velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.05;
                velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
    
                continue;
            }
    
            // Actualizar velocidad hacia el agujero negro
            const direction = [dirX / distance, dirY / distance, dirZ / distance];
            velocities[i * 3] += direction[0] * 0.01;
            velocities[i * 3 + 1] += direction[1] * 0.01;
            velocities[i * 3 + 2] += direction[2] * 0.01;
    
            // Actualizar posición
            positions[i * 3] += velocities[i * 3];
            positions[i * 3 + 1] += velocities[i * 3 + 1];
            positions[i * 3 + 2] += velocities[i * 3 + 2];
        }
    
        particleSystem.geometry.attributes.position.needsUpdate = true;
        particleSystem.geometry.attributes.velocity.needsUpdate = true;
    }

    // Crear explosión 
    private createExplosion(position: THREE.Vector3, numParticles: number): THREE.Points {
        const positions = new Float32Array(numParticles * 3);
        const velocities = new Float32Array(numParticles * 3);
        const colors = new Float32Array(numParticles * 3);
        const sizes = new Float32Array(numParticles);
    
        for (let i = 0; i < numParticles; i++) {
            // Calcular dirección aleatoria en una esfera completa
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
        
            // Convertir dirección esférica a cartesianas
            const speed = 10.0;
            velocities[i * 3] = speed * Math.sin(phi) * Math.cos(theta); // X
            velocities[i * 3 + 1] = speed * Math.sin(phi) * Math.sin(theta); // Y
            velocities[i * 3 + 2] = speed * Math.cos(phi); // Z
        
            // Centro de la explosión como posición inicial
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y;
            positions[i * 3 + 2] = position.z;
        
            colors[i * 3] = Math.random();
            colors[i * 3 + 1] = Math.random() * 0.5 + 0.5;
            colors[i * 3 + 2] = 0;
            sizes[i] = Math.random() * 5 + 3;
        }
        
    
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
        const material = new THREE.RawShaderMaterial({
            uniforms: {
                u_time: { value: 0.0 },
                u_intensity: this.uniformsExp.u_intensity,
            },
            vertexShader: vertexShaderExp,
            fragmentShader: fragmentShaderExp, 
            transparent: true,
            vertexColors: true,
            glslVersion: THREE.GLSL3,
        });
    
        const explosion = new THREE.Points(geometry, material);
        this.scene.add(explosion);
    
        return explosion;
    }

    // Animación de la explosión
    private animateExplosion(explosion: THREE.Points): void {
        const material = explosion.material as THREE.RawShaderMaterial;
        material.uniforms.u_time.value += 0.02;
        
        if (material.uniforms.u_time.value > 2.0) {
             this.scene.remove(explosion);
            explosion.geometry.dispose();
        }
    }

    // Configurar la explosión
    private setupExplosions(): void {
        setInterval(() => {
            const position = new THREE.Vector3(
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 100 
            );
    
            const explosion = this.createExplosion(position, 500);
            this.explosions.push(explosion);
        }, 5000);
    }

    // Crear ramificación de los rayos
    private createFractalLightning(start: THREE.Vector3, end: THREE.Vector3, depth: number): Float32Array {
        const positions: THREE.Vector3[] = [];
        const addBranch = (start: THREE.Vector3, end: THREE.Vector3, depth: number) => {
            if (depth <= 0) {
                positions.push(start, end);
                return;
            }
    
            // Punto intermedio con desviación aleatoria
            const mid = start.clone().lerp(end, 0.5).add(new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2 
            ));
    
            addBranch(start, mid, depth - 1); // Rama izquierda
            addBranch(mid, end, depth - 1);   // Rama derecha
        };
    
        // Generar el rayo principal con ramificaciones
        addBranch(start, end, depth);

    
        const flatPositions = new Float32Array(positions.length * 3);
        positions.forEach((v, i) => {
            flatPositions[i * 3] = v.x;
            flatPositions[i * 3 + 1] = v.y;
            flatPositions[i * 3 + 2] = v.z;
        });
    
        return flatPositions;
    }

    // Crear varios rayos
    private createMultipleLightnings(numRays: number) {
        for (let i = 0; i < numRays; i++) {
            const start = new THREE.Vector3(
                (Math.random() - 0.5) * 20, 
                40,                       
                (Math.random() - 0.5) * 20 
            );
            const end = new THREE.Vector3(
                (Math.random() - 0.5) * 10, 
                10,                         
                (Math.random() - 0.5) * 10 
            );
    
            // Crear un rayo único entre los puntos
            this.createLightning(start, end);
        }
    }

    // Crear rayo
    private createLightning(start: THREE.Vector3, end: THREE.Vector3) {
        const depth = 5; // Nivel de detalle del fractal
        const positions = this.createFractalLightning(start, end, depth);
    
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
        const material = new THREE.RawShaderMaterial({
            uniforms: this.uniformsLigh,
            vertexShader: vertexShaderLightning,
            fragmentShader: fragmentShaderLightning,
            transparent: true,
            glslVersion: THREE.GLSL3,
        });
    
        const lightning = new THREE.LineSegments(geometry, material); // Usar LineSegments para unir puntos
        this.scene.add(lightning);
    }
    
    // Configurar GUI
    private setupGUI(): void {
        this.gui.add(this.uniforms.u_speed, 'value', 0, 10).name('Speed');
        this.gui.add(this.uniforms.u_amplitude, 'value', 0, 2).name('Radial Oscillation');
        this.gui.add(this.uniforms.u_waveHeight, 'value', 0, 1).name('Vertical Waves');
        this.gui.add(this.uniforms.u_ringAngle, 'value', 0, Math.PI).name('X Angle'); // Rotación sobre X
        this.gui.add(this.uniforms.u_yAngle, 'value', 0, Math.PI).name('Y Angle');
        this.gui.add(this.uniformsBlack.u_turbulence, 'value', 0.01, 0.5).name('Turbulence');
        this.gui.add(this.uniformsExp.u_intensity, 'value', 0.5, 5.0).name('Explosion Intensity');
    }

    private onWindowResize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // Animación de la escena
    public animate(): void {
        requestAnimationFrame(() => this.animate());
        this.uniforms.u_time.value += 0.02;
        this.uniformsBlack.u_time.value += 0.005;
    
        // Rotar las lunas alrededor de Saturno
        this.saturn.children.forEach((group) => {
            group.children.forEach((moon) => {
                if ((moon as any).orbitData) {
                    const orbitData = (moon as any).orbitData;
                    const time = this.uniforms.u_time.value * orbitData.speed;
                    moon.position.set(
                        Math.cos(time) * orbitData.distance,
                        0,
                        Math.sin(time) * orbitData.distance
                    );
                }
            });
        });

        // Animar todas las explosiones activas
        this.explosions.forEach((explosion, index) => {
            this.animateExplosion(explosion);

            // Eliminar del arreglo si termino
            if ((explosion.material as THREE.RawShaderMaterial).uniforms.u_time.value > 2.0) {
                this.explosions.splice(index, 1);
            }
        });

        // Animar los rayos
        this.scene.children.forEach((child, index) => {
            if (child instanceof THREE.LineSegments) {
                child.visible = Math.sin(this.uniforms.u_time.value + index) > 0;
            }
        });

        // Animar las partículas de los meteoritos hacia el agujero negro
        this.animateMeteoriteParticles(this.particleSystemBlack, this.blackHolePosition);
    
        // Actualizar controles y renderizar la escena
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}
