import * as BABYLON from "@babylonjs/core";

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas);
const mainScene = new BABYLON.Scene(engine);
const mainCamera = new BABYLON.UniversalCamera("mainCamera", new BABYLON.Vector3(0, 0, 0), mainScene);
const screenCamera = new BABYLON.UniversalCamera("subCamera", new BABYLON.Vector3(0, 0, -1), mainScene);

const root = new BABYLON.TransformNode("root");
const mainCameraRoot = new BABYLON.TransformNode("mainCameraRoot");

mainCamera.attachControl(canvas, true);
mainScene.clearColor = new BABYLON.Color3(0.0, 0.0, 0.0);

const renderTarget = new BABYLON.RenderTargetTexture("depth", 1024, mainScene, true); // rendertargettextureの作成(unityでいうrendertexture)
renderTarget.activeCamera = screenCamera; // rendertargettextureのアクティブカメラを指定
mainScene.customRenderTargets.push(renderTarget); // rendertargettextureを有効化

screenCamera.parent = root;
mainCamera.parent = mainCameraRoot;
mainCameraRoot.position = new BABYLON.Vector3(0, 0, -15);

let vlat = 0;
let vlon = 0;
let lon = 0.5; // y
let lat = 0.5; // x
const alt = 8;
const t = 0.03;
const pi = 3.1415;
const attenuationRate = 0.998;
const acceleration = 0.015;

// camera.attachControl(canvas, true);

const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), mainScene);
light.intensity = 0.7;

const material = new BABYLON.StandardMaterial("test", mainScene);
material.diffuseTexture = new BABYLON.Texture("./assets/earth.png");
material.ambientColor = new BABYLON.Color3(1, 1, 1);
material.emissiveColor = new BABYLON.Color3(1, 1, 1);

// earth
const sphere = BABYLON.CreateSphere("sphere1", { segments: 20, diameter: 15 }, mainScene);
sphere.material = material;
sphere.rotate(BABYLON.Vector3.Right(), 3.14);
renderTarget.renderList.push(sphere); // rendertargettextureに書き込むオブジェクトを指定

// human
const obj = BABYLON.CreateCapsule("obj", { height: 1, radius: 0.125 }, mainScene);

obj.material = new BABYLON.StandardMaterial("objMat");

obj.parent = root;
root.position.y = -2;

// screen
const plane = BABYLON.CreatePlane("map", { width: 40, height: 20 }, mainScene);
plane.position.z = 20;
plane.position.y = 10;
const rttMaterial = new BABYLON.StandardMaterial("RTT", mainScene);
rttMaterial.emissiveTexture = renderTarget;
rttMaterial.disableLighting = true;
plane.material = rttMaterial;

// particles
const ps = new BABYLON.ParticleSystem("particles", 10000, mainScene);
ps.particleTexture = new BABYLON.Texture("./assets/particle.png");
const emitter = new BABYLON.SphereParticleEmitter();
emitter.radius = 50;
emitter.radiusRange = 0;
ps.particleEmitterType = emitter;
ps.emitRate = 500;
ps.minSize = 0.15;
ps.maxSize = 0.3;
ps.addColorGradient(0, new BABYLON.Color4(0, 0, 0, 0.0));
ps.addColorGradient(0.1, new BABYLON.Color4(1, 1, 1, 1.0));
ps.addColorGradient(0.8, new BABYLON.Color4(1, 1, 1, 1.0));
ps.addColorGradient(1.0, new BABYLON.Color4(0, 0, 0, 0.0));
ps.minLifeTime = 5.0;
ps.maxLifeTime = 20.0;
// Blend mode : BLENDMODE_ONEONE, BLENDMODE_STANDARD, or BLENDMODE_ADD
ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
ps.start();

// keyevent
mainScene.onKeyboardObservable.add((kbInfo) => {
  switch (kbInfo.type) {
    case BABYLON.KeyboardEventTypes.KEYDOWN:
      switch (kbInfo.event.key) {
        case "w":
          vlon = vlon - acceleration * t;
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
        default:
          break;
      }
      vlat = BABYLON.Scalar.Clamp(vlat, -10, 10);
      vlon = BABYLON.Scalar.Clamp(vlon, -10, 10);
  }
});

function update () {
  vlat = vlat * attenuationRate;
  vlon = vlon * attenuationRate;

  lat = lat + vlat * t;
  lon = lon + vlon * t;
  const phi = getDecimal(lat) * pi * 2;
  const theta = BABYLON.Scalar.Clamp(getDecimal(lon) * pi, 0.2, pi - 0.2);

  const x = alt * Math.sin(theta) * Math.sin(phi);
  const y = alt * Math.cos(theta);
  const z = alt * Math.sin(theta) * Math.cos(phi);

  root.position = new BABYLON.Vector3(x, y, z);
  root.lookAt(new BABYLON.Vector3(0, 0, 0));

  // mainCameraRoot.rotate(BABYLON.Vector3.Up, 45
  const offset = 2.0;
  mainCameraRoot.lookAt(root.position);
  mainCameraRoot.position = BABYLON.Vector3.Lerp(mainCameraRoot.position, new BABYLON.Vector3(x, y, z).scale(offset), 0.005);

  // console.log("root pos : " + root.position);
  // console.log("maincam : " + mainCameraRoot.position);
}

function getDecimal (num) {
  return num - ((num >= 0) ? Math.floor(num) : Math.ceil(num));
}

// Render every frame
engine.runRenderLoop(() => {
  update();
  mainScene.render();
});
