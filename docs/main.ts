import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";
import "@babylonjs/gui";
import { Galaxy } from "./Galaxy";
import { AddTransitionEffect, FadeInOut } from "./TransitionEffect";
import { calcLonLatToXYZ, getDecimal, lookAt, params, Mode } from "./Common";
import { addGreenPillar, addEarthAroundLine, addMiniEarth } from "./AddObjects";
import { WarpEffect } from "./WarpEffect";
import { AbstractMesh } from "babylonjs";

let vlat = 0;
let vlon = 0;
let lon = 0.5; // y
let lat = 0.5; // x
let mode = Mode.floating;
let amount = 0;
let earth: BABYLON.Mesh,
  miniEarth: BABYLON.Mesh,
  human: BABYLON.Mesh,
  debug: BABYLON.Mesh,
  screen: BABYLON.Mesh,
  mainCamera: BABYLON.Camera,
  screenCamera: BABYLON.UniversalCamera,
  renderTarget: BABYLON.RenderTargetTexture,
  floatingRoot: BABYLON.TransformNode,
  walkingRoot: BABYLON.TransformNode,
  screenRoot: BABYLON.TransformNode,
  mainCameraRoot: BABYLON.TransformNode,
  light: BABYLON.HemisphericLight,
  cameraPosforWalkingMode: any,
  currentPhi: number,
  currentTheta: number,
  galaxy: any;

const canvas: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas);
const mainScene = new BABYLON.Scene(engine);

init();
addObject();

mainScene.onKeyboardObservable.add((kbInfo) => {
  switch (kbInfo.type) {
    case BABYLON.KeyboardEventTypes.KEYDOWN:
      switch (kbInfo.event.key) {
        case "w":
          vlon = vlon - params.acceleration * params.t;
          amount = 0.01;
          break;
        case "a":
          vlat = vlat + params.acceleration * params.t;
          break;
        case "s":
          vlon = vlon + params.acceleration * params.t;
          break;
        case "d":
          vlat = vlat - params.acceleration * params.t;
          break;
        case "u":
          if (mode === Mode.floating) {
            walkingModeInit();
          } else if (mode === Mode.walking) {
            FadeInOut();
            floatingModeInit();
          }
          break;
        case "i":
          BABYLON.Tools.CreateScreenshotUsingRenderTarget(engine, screenCamera, { width: 1920, height: 1080 });
          break;
        default:
          break;
      }
  }

  switch (kbInfo.type) {
    case BABYLON.KeyboardEventTypes.KEYUP:
      switch (kbInfo.event.key) {
        case "c":
          WarpEffect(mainScene, new BABYLON.Vector3(0, 0, -8));
          break;
        default:
          break;
      }
  }

  vlat = BABYLON.Scalar.Clamp(vlat, -10, 10);
  vlon = BABYLON.Scalar.Clamp(vlon, -10, 10);
});

