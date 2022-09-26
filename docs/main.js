import * as BABYLON from "@babylonjs/core";
import { Galaxy } from "./Galaxy";

const Mode = {
  floating: 0,
  walking: 1,
};

let vlat = 0;
let vlon = 0;
let lon = 0.5; // y
let lat = 0.5; // x
const alt = 8;
const t = 0.03;
const pi = 3.1415;
const attenuationRate = 0.998;
const acceleration = 0.02;
let mode = Mode.floating;
let amount = 0;
let earth, human, debug, screen, mainCamera, screenCamera, renderTarget, galaxy, floatingRoot, walkingRoot, screenRoot, mainCameraRoot, light;

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas);
const mainScene = new BABYLON.Scene(engine);

init();
addObject();

// keyevent
mainScene.onKeyboardObservable.add((kbInfo) => {
  switch (kbInfo.type) {
    case BABYLON.KeyboardEventTypes.KEYDOWN:
      switch (kbInfo.event.key) {
        case "w":
          vlon = vlon - acceleration * t;
          amount = 0.01;
          break;
        case "a":
          vlat = vlat + acceleration * t;
          break;
        case "s":
          vlon = vlon + acceleration * t;
          break;
        case "d":
          vlat = vlat - acceleration * t;
          break;
        case "u":
          if (mode === Mode.floating) {
            walkingModeInit();
          } else if (mode === Mode.walking) {
            floatingModeInit();
          }
          break;
        default:
          break;
      }
      vlat = BABYLON.Scalar.Clamp(vlat, -10, 10);
      vlon = BABYLON.Scalar.Clamp(vlon, -10, 10);
      break;
    // case BABYLON.KeyboardEventTypes.KEYUP:
    //   console.log("up");
    //   break;
  }
});

function update () {
  switch (mode) {
    case Mode.floating: {
      vlat = vlat * attenuationRate;
      vlon = vlon * attenuationRate;

      lat = lat + vlat * t;
      lon = lon + vlon * t;
      const phi = getDecimal(lat) * pi * 2;
      const theta = BABYLON.Scalar.Clamp(getDecimal(lon) * pi, 0.2, pi - 0.2);

      const x = alt * Math.sin(theta) * Math.sin(phi);
      const y = alt * Math.cos(theta);
      const z = alt * Math.sin(theta) * Math.cos(phi);

      floatingRoot.position = new BABYLON.Vector3(x, y, z);
      floatingRoot.lookAt(new BABYLON.Vector3(0, 0, 0));

      // mainCameraRoot.rotate(BABYLON.Vector3.Up, 45
      const offset = 1.6;
      mainCameraRoot.lookAt(floatingRoot.position);
      mainCameraRoot.position = BABYLON.Vector3.Lerp(mainCameraRoot.position, new BABYLON.Vector3(x, y, z).scale(offset), 0.005);
      break;
    }
    case Mode.walking: {
      earth.rotate(BABYLON.Vector3.Right(), amount);
      const p = floatingRoot.position.add(floatingRoot.up.scale(-5)).add(floatingRoot.forward.scale(-1));
      mainCameraRoot.lookAt(walkingRoot.position);
      mainCameraRoot.position = BABYLON.Vector3.Lerp(mainCameraRoot.position, p, 0.05);
      screenRoot.lookAt(mainCameraRoot.position);
      amount = 0;
      break;
    }
    default:
  }
}

function init () {
  mainCamera = new BABYLON.UniversalCamera("mainCamera", new BABYLON.Vector3(0, 0, 0), mainScene);
  screenCamera = new BABYLON.UniversalCamera("subCamera", new BABYLON.Vector3(0, 0, -1), mainScene);
  mainCameraRoot = new BABYLON.TransformNode("mainCameraRoot");

  mainCamera.attachControl(canvas, true);
  mainScene.clearColor = new BABYLON.Color3(0.0, 0.0, 0.1);

  mainCameraRoot.position = new BABYLON.Vector3(0, 0, -13);

  renderTarget = new BABYLON.RenderTargetTexture("depth", 1024, mainScene, true); // rendertargettextureの作成(unityでいうrendertexture)
  renderTarget.activeCamera = screenCamera; // rendertargettextureのアクティブカメラを指定
  mainScene.customRenderTargets.push(renderTarget); // rendertargettextureを有効化
}

