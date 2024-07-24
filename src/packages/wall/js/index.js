import * as THREE from "three";
import { modalParams } from "@/packages/index";
class Wall {
  //构造器
  constructor(config) {
    //光墙高度
    this.height = 10;
    //光墙颜色
    this.color = "#ffffff";
    //光墙透明度
    this.opacity = 0.1;
    //是否拉伸
    this.expand = true;
    //数据点位
    this.data = [];
    //区域墙体数据
    this.meshList = [];

    this.setConfig(config);
    this.init();
  }

  //设置初始值
  setConfig(config) {
    this.height = config.height ? config.height : this.height;
    this.color = config.color ? config.color : this.color;
    this.opacity = config.opacity ? config.opacity : this.opacity;
    this.expand = config.expand ? config.expand : this.expand;
    this.data = config.data ? config.data : this.data;
  }
  //初始化光墙
  init() {
    this.data.forEach((e) => {
      this.addWall(e);
    });
  }
  //添加光墙
  addWall(data) {
    let verticesByTwo = [];
    // 1.处理路径数据  每两个顶点为为一组
    if (this.expand) {
      // 1.1向y方向拉伸顶点
      verticesByTwo = data.reduce((arr, [x, y, z]) => {
        return arr.concat([
          [
            [x, y, z],
            [x, y + this.height, z],
          ],
        ]);
      }, []);
    } else {
      // 1.2 已经处理好路径数据
      verticesByTwo = data;
    }
    // 2.解析需要渲染的四边形 每4个顶点为一组
    let verticesByFour = verticesByTwo.reduce((arr, item, i) => {
      if (i === verticesByTwo.length - 1) return arr;
      return arr.concat([[item, verticesByTwo[i + 1]]]);
    }, []);
    // 3.将四边形面转换为需要渲染的三顶点面
    let verticesByThree = verticesByFour.reduce((arr, item) => {
      let [[point1, point2], [point3, point4]] = item;
      return arr.concat(
        ...point2,
        ...point1,
        ...point4,
        ...point1,
        ...point3,
        ...point4
      );
    }, []);
    let geometry = new THREE.BufferGeometry();
    // 4. 设置position
    let vertices = new Float32Array(verticesByThree);
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    // 5. 设置uv 6个点为一个周期 [0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1]

    // 5.1 以18个顶点为单位分组
    let pointsGroupBy18 = new Array(verticesByThree.length / 3 / 6)
      .fill(0)
      .map((item, i) => {
        return verticesByThree.slice(i * 3 * 6, (i + 1) * 3 * 6);
      });
    // 5.2 按uv周期分组
    let pointsGroupBy63 = pointsGroupBy18.map((item, i) => {
      return new Array(item.length / 3)
        .fill(0)
        .map((it, i) => item.slice(i * 3, (i + 1) * 3));
    });
    // 5.3根据BoundingBox确定uv平铺范围
    geometry.computeBoundingBox();
    let { min, max } = geometry.boundingBox;
    let rangeX = max.x - min.x;
    let uvs = [].concat(
      ...pointsGroupBy63.map((item) => {
        let point0 = item[0];
        let point5 = item[5];
        let distance =
          new THREE.Vector3(...point0).distanceTo(
            new THREE.Vector3(...point5)
          ) /
          (rangeX / 10);
        return [0, 1, 0, 0, distance, 1, 0, 0, distance, 0, distance, 1];
      })
    );
    geometry.setAttribute(
      "uv",
      new THREE.BufferAttribute(new Float32Array(uvs), 2)
    );
    // 更新法线
    // geometry.computeVertexNormals();
    // let meshMat = new THREE.MeshBasicMaterial({
    //   color: this.color,
    //   // map: gradientTexture,
    //   transparent: true,
    //   opacity: 0.4,
    //   side: THREE.DoubleSide,
    // });
    let meshMat = new THREE.ShaderMaterial({
      vertexShader: `
      varying vec3 vPosition;
      void main() {
          vec4 viewPosition = viewMatrix * modelMatrix * vec4(position, 1);
          gl_Position = projectionMatrix * viewPosition;
          vPosition = position;
      }`,

      fragmentShader: `
      varying vec3 vPosition;
      uniform float uHeight;
      uniform vec3 uColor; // 添加一个颜色的 uniform
      void main() {
          float gradMix = (vPosition.y + uHeight / 2.0) / uHeight;
          gl_FragColor = vec4(uColor, 1.0 - gradMix); // 使用传入的颜色
      }`,

      transparent: true,
      side: THREE.DoubleSide,
      uniforms: {
        uHeight: {
          value: this.height,
        },
        uColor: {
          // 定义颜色的初始值
          value: new THREE.Color(this.color), // 默认为黄色
        },
      },
    });

    let wallMesh = new THREE.Mesh(geometry, meshMat);
    wallMesh.scale.y = 0.1;
    wallMesh.position.y = -3.5;
    this.meshList.push(wallMesh);
    // modalParams.scene.add(wallMesh);
    modalParams.floorModal.add(wallMesh);
  }
  //判断某点是否在区域内
  isInArea(position) {
    // 假设有一个点需要判断，点为Vector3(x, y, z)
    let localPoint = new THREE.Vector3(position.x, -3.5, position.z);
    let worldPoint = modalParams.floorModal.localToWorld(localPoint.clone());
    this.meshList.forEach((mesh) => {
      let box = new THREE.Box3().setFromObject(mesh);
      let isIn = box.containsPoint(worldPoint);
      console.log("是否在告警区域内", isIn);
      return isIn;
    });
  }
}

export default Wall;
