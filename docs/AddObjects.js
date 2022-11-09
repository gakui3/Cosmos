import * as BABYLON from "@babylonjs/core";
import { calcLonLatToXYZ, lookAt, getDecimal, params } from "./Common";

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
    const pillar = BABYLON.CreateCylinder("pillar01", { height: 0.5, diameter: 0.12 }, scene);
    pillar.material = pillarMat;
    const pos = calcLonLatToXYZ(Math.random() * Math.PI * 2.0, Math.random() * Math.PI, 7.75);
    const q = lookAt(new BABYLON.Vector3(0, 1, 0), new BABYLON.Vector3(0, 0, 0), pos.clone().normalize());
    pillar.rotationQuaternion = q;
    pillar.position = pos;
  }
};

export const addEarthAroundLine = () => {
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

  BABYLON.MeshBuilder.CreateLines("lines", { points: linePoints });
};

export const addMiniEarth = (scene) => {
  const miniEarth = BABYLON.CreateSphere("sphere1", { segments: 20, diameter: 1 }, scene);
  miniEarth.position = new BABYLON.Vector3(-1, 0, -8);

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

  uniform sampler2D textureSampler;

  void main(void) {
      gl_FragColor = vec4(0, 1, 0, 0.4-lPos.y);
  }
  `;

  const miniEarthMat = new BABYLON.ShaderMaterial("miniEarth", scene, { vertex: "miniEarth", fragment: "miniEarth" }, { needAlphaBlending: true });
  miniEarthMat.diffuseTexture = new BABYLON.Texture("./assets/earth_multimap.png");
  miniEarthMat.ambientColor = new BABYLON.Color3(1, 1, 1);
  miniEarthMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
  miniEarth.material = miniEarthMat;
  miniEarth.rotate(BABYLON.Vector3.Right(), 3.14);
};
