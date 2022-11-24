import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";
import { calcLonLatToXYZ, lookAt, getDecimal, params } from "./Common";
import { AdvancedDynamicTexture, Image } from "@babylonjs/gui/2D";

export const addGreenPillar = (scene) => {
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
    const pillarMat = new BABYLON.ShaderMaterial("cyos", scene, { vertex: "custom", fragment: "custom" }, { needAlphaBlending: true });
    pillarMat.forceDepthWrite = true;
    const pillar = BABYLON.CreateCylinder("pillar01", { height: 0.5, diameter: 0.12 }, scene);
    pillar.material = pillarMat;
    const pos = calcLonLatToXYZ(Math.random() * Math.PI * 2.0, Math.random() * Math.PI, 7.75);
    const q = lookAt(new BABYLON.Vector3(0, 1, 0), new BABYLON.Vector3(0, 0, 0), pos.clone().normalize());
    pillar.rotationQuaternion = q;
    pillar.position = pos;
  }
};

export const addScreen = async (scene, renderTarget, root) => {
  let screen;
  await BABYLON.SceneLoader.LoadAssetContainerAsync("./assets/", "test.glb", scene).then((container) => {
    screen = container.meshes[1];
    screen.scaling = new BABYLON.Vector3(4.7, 4.7, 4.7);
    screen.parent = root;
    screen.position.z = 10;
    screen.position.y = 10;

    scene.addMesh(screen);
  });

  BABYLON.Effect.ShadersStore.screenVertexShader = `
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
  BABYLON.Effect.ShadersStore.screenFragmentShader = `
  precision highp float;

  varying vec2 vUV;
  varying vec3 lPos;

  uniform sampler2D cameraTexture;
  uniform sampler2D uiTexture;
  uniform sampler2D cornerTexture;

  uniform float screenInfoAlpha;

  void main(void) {
    vec4 cam = texture2D(cameraTexture, vUV);
    vec4 ui = texture2D(uiTexture, vec2(1.0-vUV.x, 1.0-vUV.y));
    float a = ui.a * screenInfoAlpha;
    vec4 corner = texture2D(cornerTexture, vUV);
    gl_FragColor = mix(cam, ui, a) + corner;
  }
  `;
  const screenMat = new BABYLON.ShaderMaterial("screen", scene, { vertex: "screen", fragment: "screen" },
    {
      needAlphaBlending: true,
      attributes: ["position", "normal", "uv"],
      uniforms: ["worldViewProjection", "cameraTexture", "uiTexture", "cornerTexture", "screenInfoAlpha"],
    });
  const GameTitleGUITexture = AdvancedDynamicTexture.CreateForMesh(screen, 2350, 1000, true, false, true);
  await GameTitleGUITexture.parseFromSnippetAsync("#EBFC21#1");
  const corner = new BABYLON.Texture("./assets/Screen/corner.png");
  screenMat.setTexture("cameraTexture", renderTarget);
  screenMat.setTexture("uiTexture", GameTitleGUITexture);
  screenMat.setTexture("cornerTexture", corner);
  screenMat.backFaceCulling = false;
  screen.material = screenMat;// rttMaterial;
  return { screen, screenMat };
};

export const addEarthAroundLine = (scene) => {
  const linePoints = [];
  const _lat = 0;
  let _lon = 0;

  for (let i = -1; i < 1; i += 0.01) {
    _lon = i;
    const _phi = getDecimal(_lat) * params.pi * 2;
    const _theta = getDecimal(_lon) * params.pi;

    const p = calcLonLatToXYZ(_phi, _theta, params.humanAlt);
    linePoints.push(p);
  }

  const m = new BABYLON.BackgroundMaterial("lineMat", scene);
  // m.diffuseColor = new BABYLON.Color3(1, 1, 1);
  // m.specularColor = new BABYLON.Color3(0.5, 0.6, 0.87);
  // m.emissiveColor = new BABYLON.Color3(1, 1, 1);
  // m.ambientColor = new BABYLON.Color3(0.23, 0.98, 0.53);
  BABYLON.MeshBuilder.CreateLines("lines", { points: linePoints, material: m }, scene);
};

export const addMiniEarth = (scene) => {
  const miniEarth = BABYLON.CreateSphere("sphere1", { segments: 20, diameter: 2 }, scene);
  // miniEarth.position = new BABYLON.Vector3(-1, 0, -8);
  miniEarth.position = new BABYLON.Vector3(100, 0, 3);

  BABYLON.Effect.ShadersStore.miniEarthVertexShader = `
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
  BABYLON.Effect.ShadersStore.miniEarthFragmentShader = `
  precision highp float;

  varying vec2 vUV;
  varying vec3 lPos;

  uniform sampler2D mainTexture;

  void main(void) {
    vec4 _Color = vec4(0.45, 0.52, 0.55, 1.0);
    vec4 _ColorLine = vec4(0.29, 0.255, 0.255, 1.0);
    vec4 _ColorOcean = vec4(0.09, 0.13, 0.27, 0.51);
    float _Threshold = 0.985;
    float _Freq = 90.0;
    float _FreqH = 180.0;

    vec4 _line = _ColorLine * clamp(step(_Threshold, sin(vUV.y * _Freq)) + step(_Threshold, sin(vUV.x * _FreqH)), 0.0, 1.0);
    float ocean = texture2D(mainTexture, vUV).b;
    vec4 _c = vec4(mix(_Color.x, _ColorOcean.x, ocean), mix(_Color.y, _ColorOcean.y, ocean), mix(_Color.z, _ColorOcean.z, ocean), 1.0);

    gl_FragColor = _c + _line;
  }
  `;

  const miniEarthMat = new BABYLON.ShaderMaterial("miniEarth", scene, { vertex: "miniEarth", fragment: "miniEarth" }, { needAlphaBlending: true, disableDepthWrite: true });
  miniEarth.material = miniEarthMat;
  const tex = new BABYLON.Texture("./assets/earth_multimap.png");
  miniEarthMat.setTexture("mainTexture", tex);

  miniEarth.rotate(BABYLON.Vector3.Right(), 3.14);
  miniEarth.renderingGroupId = 1;
  miniEarth.visibility = 0;
  return miniEarth;
};

