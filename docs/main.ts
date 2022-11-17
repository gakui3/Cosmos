import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";
import "@babylonjs/gui";
import { CreateGalaxy } from "./Galaxy";
import { AddTransitionEffect, FadeInOut } from "./TransitionEffect";
import { calcLonLatToXYZ, getDecimal, lookAt, params, Mode } from "./Common";
import { addGreenPillar, addEarthAroundLine, addMiniEarth, addScreen, addRightBottomUI, addEarth } from "./AddObjects";
import { WarpEffect } from "./WarpEffect";
import { AbstractMesh, Material, NodeMaterial } from "babylonjs";
import { any } from "@tensorflow/tfjs";

let vlat = 0;
let vlon = 0;
let lon = 0.5; // y
let lat = 0.5; // x
let mode = Mode.floating;
let amount = 0;
let satelliteRootRotatePitch = 0;
let satelliteRootRotateRoll = 0;
let earth: BABYLON.Mesh,
  miniEarth: BABYLON.Mesh,
  human: BABYLON.Mesh,
  debug: BABYLON.Mesh,
  screen: any,//BABYLON.Mesh,
  mainCamera: BABYLON.Camera,
  subCamera: BABYLON.Camera,
  screenCamera: BABYLON.UniversalCamera,
  renderTarget: BABYLON.RenderTargetTexture,
  floatingRoot: BABYLON.TransformNode,
  walkingRoot: BABYLON.TransformNode,
  screenRoot: BABYLON.TransformNode,
  satelliteRoot: BABYLON.TransformNode,
  mainCameraRoot: BABYLON.TransformNode,
  light: BABYLON.HemisphericLight,
  cameraPosforWalkingMode: any,
  currentPhi: number,
  currentTheta: number,
  galaxy: any,
  rightBottomGUI : any;

const canvas: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas);
const mainScene = new BABYLON.Scene(engine);
const subSceneForMiniEarth = new BABYLON.Scene(engine);

init();
addObject();

