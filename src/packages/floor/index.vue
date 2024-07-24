<template>
  <div class="container">
    <div ref="floor1" id="floor-1" class="floor-container"></div>
    <div class="btn" @click="person.movePersonByPoints(testPerson)">
      移动小人
    </div>
    <div class="btn btn-1" @click="wall.isInArea({ x: -30, y: -4, z: 18 })">
      判断告警
    </div>
    <div class="btn btn-2" @click="handalerCall(1)">取消所有模型高亮</div>
    <div class="btn btn-3" @click="handalerCall(2)">销毁模型</div>
    <div class="btn btn-4" @click="handalerCall(3)">重新渲染模型</div>
  </div>
</template>

<script>
import Floor from "@/packages/floor/js/index.js";
import Camera from "@/packages/camera/js/index.js";
import Wall from "@/packages/wall/js/index.js";
import Person from "@/packages/person/js/index.js";
import { modalParams } from "@/packages/index";

export default {
  name: "JxudpFloor",
  data() {
    return {
      floorRef: null,
      camera: null,
      wall: null,
      person: null,
      // 楼层子模型组
      modalList: [],
      testPerson: {
        id: 1,
        name: "person-1",
        newPointList: [
          { x: -80, y: -4, z: 15 },
          { x: -75, y: -4, z: 10 },
          // { x: -78, y: -4, z: 16 },
        ],
      },
      testLinePoints: {
        id: 1,
        data: [
          { x: -50, y: -4, z: 10 },
          { x: -80, y: -4, z: 15 },
          { x: -75, y: -4, z: 10 },
          { x: -78, y: -4, z: 16 },
        ],
      },
    };
  },
  mounted() {
    this.initFloor();
    window.addEventListener("modalClick", (val) => {
      console.log(111, val.detail);
    });
    window.addEventListener("floorModalCompleted", (index) => {
      let cameraConfig = {
        width: "40px",
        height: "40px",
        data: [
          { id: 1, name: "camera-1", position: { x: -50, y: -1, z: 0 } },
          { id: 2, name: "camera-2", position: { x: -70, y: -1, z: 0 } },
        ],
      };
      this.camera = new Camera(cameraConfig);
      let wallConfig = {
        height: 10,
        color: "#f5907f",
        opacity: 0.4,
        data: [
          [
            [-30, -4, 10],
            [-25, -4, 15],
            [-27, -4, 20],
            [-32, -4, 18],
            [-30, -4, 10],
          ],
          [
            [-70, -4, 10],
            [-65, -4, 15],
            [-67, -4, 20],
            [-72, -4, 18],
            [-70, -4, 16],
            [-70, -4, 10],
          ],
        ],
      };
      this.wall = new Wall(wallConfig);
      let personConfig = {
        data: [
          {
            id: 1,
            name: "person-1",
            point: { x: -50, y: -4, z: 10 },
            newPoint: { x: -80, y: -4, z: 15 },
          },
          {
            id: 2,
            name: "person-2",
            point: { x: -80, y: -4, z: 20 },
            newPoint: { x: -40, y: -4, z: 10 },
          },
          {
            id: 3,
            name: "person-3",
            point: { x: -60, y: -4, z: 10 },
            newPoint: { x: -30, y: -4, z: 20 },
          },
          {
            id: 4,
            name: "person-4",
            point: { x: -30, y: -4, z: 18 },
            newPoint: { x: -50, y: -4, z: 8 },
          },
        ],
      };
      this.person = new Person(personConfig);
      this.person.addCurveLine(
        this.testLinePoints.id,
        this.testLinePoints.data
      );
    });
  },
  methods: {
    initFloor() {
      let config = {
        domRef: this.$refs.floor1,
        clearColor: "#cbcbcb",
        clearColorOpacity: 0.4,
      };
      this.floorRef = new Floor(this, config);
    },
    handalerCall(type) {
      switch (type) {
        case 1:
          modalParams.disHighLight();
          break;
        case 2:
          modalParams.disposeModal();
          break;
        case 3:
          this.initFloor();
          break;
        default:
          break;
      }
    },
  },
};
</script>
<style lang="scss" scoped>
@import "@/packages/floor/scss/index.scss";
</style>