function addObject () {
  floatingRoot = new BABYLON.TransformNode("floatingRoot");
  walkingRoot = new BABYLON.TransformNode("walkingRoot");
  screenRoot = new BABYLON.TransformNode("screenRoot");

  // earth
  earth = BABYLON.CreateSphere("sphere1", { segments: 20, diameter: 15 }, mainScene);
  const material = new BABYLON.StandardMaterial("earthMat", mainScene);
  material.diffuseTexture = new BABYLON.Texture("./assets/earth.png");
  material.ambientColor = new BABYLON.Color3(1, 1, 1);
  material.emissiveColor = new BABYLON.Color3(1, 1, 1);
  earth.material = material;
  earth.rotate(BABYLON.Vector3.Right(), 3.14);
  renderTarget.renderList.push(earth); // rendertargettextureに書き込むオブジェクトを指定

  // human
  human = BABYLON.MeshBuilder.CreateCylinder("cylinder", { diameterTop: 0.1, height: 0.8, diameterBottom: 0.25 });// BABYLON.CreateCapsule("obj", { height: 1, radius: 0.125 }, mainScene);
  human.material = new BABYLON.StandardMaterial("objMat");
  human.parent = floatingRoot;
  floatingRoot.position.y = -2;

  // debug obj
  debug = BABYLON.CreateSphere("debug", { diameter: 0.5 }, mainScene);
  debug.material = new BABYLON.StandardMaterial("debugMat");

  // screen
  screen = BABYLON.CreatePlane("map", { width: 40, height: 20 }, mainScene);
  screen.parent = screenRoot;
  screenRoot.position.z = 20;
  screenRoot.position.y = 10;
  const rttMaterial = new BABYLON.StandardMaterial("RTT", mainScene);
  rttMaterial.emissiveTexture = renderTarget;
  rttMaterial.disableLighting = true;
  rttMaterial.backFaceCulling = false;
  screen.material = rttMaterial;

  // particles
  galaxy = new Galaxy(mainScene);

  // light
  light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), mainScene);
  light.intensity = 0.7;

  // add root
  screenCamera.parent = floatingRoot;
  mainCamera.parent = mainCameraRoot;
}

function getDecimal (num) {
  return num - ((num >= 0) ? Math.floor(num) : Math.ceil(num));
}

function floatingModeInit () {
  vlat = 0;
  vlon = 0;
  // screenRoot.rotate(screenRoot.right, 1.57);
  walkingRoot.rotate(floatingRoot.right, 1.57);
  human.parent = floatingRoot;
  // human.rotate(BABYLON.Vector3.Right(), -1.57);
  mode = Mode.floating;
}

function walkingModeInit () {
  // for human
  human.parent = null;
  walkingRoot.position = BABYLON.Vector3.Zero();
  human.parent = walkingRoot;
  walkingRoot.position = floatingRoot.position;
  walkingRoot.rotate(floatingRoot.right, -1.57);

  // for screen
  screenRoot.position = floatingRoot.position.add(floatingRoot.up.scale(25)).add(floatingRoot.forward.scale(3));
  const dir = floatingRoot.position.add(floatingRoot.up);
  debug.position = dir.scale(20);

  // const axis0 = BABYLON.Vector3.Cross(dir.scale(-1), screenParent.forward);
  // const rad = Math.acos(BABYLON.Vector3.Dot(dir.scale(-1), screenParent.forward) / (dir.scale(-1).length * screenParent.forward.length));
  // const q0 = BABYLON.Quaternion.RotationAxis(axis0, rad);

  // const q1 = BABYLON.Quaternion.RotationAxis()
  // screenParent.rotation = walkingParent.rotation;
  screenRoot.rotate(screenRoot.right, 1.57);

  mode = Mode.walking;
}

// Render every frame
engine.runRenderLoop(() => {
  update();
  mainScene.render();
});