export const addEarth = async (scene, renderTarget) => {
  const earth = BABYLON.CreateSphere("sphere1", { segments: 30, diameter: 15 }, scene);
  await BABYLON.NodeMaterial.ParseFromSnippetAsync("#IMYMEK#17", scene).then((nodeMaterial) => {
    earth.material = nodeMaterial; // #IMYMEK#2
  });
  earth.rotate(BABYLON.Vector3.Right(), 3.14);
  if (renderTarget.renderList !== null) {
    renderTarget.renderList.push(earth); // rendertargettextureに書き込むオブジェクトを指定
  }

  return earth;
};

export const addRightBottomUI = (scene) => {
  // const root = new BABYLON.TransformNode();
  const guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI2", true, scene);

  const image = new Image("img", "./assets/Screen/guide_right.png");
  image.width = "150px";
  image.height = "150px";
  image.top = 280;
  image.left = 400;
  guiTexture.addControl(image);
  guiTexture.rootContainer.isVisible = false;
  return guiTexture;
};

export const addSatellite = async (scene) => {
  let satellite;
  await BABYLON.SceneLoader.LoadAssetContainerAsync("./assets/", "satellite.glb", scene).then((container) => {
    satellite = container.meshes[1];
    satellite.scaling = new BABYLON.Vector3(0.3, 0.3, 0.3);
    satellite.rotate(BABYLON.Vector3.Up(), 3.14);
    satellite.rotate(BABYLON.Vector3.Right(), -1.57);
    // satellite.position = new BABYLON.Vector3(0, 0.75, 0);
    scene.addMesh(satellite);
  });

  return satellite;
};

export const addPlayerArrow = async (scene) => {
  let playerArrow;
  await BABYLON.SceneLoader.LoadAssetContainerAsync("./assets/", "playerArrow.glb", scene).then((container) => {
    playerArrow = container.meshes[1];
    playerArrow.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);
    playerArrow.rotate(BABYLON.Vector3.Up(), 3.14);
    // playerArrow.rotate(BABYLON.Vector3.Up(), 3.14);
    // playerArrow.rotate(BABYLON.Vector3.Right(), -1.57);
    // satellite.position = new BABYLON.Vector3(0, 0.75, 0);
    const mat = new BABYLON.StandardMaterial("playerArrowMaterial", scene);
    mat.diffuseColor = new BABYLON.Color3(1, 1, 1);
    // mat.specularColor = new BABYLON.Color3(0.5, 0.6, 0.87);
    mat.emissiveColor = new BABYLON.Color3(1, 1, 1);
    // mat.ambientColor = new BABYLON.Color3(0.23, 0.98, 0.53);
    mat.disableLighting = true;
    mat.backFaceCulling = false;
    playerArrow.material = mat;

    scene.addMesh(playerArrow);
  });

  return playerArrow;
};
