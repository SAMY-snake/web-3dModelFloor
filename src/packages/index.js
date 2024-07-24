import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { GammaCorrectionShader } from "three/addons/shaders/GammaCorrectionShader.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";
import TWEEN from "@tweenjs/tween.js";
import Floor from "@/packages/floor/js/index.js";
import Camera from "@/packages/camera/js/index.js";
import Wall from "@/packages/wall/js/index.js";
import Person from "@/packages/person/js/index.js";
import { color } from "three/examples/jsm/nodes/Nodes.js";

const modalParams = {
  // vue实例-代指this
  vueRef: null,
  // canvas对应的dom元素
  domRef: null,
  // 声明渲染器
  renderer: null,
  // 标签渲染器
  labelRenderer: null,
  // 标签渲染器class名称
  rendererClassName: "renderer-wrap",
  // 需要加载动画的模型
  animataModalMap: {},
  // 声明相机
  camera: null,
  // 声明场景
  scene: null,
  // 声明相机控制器
  controls: null,
  // 效果合成器
  composer: null,
  //
  outlinePass: null,
  //场景通道
  renderPass: null,
  // 是否显示网格辅助线
  showGrid: false,
  // 楼层模型对象
  floorModal: null,
  // 画布大小
  width: "100vw",
  height: "100vh",
  clientWidth: "",
  clientHeight: "",
  // 渲染器背景色
  clearColor: "#ffffff",
  // 渲染器背景色透明度
  clearColorOpacity: 0.1,
  // 相机相关配置
  cameraConfig: {
    position: {
      x: -400,
      y: 400,
      z: 400,
    },
  },
  // 灯光相关配置
  lightConfig: {
    ambientLight: {
      show: true,
      color: "#ffffff",
      level: 1,
    },
    directionalLight: {
      show: true,
      color: "#ffffff",
      level: 2,
    },
  },
  // 选中高亮设置
  outlineConfig: {
    edgeThickness: 1,
    pulsePeriod: 1,
    visibleColor: "#f4ea2a",
    hiddenColor: "#f4ea2a",
  },
  //动画渲染调用ID
  animateId: 0,

  // 初始化渲染器
  initRenderer() {
    // 实例化渲染器
    this.renderer = new THREE.WebGLRenderer({
      antialias: true, // 是否开启抗锯齿
      alpha: true, // 是否可以将背景色设置为透明
    });
    // 设置渲染区域尺寸
    this.renderer.setSize(this.domRef.offsetWidth, this.domRef.offsetHeight);
    // 告诉渲染器需要阴影效果
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // 设置背景色
    this.renderer.setClearColor(this.clearColor, this.clearColorOpacity); // 设置背景颜色
    this.domRef.appendChild(this.renderer.domElement);
    // 初始化标签
    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(
      this.domRef.offsetWidth,
      this.domRef.offsetHeight
    );
    this.labelRenderer.domElement.style.position = "absolute";
    this.labelRenderer.domElement.style.top = 0;
    this.labelRenderer.domElement.style.pointerEvents = "none";
    this.labelRenderer.domElement.className = this.rendererClassName;
    this.domRef.appendChild(this.labelRenderer.domElement);
  },
  // 初始化场景
  initScene() {
    // 实例化场景
    this.scene = new THREE.Scene();
    // 场景天空盒
    const textureCubeLoader = new THREE.CubeTextureLoader().setPath(
      "/texture/"
    );
    const textureCube = textureCubeLoader.load([
      "1.jpg",
      "2.jpg",
      "3.jpg",
      "4.jpg",
      "5.jpg",
      "6.jpg",
    ]);

    this.scene.background = textureCube;
    this.scene.environment = textureCube;
    if (this.showGrid) {
      const grid = new THREE.GridHelper(2000, 20, "#ffffff", "#ffffff");
      grid.material.opacity = 0.2;
      grid.material.transparent = true;
      this.scene.add(grid);
    }
    // 红线是X轴，绿线是Y轴，蓝线是Z轴
    // var axesHelper = new THREE.AxesHelper(5)
    // this.scene.add(axesHelper)
  },
  // 初始化相机
  initCamera() {
    this.clientWidth = this.domRef.clientWidth;
    this.clientHeight = this.domRef.clientHeight;
    const k = this.clientWidth / this.clientHeight; // 窗口宽高比
    // 参数：PerspectiveCamera
    // fov — 垂直视野角度(从底部到顶部，以度为单位。 默认值为50。)
    // aspect — 长宽比（一般为渲染器、画布长宽比,默认为1）
    // near — 近距离(默认值为0.1)
    // far — 远距离(默认为2000,必须大于近距离的值。)
    this.camera = new THREE.PerspectiveCamera(40, k, 0.01, 10000);
    const { position } = this.cameraConfig;
    this.camera.position.set(position.x, position.y, position.z);
    // 创建相机控制器
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    // 设置垂直的最小角度
    // this.controls.minPolarAngle = Math.PI / 2 - Math.PI / 12;
    // 设置垂直的最大角度
    // this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.enableZoom = true;
    // this.controls.maxDistance = 20
  },
  // 点击模型切换对应视角
  animateCamera(selectObject) {
    const self = this;
    // 要设置最佳视角建议模型那边在子模型里面绑定好视角值或者在后端保存子模型和自己配置的视角值
    // 目前子模型里设置的位置值都是000
    const worldPosition = new THREE.Vector3();
    const worldQuaternion = new THREE.Quaternion();
    const worldScale = new THREE.Vector3();
    selectObject.matrixWorld.decompose(
      worldPosition,
      worldQuaternion,
      worldScale
    );
    const distance = 10; // 相机与目标对象之间的距离，可以根据需要调整
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    // 计算新的相机位置
    const newCameraPosition = worldPosition
      .clone()
      .add(direction.multiplyScalar(distance));
    // 将相机的位置和朝向应用到目标对象的变换矩阵中
    // newCameraPosition.applyMatrix4(selectObject.matrixWorld);
    direction.applyMatrix4(selectObject.matrixWorld);

    // 随机坐标
    const x1 = Math.round(Math.random() * 100);
    const y1 = Math.round(Math.random() * -10);
    const z1 = 40;
    // 最佳视角配置
    const x2 = newCameraPosition.x;
    const y2 = newCameraPosition.y;
    const z2 = newCameraPosition.z;
    const nowCurrent = self.camera.position;
    const nowTarget = new THREE.Vector3(x1, y1, z1);
    const toCurrent = self.controls.target;
    const toTarget = new THREE.Vector3(x2, y2, z2);
    const tween = new TWEEN.Tween({
      x1: nowCurrent.x, // 相机当前位置x
      y1: nowCurrent.y, // 相机当前位置y
      z1: nowCurrent.z, // 相机当前位置z
      x2: toCurrent.x, // 控制当前的中心点x
      y2: toCurrent.y, // 控制当前的中心点y
      z2: toCurrent.z, // 控制当前的中心点z
    });
    tween.to(
      {
        x1: nowTarget.x, // 新的相机位置x
        y1: nowTarget.y, // 新的相机位置y
        z1: nowTarget.z, // 新的相机位置z
        x2: toTarget.x, // 新的控制中心点位置x
        y2: toTarget.y, // 新的控制中心点位置x
        z2: toTarget.z, // 新的控制中心点位置x
      },
      1000
    );
    tween.onUpdate((e) => {
      self.camera.position.x = e.x1;
      self.camera.position.y = e.y1;
      self.camera.position.z = e.z1;
      self.controls.target.x = e.x2;
      self.controls.target.y = e.y2;
      self.controls.target.z = e.z2;
      self.controls.update();
    });
    tween.easing(TWEEN.Easing.Cubic.InOut);
    tween.start();
  },
  // 添加光源
  initLight() {
    // 全局环境光
    if (this.lightConfig.ambientLight.show) {
      const ambientLight = new THREE.AmbientLight(
        this.lightConfig.ambientLight.color,
        this.lightConfig.ambientLight.level
      );
      this.scene.add(ambientLight);
    }
    if (this.lightConfig.directionalLight.show) {
      const directionalLight = new THREE.DirectionalLight(
        this.lightConfig.directionalLight.color,
        this.lightConfig.directionalLight.level
      );
      this.scene.add(directionalLight);
    }
    // 点光源 出不来bug-有时间研究下
    // const pointLight = new THREE.PointLight('#ffffff', 1)
    // pointLight.position.set(-10, 90, 100);
    // this.scene.add(pointLight)
    // this.camera.add(pointLight)
    // this.scene.add(this.camera)
  },
  // 运行动画
  animate() {
    for (const key in this.animataModalMap) {
      if (this.animataModalMap[key]) {
        this.animataModalMap[key].mixer.update(0.02);
      }
    }
    TWEEN.update();
    // 刷新相机控制器
    // this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
    if (this.composer) {
      this.composer.render();
    }
    this.animateId = requestAnimationFrame(this.animate.bind(this)); // 循环调用函数
  },
  // 添加模型事件监听
  addListener() {
    window.addEventListener(
      "dblclick",
      (e) => {
        this.portClick(e);
      },
      false
    );
    window.addEventListener(
      "wheel",
      (e) => {
        this.handleMouseWheel(e);
      },
      false
    );
    window.addEventListener(
      "resize",
      (e) => {
        this.changeSize(e);
      },
      false
    );
  },
  // 获取与射线相交的对象数组
  getIntersects(event) {
    event.preventDefault();
    // 声明 raycaster 和 mouse 变量
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    // 通过鼠标点击位置,计算出 raycaster 所需点的位置,以屏幕为中心点,范围 -1 到 1
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    // 通过鼠标点击的位置(二维坐标)和当前相机的矩阵计算出射线位置
    raycaster.setFromCamera(mouse, this.camera);
    // 获取与射线相交的对象数组，其中的元素按照距离排序，越近的越靠前
    const intersects = raycaster.intersectObjects(this.scene.children);
    // 返回选中的对象
    return intersects;
  },

  // 监听点击
  portClick(event) {
    let selectObject = null;
    // 获取 raycaster 和所有模型相交的数组，其中的元素按照距离排序，越近的越靠前
    const intersects = this.getIntersects(event);
    // 获取选中最近的 Mesh 对象
    if (intersects.length !== 0 && intersects[0].object instanceof THREE.Mesh) {
      selectObject = intersects[0].object;
      if (selectObject.name) {
        this.animateCamera(selectObject);
        this.setHighLight(selectObject);
      }
    }

    window.dispatchEvent(
      new CustomEvent("modalClick", {
        detail: selectObject,
      })
    );
    // 保持原事件
    event.preventDefault();
  },
  // 监听窗口尺寸变化
  changeSize(event) {
    // 重置渲染器输出画布canvas尺寸
    this.renderer.setSize(this.domRef.offsetWidth, this.domRef.offsetHeight);
    this.labelRenderer.setSize(
      this.domRef.offsetWidth,
      this.domRef.offsetHeight
    );
    this.clientWidth = this.domRef.clientWidth;
    this.clientHeight = this.domRef.clientHeight;
    const k = this.clientWidth / this.clientHeight; // 窗口宽高比
    // 重置相机投影的相关参数
    this.camera.aspect = k;
    // 如果相机的一些属性发生了变化，
    // 需要执行updateProjectionMatrix ()方法更新相机的投影矩阵
    this.camera.updateProjectionMatrix();
  },
  // 监听鼠标缩放操作
  handleMouseWheel(event) {
    // 设置相机缩放比数值越大缩放越明显
    const factor = 2;
    // 从鼠标位置转化为webgl屏幕坐标位置
    const glScreenX = (event.clientX / this.controls.domElement.width) * 2 - 1;
    const glScreenY =
      -(event.clientY / this.controls.domElement.height) * 2 + 1;
    const vector = new THREE.Vector3(glScreenX, glScreenY, 0);
    // 从屏幕向量转为3d空间向量
    vector.unproject(this.controls.object);
    // 相机偏移量
    vector.sub(this.controls.object.position).setLength(factor);
    if (event.deltaY < 0) {
      this.controls.object.position.add(vector);
      this.controls.target.add(vector);
    } else {
      this.controls.object.position.sub(vector);
      this.controls.target.sub(vector);
    }
    this.controls.update();
  },
  //高亮显示模型（呼吸灯）
  setHighLight(mesh) {
    let selectedObjects = [mesh];
    // 创建一个EffectComposer（效果组合器）对象，然后在该对象上添加后期处理通道。
    this.composer = new EffectComposer(this.renderer);
    // 新建一个场景通道  为了覆盖到原理来的场景上
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);
    const gammaCorrectionShader = new ShaderPass(GammaCorrectionShader);
    this.composer.addPass(gammaCorrectionShader);
    // 物体边缘发光通道
    this.outlinePass = new OutlinePass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      this.scene,
      this.camera,
      selectedObjects
    );
    this.outlinePass.selectedObjects = selectedObjects;
    this.outlinePass.edgeStrength = 10.0; // 边框的亮度
    this.outlinePass.edgeGlow = 1; // 光晕[0,1]
    this.outlinePass.usePatternTexture = false; // 是否使用父级的材质
    this.outlinePass.edgeThickness = this.outlineConfig.edgeThickness; // 边框宽度
    this.outlinePass.downSampleRatio = 1; // 边框弯曲度
    this.outlinePass.pulsePeriod = this.outlineConfig.pulsePeriod; // 呼吸闪烁的速度
    this.outlinePass.visibleEdgeColor.set(this.outlineConfig.visibleColor); // 呼吸显示的颜色
    this.outlinePass.hiddenEdgeColor = new THREE.Color(
      this.outlineConfig.hiddenColor
    ); // 呼吸消失的颜色
    this.outlinePass.clear = true;
    this.composer.addPass(this.outlinePass);
    // 自定义的着色器通道 作为参数
    var effectFXAA = new ShaderPass(FXAAShader);
    effectFXAA.uniforms.resolution.value.set(
      1 / window.innerWidth,
      1 / window.innerHeight
    );
    effectFXAA.renderToScreen = true;
    this.composer.addPass(effectFXAA);
  },
  //取消高亮显示模型（呼吸灯）
  disHighLight() {
    this.composer?.removePass(this.outlinePass);
  },
  //清空场景
  disposeModal() {
    cancelAnimationFrame(this.animateId);
    this.scene.clear();
    this.domRef.innerHTML = "";

    const removeObj = (obj) => {
      let arr = obj.children;
      arr.forEach((item) => {
        obj.remove(item);
      });
      obj.clear();
    };
    removeObj(this.floorModal);
  },
  // 添加动画模型数据储存
  setAnimataModalMap(id, obj) {
    this.animataModalMap[id] = obj;
  },
};

export { modalParams, Floor, Camera, Wall, Person };