function update () {
  switch (mode) {
    case Mode.floating: {
      vlat = vlat * params.attenuationRate;
      vlon = vlon * params.attenuationRate;

      lat = lat + vlat * params.t;
      lon = lon + vlon * params.t;
      currentPhi = getDecimal(lat) * params.pi * 2;
      currentTheta = BABYLON.Scalar.Clamp(getDecimal(lon) * params.pi, 0.2, params.pi - 0.2);

      const p = calcLonLatToXYZ(currentPhi, currentTheta, params.humanAlt);
      floatingRoot.position = p;// new BABYLON.Vector3(x, y, z);
      floatingRoot.lookAt(new BABYLON.Vector3(0, 0, 0));
      // const q = lookAt(floatingRoot.forward, floatingRoot.position, new BABYLON.Vector3(0, 0, 0));
      // floatingRoot.rotationQuaternion = q;

      const offset = 1.6;
      mainCameraRoot.lookAt(floatingRoot.position);
      mainCameraRoot.position = BABYLON.Vector3.Lerp(mainCameraRoot.position, new BABYLON.Vector3(p.x, p.y, p.z).scale(offset), 0.005);
      break;
    }
    case Mode.walking: {
      const rotateAxis = mainCameraRoot.right;
      earth.rotate(rotateAxis, amount, BABYLON.Space.WORLD);
      mainCameraRoot.lookAt(walkingRoot.position);
      mainCameraRoot.position = BABYLON.Vector3.Lerp(mainCameraRoot.position, cameraPosforWalkingMode, 0.05);
      // screenRoot.lookAt(mainCameraRoot.position);
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
  mainScene.clearColor = new BABYLON.Color4(0.0, 0.0, 0.1, 1.0);

  mainCameraRoot.position = new BABYLON.Vector3(0, 0, -13);

  renderTarget = new BABYLON.RenderTargetTexture("depth", 1920, mainScene, true); // rendertargettextureの作成(unityでいうrendertexture)
  renderTarget.activeCamera = screenCamera; // rendertargettextureのアクティブカメラを指定
  mainScene.customRenderTargets.push(renderTarget); // rendertargettextureを有効化

  addGUI();
  AddTransitionEffect(mainCamera);
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
  if (renderTarget.renderList !== null) {
    renderTarget.renderList.push(earth); // rendertargettextureに書き込むオブジェクトを指定 
  }

  // mini earth
  // addMiniEarth(mainScene);

  // human
  // human = BABYLON.MeshBuilder.CreateCylinder("cylinder", { diameterTop: 0.1, height: 0.8, diameterBottom: 0.25 });// BABYLON.CreateCapsule("obj", { height: 1, radius: 0.125 }, mainScene);
  // human.material = new BABYLON.StandardMaterial("objMat");
  // human.parent = floatingRoot;
  // const localAxes = new BABYLON.AxesViewer(mainScene, 1);
  // localAxes.xAxis.parent = floatingRoot;
  // localAxes.yAxis.parent = floatingRoot;
  // localAxes.zAxis.parent = floatingRoot;
  // floatingRoot.position.y = -2;
  BABYLON.SceneLoader.Append("./assets/", "01.glb", mainScene, (obj) => {
    human = <BABYLON.Mesh>mainScene.getMeshByName("__root__");
    human.scaling = new BABYLON.Vector3(1, 1, 1);
    human.rotation = new BABYLON.Vector3(0, 0, 0);
    human.parent = floatingRoot;
  });

  // debug obj
  // debug = BABYLON.CreateSphere("debug", { diameter: 0.5 }, mainScene);
  // debug.material = new BABYLON.StandardMaterial("debugMat");
  // debug.position = new BABYLON.Vector3(0, 8, 0);

  // screen
  screen = BABYLON.CreatePlane("map", { width: 30, height: 15 }, mainScene);
  screen.scaling = new BABYLON.Vector3(-1, 1, 1);
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
  screenCamera.position.y = 2.5;
  screenCamera.setTarget(BABYLON.Vector3.Zero());
  screenCamera.parent = walkingRoot;
  mainCamera.parent = mainCameraRoot;

  addGreenPillar(mainScene);
  addEarthAroundLine();
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
  walkingRoot.rotationQuaternion = BABYLON.Quaternion.Identity();
  human.parent = walkingRoot;
  const p = calcLonLatToXYZ(0, 0, params.humanAlt - 0.5);
  walkingRoot.position = p;
  // walkingRoot.rotate(floatingRoot.right, -1.57);
  cameraPosforWalkingMode = p.clone().add(new BABYLON.Vector3(0, 0, -8));//floatingRoot.position.add(floatingRoot.up.scale(-5)).add(floatingRoot.forward.scale(-1));

  // humanを回転させる処理
  const q1 = lookAt(new BABYLON.Vector3(0, 1, 0), new BABYLON.Vector3(0, 0, 0), walkingRoot.position.clone().normalize());
  walkingRoot.rotationQuaternion = q1;
  // let r = Math.acos(BABYLON.Vector3.Dot((walkingRoot.position.clone().subtract(cameraPosforWalkingMode)).normalize(), walkingRoot.forward));
  // r = currentPhi < 3.14 ? r * -1 : r;
  // walkingRoot.rotate(walkingRoot.position.clone().normalize(), r, BABYLON.Space.WORLD);

  // for screen
  // screenRoot.position = floatingRoot.position.add(floatingRoot.up.scale(25)).add(floatingRoot.forward.scale(3));
  // const dir = floatingRoot.position.add(floatingRoot.up);
  // debug.position = dir.scale(20);

  // const axis0 = BABYLON.Vector3.Cross(dir.scale(-1), screenParent.forward);
  // const rad = Math.acos(BABYLON.Vector3.Dot(dir.scale(-1), screenParent.forward) / (dir.scale(-1).length * screenParent.forward.length));
  // const q0 = BABYLON.Quaternion.RotationAxis(axis0, rad);

  // const q1 = BABYLON.Quaternion.RotationAxis()
  // screenParent.rotation = walkingParent.rotation;
  // screenRoot.rotate(screenRoot.right, 1.57);

  mode = Mode.walking;
}

function addGUI () {
  // const text = document.createElement("text");
  // text.style.top = "100px";
  // text.style.right = "30px";
  // text.textContent = "click";
  // text.style.width = "100px";
  // text.style.height = "100px";

  // text.setAttribute = ("id", "but");
  // text.style.position = "absolute";
  // text.style.color = "black";

  // document.body.appendChild(text);
}

engine.runRenderLoop(() => {
  update();
  mainScene.render();
});
