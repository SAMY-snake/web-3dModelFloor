import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";
import * as THREE from "three";
import TWEEN from "@tweenjs/tween.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { modalParams } from "@/packages/index";
import { color } from "three/examples/jsm/nodes/Nodes.js";
class Person {
  //构造器
  constructor(config) {
    // 人员标签dom元素绑定的class名称
    this.labelClassName = "person-label";
    // 模型路径
    this.url = "/modal/person2.fbx";
    // 人员数据
    this.data = [];
    // 人员标签配置
    this.labelConfig = {
      offset: 3,
    };
    // 人员模型配置
    this.modalConfig = {
      scale: 0.02,
    };
    // 轨迹线配置
    this.curveLineConfig = {
      width: 10,
      color: "#ffffff",
      tension: 0.1,
      opacity: 0.4,
    };
    // 人员模型数据
    this.modalMap = {};
    // 人员标签模型数据
    this.labelMap = {};
    // 轨迹线数据
    this.lineMap = {};

    this.setConfig(config);
    this.initPerson();
  }

  //设置初始值
  setConfig(config) {
    this.labelClassName = config.labelClassName
      ? config.labelClassName
      : this.labelClassName;
    this.url = config.url ? config.url : this.url;
    this.data = config.data ? config.data : this.data;
    this.labelConfig = {
      ...this.labelConfig,
      ...config.labelConfig,
    };
    this.curveLineConfig = {
      ...this.curveLineConfig,
      ...config.curveLineConfig,
    };
  }
  //初始化人员渲染
  initPerson() {
    const manager = new THREE.LoadingManager();
    const fbxloader = new FBXLoader(manager);
    fbxloader.load(this.url, (modal) => {
      this.data.forEach((e) => {
        let newModal = clone(modal);
        this.addPerson(newModal, e);
      });
    });
  }
  //添加人员模型
  addPerson(modal, e) {
    let point = e.point;
    modal.scale.set(
      this.modalConfig.scale,
      this.modalConfig.scale,
      this.modalConfig.scale
    );
    modal.position.set(point.x, point.y, point.z);
    modalParams.floorModal.add(modal);
    modal.mixer = new THREE.AnimationMixer(modal);
    let animationAction = modal.mixer.clipAction(modal.animations[0]);
    // animationAction.setLoop(THREE.LoopRepeat);
    // animationAction.play();
    modal["animationAction"] = animationAction;
    this.modalMap[e.id] = modal;
    modalParams.setAnimataModalMap(e.id, modal);
    let labelDom = document.createElement("div");
    labelDom.className = this.labelClassName;
    labelDom.innerText = e.name;
    let label = new CSS2DObject(labelDom);
    label.position.set(point.x, point.y + this.labelConfig.offset, point.z);
    modalParams.floorModal.add(label);
    this.labelMap[e.id] = label;
  }
  //移动人员模型-多点
  async movePersonByPoints(data) {
    let newPointList = data.newPointList;
    if (newPointList.length) {
      for (let i = 0; i < newPointList.length; i++) {
        await this.movePerson(data.id, newPointList, i);
      }
    }
  }
  //移动人员模型-单点
  movePerson(id, newPointList = [], index = 0) {
    let i = index;
    return new Promise((resolve) => {
      let newPosition = newPointList[index];
      let newLocalPoint = new THREE.Vector3(
        newPosition.x,
        newPosition.y,
        newPosition.z
      );
      let newWorldPoint = this.modalMap[id].parent.localToWorld(
        newLocalPoint.clone()
      );
      let oldLocalPoint = this.modalMap[id].position;
      if (i > 0) {
        let oldPosition = newPointList[index - 1];
        oldLocalPoint = new THREE.Vector3(
          oldPosition.x,
          oldPosition.y,
          oldPosition.z
        );
        this.modalMap[id].position = oldLocalPoint;
      }
      this.modalMap[id].lookAt(newWorldPoint);
      let tween = new TWEEN.Tween(oldLocalPoint)
        .to(newLocalPoint, 5000)
        .easing(TWEEN.Easing.Linear.InOut);
      tween.onComplete((val) => {
        if (i >= newPointList.length - 1) {
          this.modalMap[id].animationAction.stop();
        }
        i++;
        resolve(i);
      });
      tween.start();
      // this.peosonModalMap[name].animationAction.fadeOut(0.2);
      this.modalMap[id].animationAction
        .reset()
        // .fadeIn(0.2)
        .play();
      this.movePersonLabel(id, newPointList, index);
    });
  }
  //移动人员标签
  movePersonLabel(id, newPointList = [], index = 0) {
    let newPosition = newPointList[index];
    let newPositionCopy = {
      x: newPosition.x,
      y: newPosition.y + this.labelConfig.offset,
      z: newPosition.z,
    };
    let newLocalPoint = new THREE.Vector3(
      newPositionCopy.x,
      newPositionCopy.y,
      newPositionCopy.z
    );
    let oldLocalPoint = this.labelMap[id].position;
    if (index > 0) {
      let oldPosition = newPointList[index - 1];
      oldLocalPoint = new THREE.Vector3(
        oldPosition.x,
        oldPosition.y + this.labelConfig.offset,
        oldPosition.z
      );
      this.labelMap[id].position = oldLocalPoint;
    }
    let tween = new TWEEN.Tween(oldLocalPoint)
      .to(newLocalPoint, 5000)
      .easing(TWEEN.Easing.Linear.InOut);
    tween.start();
  }
  //绘制轨迹线
  addCurveLine(personId, points) {
    let vector3List = points.map((e) => {
      return new THREE.Vector3(e.x, e.y, e.z);
    });
    //用多个点绘制一个平面，点的数组
    let curve = new THREE.CatmullRomCurve3(vector3List);
    curve.curveType = "catmullrom";
    //闭合
    curve.closed = false;
    //设置线的张力，0为无弧度折线会变成三角形
    curve.tension = this.curveLineConfig.tension;

    // 为曲线添加材质在场景中显示出来，不显示也不会影响运动轨迹，相当于一个Helper
    const pointsGeometry = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(pointsGeometry);
    const material = new THREE.LineBasicMaterial({
      color: this.curveLineConfig.color,
      linewidth: this.curveLineConfig.width,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: this.curveLineConfig.opacity,
    });
    const curveLine = new THREE.Line(geometry, material);

    let rollMat = new THREE.MeshLambertMaterial();
    let rollTexture = new THREE.TextureLoader().load(
      "modal/arrow.svg",
      (map) => {
        rollMat.map = map;
        rollMat.needsUpdate = true;
        rollMat.transparent = true;
        rollMat.side = THREE.DoubleSide;
      }
    );
    rollTexture.wrapS = THREE.RepeatWrapping;
    rollTexture.wrapT = THREE.RepeatWrapping;
    rollTexture.repeat.x = 10;
    let geometry1 = new THREE.PlaneGeometry(400, 20);
    let obj1 = new THREE.Mesh(geometry1, rollMat);
    modalParams.floorModal.add(obj1);

    //关联人员id和轨迹线
    this.lineMap[personId] = curveLine;
    //添加轨迹线
    modalParams.floorModal.add(curveLine);
  }
}

export default Person;
