import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { modalParams } from "@/packages/index";
import * as THREE from "three";
class Floor {
  constructor(vue, config) {
    // 模型加载进度
    this.progress = 0;
    // 模型是否加载完成
    this.loadSuccess = false;
    // 模型相关信息
    this.modelConfig = {
      index: 1,
      name: "一楼",
      scale: 6,
      url: "/modal/f1.glb",
      position: {
        x: 300,
        y: 0,
        z: -20,
      },
    };
    // 主模型数据
    this.modalInfo = {};
    // 子模型数据
    this.modalList = [];

    this.setConfig(vue, config);
    vue.$nextTick(() => {
      modalParams.initRenderer();
      modalParams.initScene();
      modalParams.initCamera();
      modalParams.initLight();
      modalParams.animate();
      modalParams.addListener();
      this.initModal();
    });
  }

  //设置初始值
  setConfig(vue, config) {
    modalParams.vueRef = vue;
    modalParams.domRef = config.domRef;
    modalParams.width = config.width ? config.width : modalParams.width;
    modalParams.height = config.height ? config.height : modalParams.height;
    modalParams.domRef.style.width = modalParams.width;
    modalParams.domRef.style.height = modalParams.height;
    modalParams.clearColor = config.clearColor
      ? config.clearColor
      : modalParams.clearColor;
    modalParams.clearColorOpacity = config.clearColorOpacity
      ? config.clearColorOpacity
      : modalParams.clearColorOpacity;
    modalParams.rendererClassName = config.rendererClassName
      ? config.rendererClassName
      : modalParams.rendererClassName;
    modalParams.showGrid = config.showGrid
      ? config.showGrid
      : modalParams.showGrid;
    modalParams.cameraConfig = {
      ...modalParams.cameraConfig,
      ...config.cameraConfig,
    };
    modalParams.lightConfig = {
      ...modalParams.lightConfig,
      ...config.lightConfig,
    };
    modalParams.outlineConfig = {
      ...modalParams.outlineConfig,
      ...config.outlineConfig,
    };

    this.modelConfig = {
      ...this.modelConfig,
      ...config.modelConfig,
    };
  }
  // 引入楼层模型 gltf/glb
  initModal() {
    const gltfLoader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("modal/draco/"); // 这个是加载draco算法，这样才能解析压缩后的gltf模型格式.
    gltfLoader.setDRACOLoader(dracoLoader);
    // 引入默认纹理
    gltfLoader.load(
      this.modelConfig.url,
      (gltf) => {
        const modal = gltf.scene;
        modal.name = this.modelConfig.name;
        let position = this.modelConfig.position;
        modal.position.set(position.x, position.y, position.z);
        modal.scale.set(
          this.modelConfig.scale,
          this.modelConfig.scale,
          this.modelConfig.scale
        );
        this.modalInfo = modal;
        this.modalList = modal.children;
        modalParams.floorModal = modal;
        modalParams.scene.add(modal);
        // 创建一个 AxesHelper 并添加到 Group 中
        let axesHelper = new THREE.AxesHelper(50); // 参数定义轴的大小
        modal.add(axesHelper);
        modalParams.renderer.render(modalParams.scene, modalParams.camera);
      },
      (xhr) => {
        const percentage = Math.floor((xhr.loaded / xhr.total) * 100);
        this.progress = `${percentage}%`;
        if (percentage >= 100) {
          let that = this;
          setTimeout(() => {
            that.loadSuccess = true;
            window.dispatchEvent(
              new CustomEvent("floorModalCompleted", {
                detail: that.modelConfig.index,
              })
            );
          }, 1000);
        }
      }
    );
  }
}

export default Floor;