mainScene.onKeyboardObservable.add((kbInfo) => {
  switch (kbInfo.type) {
    case BABYLON.KeyboardEventTypes.KEYDOWN:
      switch (kbInfo.event.key) {
        case "w":
          if (mode === Mode.floating) {
            vlon = vlon - params.acceleration * params.t;
          } else {
            earth.rotate(BABYLON.Vector3.Right(), 0.01, BABYLON.Space.WORLD);
            miniEarth.rotate(BABYLON.Vector3.Right(), 0.01, BABYLON.Space.WORLD);
          }
          break;
        case "a":
          if (mode === Mode.floating) {
            vlat = vlat + params.acceleration * params.t;
          } else {
            earth.rotate(BABYLON.Vector3.Up(), 0.01, BABYLON.Space.WORLD);
            miniEarth.rotate(BABYLON.Vector3.Up(), 0.01, BABYLON.Space.WORLD);
          }
          break;
        case "s":
          if (mode === Mode.floating) {
            vlon = vlon + params.acceleration * params.t;
          } else {
            earth.rotate(BABYLON.Vector3.Right(), -0.01, BABYLON.Space.WORLD);
            miniEarth.rotate(BABYLON.Vector3.Right(), -0.01, BABYLON.Space.WORLD);
          }
          break;
        case "d":
          if (mode === Mode.floating) {
            vlat = vlat - params.acceleration * params.t;
          } else {
            earth.rotate(BABYLON.Vector3.Up(), -0.01, BABYLON.Space.WORLD);
            miniEarth.rotate(BABYLON.Vector3.Up(), -0.01, BABYLON.Space.WORLD);
          }
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
        case "ArrowUp":
          satelliteRoot.rotate(BABYLON.Vector3.Right(), 0.01);
          break;
        case "ArrowDown":
          satelliteRoot.rotate(BABYLON.Vector3.Right(), -0.01);
          break;
        case "ArrowLeft":
          satelliteRoot.rotate(BABYLON.Vector3.Forward(), -0.01);
          break;
        case "ArrowRight":
          satelliteRoot.rotate(BABYLON.Vector3.Forward(), 0.01);
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
      // earth.rotate(rotateAxis, amount, BABYLON.Space.WORLD);
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

  subCamera = new BABYLON.UniversalCamera("subCamera", new BABYLON.Vector3(100, 0, 0), subSceneForMiniEarth);
  subCamera.viewport = new BABYLON.Viewport(0, 0, 0.3, 0.3);
  subSceneForMiniEarth.autoClear = false

  mainCamera.parent = mainCameraRoot;


  mainCamera.attachControl(canvas, true);
  mainScene.clearColor = new BABYLON.Color4(0.0, 0.03, 0.13, 1.0);

  mainCameraRoot.position = new BABYLON.Vector3(0, -20, -13);

  renderTarget = new BABYLON.RenderTargetTexture("depth", 1920, mainScene, true); // rendertargettextureの作成(unityでいうrendertexture)
  renderTarget.activeCamera = screenCamera; // rendertargettextureのアクティブカメラを指定
  mainScene.customRenderTargets.push(renderTarget); // rendertargettextureを有効化

  AddTransitionEffect(mainCamera);
  var postProcess = new BABYLON.ImageProcessingPostProcess("processing", 1.0, mainCamera);
    postProcess.vignetteWeight = 4;
    postProcess.vignetteStretch = 1;
    postProcess.vignetteColor = new BABYLON.Color4(0, 0, 0, 0);
    postProcess.vignetteEnabled = true;
}

async function addObject () {
  floatingRoot = new BABYLON.TransformNode("floatingRoot");
  walkingRoot = new BABYLON.TransformNode("walkingRoot");
  screenRoot = new BABYLON.TransformNode("screenRoot");
  satelliteRoot = new BABYLON.TransformNode("satelliteRoot");

  // earth
  earth = await addEarth(mainScene, renderTarget);

  //right bottom img
  rightBottomGUI = addRightBottomUI(mainScene);

  // mini earth
  miniEarth = addMiniEarth(subSceneForMiniEarth);


  BABYLON.SceneLoader.Append("./assets/", "01.glb", mainScene, (obj) => {
    human = <BABYLON.Mesh>mainScene.getMeshByName("__root__");
    human.scaling = new BABYLON.Vector3(1, 1, 1);
    human.rotation = new BABYLON.Vector3(0, 0, 0);
    human.parent = floatingRoot;
  });

  // screen
  screen = addScreen(mainScene, renderTarget, screenRoot);

  // particles
  CreateGalaxy(mainScene);

  // light
  light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), mainScene);
  light.intensity = 0.7;

  // add root
  screenCamera.position = new BABYLON.Vector3(0, 2.5, 0);
  screenCamera.setTarget(BABYLON.Vector3.Zero());
  screenCamera.parent = satelliteRoot;

  addGreenPillar(mainScene);
  addEarthAroundLine(mainScene);
}

function floatingModeInit () {
  vlat = 0;
  vlon = 0;
  // screenRoot.rotate(screenRoot.right, 1.57);
  walkingRoot.rotate(floatingRoot.right, 1.57);
  human.parent = floatingRoot;
  // human.rotate(BABYLON.Vector3.Right(), -1.57);
  miniEarth.visibility = 0;
  rightBottomGUI.rootContainer.isVisible = false;
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
  satelliteRoot.position = p;
  // walkingRoot.rotate(floatingRoot.right, -1.57);
  WarpEffect(mainScene, p);
  WarpEffect(mainScene, floatingRoot.position);
  cameraPosforWalkingMode = p.clone().add(new BABYLON.Vector3(0, 0, -8));//floatingRoot.position.add(floatingRoot.up.scale(-5)).add(floatingRoot.forward.scale(-1));

  miniEarth.visibility = 1;
  rightBottomGUI.rootContainer.isVisible = true;

  // humanを回転させる処理
  const q1 = lookAt(new BABYLON.Vector3(0, 1, 0), new BABYLON.Vector3(0, 0, 0), walkingRoot.position.clone().normalize());
  walkingRoot.rotationQuaternion = q1;

  mode = Mode.walking;
}

engine.runRenderLoop(() => {
  update();
  mainScene.render();
  subSceneForMiniEarth.render();
});
