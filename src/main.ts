import { Rings } from './systems/rings';


class MainApp {
    private currentScene: Rings | null = null;

    constructor() {
        this.startRingsScene();
    }

    private startRingsScene(): void {
        this.currentScene = new Rings();
        this.currentScene.animate(); // Animar la escena activa
    }
}

new MainApp();
