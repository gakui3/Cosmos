import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";
import "@babylonjs/gui";
import { Galaxy } from "./Galaxy";
import { WarpEffect } from "./WarpEffect";
// import { AdvancedDynamicTexture } from "@babylonjs/gui/2D";

const Mode = {
  floating: 0,
  walking: 1,
};

let vlat = 0;
let vlon = 0;
let lon = 0.5; // y
let lat = 0.5; // x
const humanAlt = 8;
const t = 0.03;
const pi = 3.1415;
const attenuationRate = 0.998;
const acceleration = 0.02;
let mode = Mode.floating;
let amount = 0;
let earth, human, debug, screen, mainCamera, screenCamera, renderTarget, floatingRoot, walkingRoot, screenRoot, mainCameraRoot, light, cameraPosforWalkingMode, currentPhi, currentTheta, galaxy;

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
        case "i":
          BABYLON.Tools.CreateScreenshotUsingRenderTarget(engine, screenCamera, { width: 1920, height: 1080 });
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
      currentPhi = getDecimal(lat) * pi * 2;
      currentTheta = BABYLON.Scalar.Clamp(getDecimal(lon) * pi, 0.2, pi - 0.2);

      const p = calcLonLatToXYZ(currentPhi, currentTheta, humanAlt);
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

  renderTarget = new BABYLON.RenderTargetTexture("depth", 1920, mainScene, true); // rendertargettextureの作成(unityでいうrendertexture)
  renderTarget.activeCamera = screenCamera; // rendertargettextureのアクティブカメラを指定
  mainScene.customRenderTargets.push(renderTarget); // rendertargettextureを有効化

  addGUI();
  addPostprocessing();

  // WarpEffect();
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
  // human = BABYLON.MeshBuilder.CreateCylinder("cylinder", { diameterTop: 0.1, height: 0.8, diameterBottom: 0.25 });// BABYLON.CreateCapsule("obj", { height: 1, radius: 0.125 }, mainScene);
  // human.material = new BABYLON.StandardMaterial("objMat");
  // human.parent = floatingRoot;
  // const localAxes = new BABYLON.AxesViewer(mainScene, 1);
  // localAxes.xAxis.parent = floatingRoot;
  // localAxes.yAxis.parent = floatingRoot;
  // localAxes.zAxis.parent = floatingRoot;
  // floatingRoot.position.y = -2;
  BABYLON.SceneLoader.Append("./assets/", "01.glb", mainScene, (obj) => {
    human = mainScene.getMeshByName("__root__");
    human.scaling = new BABYLON.Vector3(1, 1, 1);
    human.rotation = new BABYLON.Vector3(0, 0, 0);
    human.parent = floatingRoot;
  });

  // debug obj
  debug = BABYLON.CreateSphere("debug", { diameter: 0.5 }, mainScene);
  debug.material = new BABYLON.StandardMaterial("debugMat");

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
  screenCamera.position.y = -0.5;
  screenCamera.parent = floatingRoot;
  mainCamera.parent = mainCameraRoot;

  // add green pillar
  BABYLON.Effect.ShadersStore.customVertexShader = `
  precision highp float;

  // Attributes
  attribute vec3 position;
  attribute vec2 uv;

  uniform mat4 worldViewProjection;
  varying vec2 vUV;
  varying vec3 lPos;

  void main(void) {
      gl_Position = worldViewProjection * vec4(position, 1.0);
      vUV = uv;
      lPos = position;
  }
  `;
  BABYLON.Effect.ShadersStore.customFragmentShader = `
  precision highp float;

  varying vec2 vUV;
  varying vec3 lPos;

  uniform sampler2D textureSampler;

  void main(void) {
      gl_FragColor = vec4(0, 1, 0, 0.4-lPos.y);
  }
  `;

  for (let i = 0; i < 20; i++) {
    const pillarMat = new BABYLON.ShaderMaterial("cyos", mainScene, { vertex: "custom", fragment: "custom" }, { needAlphaBlending: true });
    const pillar = BABYLON.CreateCylinder("pillar01", { height: 0.5, diameter: 0.12 }, mainScene);
    pillar.material = pillarMat;
    const pos = calcLonLatToXYZ(Math.random() * Math.PI * 2.0, Math.random() * Math.PI, 7.75);
    const q = lookAt(new BABYLON.Vector3(0, 1, 0), new BABYLON.Vector3(0, 0, 0), pos.clone().normalize());
    pillar.rotationQuaternion = q;
    pillar.position = pos;
  }

  addEarthAroundLine();
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
  // walkingRoot.rotate(floatingRoot.right, -1.57);
  cameraPosforWalkingMode = floatingRoot.position.add(floatingRoot.up.scale(-5)).add(floatingRoot.forward.scale(-1));

  // humanを回転させる処理
  const q1 = lookAt(new BABYLON.Vector3(0, 1, 0), new BABYLON.Vector3(0, 0, 0), walkingRoot.position.clone().normalize());
  walkingRoot.rotationQuaternion = q1;
  let r = Math.acos(BABYLON.Vector3.Dot((walkingRoot.position.clone().subtract(cameraPosforWalkingMode)).normalize(), walkingRoot.forward));
  r = currentPhi < 3.14 ? r * -1 : r;
  walkingRoot.rotate(walkingRoot.position.clone().normalize(), r, BABYLON.Space.WORLD);

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

function lookAt (currentDir, currentPos, targetPos) {
  const targetDir = targetPos.subtract(currentPos);
  const axis = currentDir.clone().cross(targetDir);
  const rad = Math.acos(BABYLON.Vector3.Dot(targetDir, currentDir));
  const q = BABYLON.Quaternion.RotationAxis(axis, rad);
  return q;
}

function calcLonLatToXYZ (phi, theta, alt) {
  const x = alt * Math.sin(theta) * Math.sin(phi);
  const y = alt * Math.cos(theta);
  const z = alt * Math.sin(theta) * Math.cos(phi);
  return new BABYLON.Vector3(x, y, z);
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

function addEarthAroundLine () {
  const linePoints = [];

  const _lat = 0;
  let _lon = 0;

  for (let i = -1; i < 1; i += 0.01) {
    _lon = i;
    const _phi = getDecimal(_lat) * pi * 2;
    const _theta = getDecimal(_lon) * pi;

    const p = calcLonLatToXYZ(_phi, _theta, humanAlt);
    linePoints.push(p);
  }

  BABYLON.MeshBuilder.CreateLines("lines", { points: linePoints });
}

function addPostprocessing () {
  BABYLON.Effect.ShadersStore.customFragmentShader = `
    #ifdef GL_ES
        precision highp float;
    #endif

    // Samplers
    varying vec2 vUV;
    uniform sampler2D textureSampler;

    // Parameters
    uniform vec2 screenSize;
    uniform float threshold;

    void main(void) 
    {
        //vec2 texelSize = vec2(1.0 / screenSize.x, 1.0 / screenSize.y);
        vec4 baseColor = texture2D(textureSampler, vUV);


        //if (baseColor.r < threshold) {
        //    gl_FragColor = baseColor;
        //} else {
        //    gl_FragColor = vec4(0);
        //}
        gl_FragColor = baseColor;
    }
    `;

  const postProcess = new BABYLON.PostProcess("My custom post process", "custom", ["screenSize", "threshold"], null, 1, mainCamera);
  postProcess.onApply = function (effect) {
    effect.setFloat2("screenSize", postProcess.width, postProcess.height);
    effect.setFloat("threshold", 0.30);
  };
}

// Render every frame
engine.runRenderLoop(() => {
  update();
  mainScene.render();
});
