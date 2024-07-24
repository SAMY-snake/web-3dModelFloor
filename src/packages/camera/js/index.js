import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";
import { modalParams } from "@/packages/index";
class Camera {
  constructor(config) {
    //  图片dom元素绑定的class名称
    this.iconClassName = "camera-icon";
    //  图片大小
    this.width = "40px";
    this.height = "40px";
    //  图片路径
    this.url = "/modal/camera.png";
    this.activedUrl = "/modal/camera-actived.png";
    this.imgDomList = [];
    this.imgDomActivedMap = {};
    // 设备数据
    this.data = [];

    this.setConfig(config);
    this.init();
  }

  //设置初始值
  setConfig(config) {
    this.iconClassName = config.iconClassName
      ? config.iconClassName
      : this.iconClassName;
    this.width = config.width ? config.width : this.width;
    this.height = config.height ? config.height : this.height;
    this.url = config.url ? config.url : this.url;
    this.data = config.data ? config.data : this.data;
  }
  init() {
    let _this = this;
    let imgDomList = [];
    let imgDomActivedMap = {};
    this.data.forEach((e) => {
      let imgDom = document.createElement("img");
      imgDom.className = this.iconClassName;
      imgDom.src = this.url;
      imgDom.setAttribute("data-id", e.id);
      imgDom.setAttribute("data-actived", false);
      imgDom.style.width = this.width;
      imgDom.style.height = this.height;
      imgDom.style.pointerEvents = "auto";
      imgDom.ondblclick = (event) => {
        let imgDomId = Number(e.id);
        _this.imgDomList.forEach((dom) => {
          let eId = Number(dom.getAttribute("data-id"));
          if (eId !== imgDomId) {
            dom.src = _this.url;
            dom.setAttribute("data-actived", false);
            _this.imgDomActivedMap[eId] = false;
          }
        });
        let imgDomActived = _this.imgDomActivedMap[imgDomId];
        if (imgDomActived) {
          imgDom.src = _this.url;
        } else {
          imgDom.src = _this.activedUrl;
        }
        _this.imgDomActivedMap[imgDomId] = !imgDomActived;
        imgDom.setAttribute("data-actived", !imgDomActived);
        window.dispatchEvent(
          new CustomEvent("modalClick", {
            detail: e,
          })
        );
        event.stopPropagation();
      };
      imgDomList.push(imgDom);
      imgDomActivedMap[e.id] = false;
      let img = new CSS2DObject(imgDom);
      let position = e.position;
      img.position.set(position.x, position.y, position.z);
      modalParams.floorModal.add(img);
    });
    this.imgDomList = imgDomList;
    this.imgDomActivedMap = imgDomActivedMap;
  }
}

export default Camera;
