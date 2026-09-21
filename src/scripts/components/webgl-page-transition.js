import * as THREE from "three";
import vertexShader from "../shader/vertex.glsl";
import fragmentShader from "../shader/fragment.glsl";
import { hexToRgb } from "../utils";

class WebGLPageTransition {
  constructor() {
    const rootStyle = getComputedStyle(document.documentElement);

    this.color = hexToRgb(rootStyle.getPropertyValue("--about-background"));

    this.dimension = {
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: Math.min(window.devicePixelRatio, 1),
    };

    this.cameraZ = 100;

    this.createScene();
    this.createCamera();
    this.createRenderer();
    this.createGeometry();
    this.createMesh();

    this.onResize();

    this.updateMeshSize();
  }

  createScene() {
    this.scene = new THREE.Scene();
  }

  createCamera() {
    const fov =
      2 * Math.atan(this.dimension.height / 2 / this.cameraZ) * (180 / Math.PI);
    this.camera = new THREE.PerspectiveCamera(
      fov,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );

    this.scene.add(this.camera);

    this.camera.position.z = this.cameraZ;
  }

  createRenderer() {
    const canvas = document.querySelector("#webgl");

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });

    this.renderer.setSize(this.dimension.width, this.dimension.height);
    this.renderer.render(this.scene, this.camera);

    this.renderer.setPixelRatio(this.dimension.pixelRatio);
  }

  createGeometry() {
    this.geometry = new THREE.PlaneGeometry(1, 1);
  }

  createMesh() {
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uColor: {
          value: new THREE.Vector3(
            this.color.r / 255,
            this.color.g / 255,
            this.color.b / 255,
          ),
        },
        uProgress: {
          value: 1.5,
        },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);

    this.scene.add(this.mesh);
  }

  updateMeshSize() {
    this.mesh.scale.set(this.dimension.width, this.dimension.height, 1);
  }

  onResize() {
    this.dimension.width = window.innerWidth;
    this.dimension.height = window.innerHeight;
    this.dimension.pixelRatio = Math.min(window.devicePixelRatio, 1);

    // Resize camera
    this.camera.aspect = this.dimension.width / this.dimension.height;
    this.camera.fov =
      2 * Math.atan(this.dimension.height / 2 / this.cameraZ) * (180 / Math.PI);
    this.camera.updateProjectionMatrix();

    // Resize renderer
    this.renderer.setSize(this.dimension.width, this.dimension.height);
    this.renderer.setPixelRatio(this.dimension.pixelRatio);

    this.updateMeshSize();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}

export default WebGLPageTransition;
