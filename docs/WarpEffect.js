import * as BABYLON from "@babylonjs/core";
// import { calcLonLatToXYZ, lookAt } from "./Common";
import { gsap } from "gsap";

export const WarpEffect = (scene, position) => {
  const root = new BABYLON.TransformNode("root", scene);

  // rectangle
  const rootRectangleParticleSystem = new BABYLON.TransformNode("rootRectangleParticleSystem", scene);
  const rectangleParticleSystem = new BABYLON.ParticleSystem("rectangleParticles", 20, scene);
  rootRectangleParticleSystem.position = new BABYLON.Vector3(0, 2, 0);
  rectangleParticleSystem.isLocal = true;
  // rectangleParticleSystem.emitRate = 1000;
  rectangleParticleSystem.manualEmitCount = 20;
  rectangleParticleSystem.maxSize = 0.1;
  rectangleParticleSystem.minSize = 0.1;
  rectangleParticleSystem.minScaleX = 0.1;
  rectangleParticleSystem.maxScaleX = 0.2;
  rectangleParticleSystem.minScaleY = 5;
  rectangleParticleSystem.maxScaleY = 6;
  rectangleParticleSystem.minLifeTime = 1.0;
  rectangleParticleSystem.maxLifeTime = 1.0;

  rectangleParticleSystem.particleTexture = new BABYLON.Texture("assets/rectangle.png");
  rectangleParticleSystem.emitter = rootRectangleParticleSystem;
  rootRectangleParticleSystem.parent = root;

  rectangleParticleSystem.addVelocityGradient(0, 0);
  rectangleParticleSystem.addVelocityGradient(1, 10);

  rectangleParticleSystem.addColorGradient(0.0, new BABYLON.Color4(1, 1, 1, 0.1));
  rectangleParticleSystem.addColorGradient(0.45, new BABYLON.Color4(0, 0, 0, 0));

  rectangleParticleSystem.start();

  // square
  const rootSquareParticleSystem = new BABYLON.TransformNode("rootSquareParticleSystem", scene);
  const squareParticleSystem = new BABYLON.ParticleSystem("squareParticles", 30, scene);
  rootSquareParticleSystem.position = new BABYLON.Vector3(0, 2, 0);
  squareParticleSystem.isLocal = true;
  // squareParticleSystem.emitRate = 1000;
  squareParticleSystem.manualEmitCount = 30;
  squareParticleSystem.maxSize = 0.05;
  squareParticleSystem.minSize = 0.05;
  squareParticleSystem.minLifeTime = 1.0;
  squareParticleSystem.maxLifeTime = 1.0;

  const noiseTexture = new BABYLON.NoiseProceduralTexture("perlin", 256, scene);
  noiseTexture.animationSpeedFactor = 5;
  noiseTexture.persistence = 2;
  noiseTexture.brightness = 0.5;
  noiseTexture.octaves = 2;

  squareParticleSystem.noiseTexture = noiseTexture;
  squareParticleSystem.noiseStrength = new BABYLON.Vector3(10, 10, 10);

  squareParticleSystem.particleTexture = new BABYLON.Texture("assets/rectangle.png");

  squareParticleSystem.emitter = rootSquareParticleSystem;
  rootSquareParticleSystem.parent = root;

  squareParticleSystem.addColorGradient(0.0, new BABYLON.Color4(1, 1, 1, 0.1));
  squareParticleSystem.addColorGradient(0.45, new BABYLON.Color4(0, 0, 0, 0));

  squareParticleSystem.start();

  // cylinder
  const value = {
    alpha: 0,
  };

  BABYLON.Effect.ShadersStore.effectPillarVertexShader = `
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
  BABYLON.Effect.ShadersStore.effectPillarFragmentShader = `
  precision highp float;

  varying vec2 vUV;
  varying vec3 lPos;

  uniform sampler2D textureSampler;
  uniform float alpha;

  void main(void) {
      gl_FragColor = vec4(1, 1, 1, 0.4-lPos.y);//clamp((0.4-lPos.y)-alpha, 0.0, 1.0));
  }
  `;

  const pillarRoot = new BABYLON.TransformNode("pillarRoot");
  const pillarMat = new BABYLON.ShaderMaterial("effectPillarMat", scene, { vertex: "effectPillar", fragment: "effectPillar" }, { needAlphaBlending: true });
  const pillar = BABYLON.CreateCylinder("effetcPillar", { height: 0.5, diameter: 0.6 }, scene);
  pillar.material = pillarMat;
  pillar.position = new BABYLON.Vector3(0, 0.25, 0);
  pillar.parent = pillarRoot;
  pillarRoot.parent = root;

  root.position = position;
  gsap.to(pillarRoot.scaling, {
    y: 2,
    duration: 0.3,
    repeat: 0,
    onComplete: () => {
      scene.removeMesh(pillar);
    },
  });

  // gsap.to(root.scaling, {
  //   y: 2,
  //   duration: 0.3,
  //   repeat: 1,
  //   onComplete: () => {
  //     gsap.to(value, {
  //       alpha: 1.0,
  //       duration: 1.0,
  //       onUpdate: () => {
  //         pillarMat.setFloat("alpha", value.alpha);
  //       },
  //     });
  //   },
  // });
};
