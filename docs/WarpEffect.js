import * as BABYLON from "@babylonjs/core";

export const WarpEffect = (scene, cylinder) => {
  // rectangle
  const rectangleParticleSystem = new BABYLON.ParticleSystem("rectangleParticles", 20);
  rectangleParticleSystem.emitRate = 1000;
  rectangleParticleSystem.maxSize = 0.1;
  rectangleParticleSystem.minSize = 0.1;
  rectangleParticleSystem.minScaleX = 0.1;
  rectangleParticleSystem.maxScaleX = 0.2;
  rectangleParticleSystem.minScaleY = 1.0;
  rectangleParticleSystem.maxScaleY = 1.5;
  rectangleParticleSystem.minLifeTime = 1.0;
  rectangleParticleSystem.maxLifeTime = 1.0;

  rectangleParticleSystem.particleTexture = new BABYLON.Texture("assets/rectangle.png");
  rectangleParticleSystem.emitter = new BABYLON.Vector3(0, 0, -8);

  rectangleParticleSystem.addVelocityGradient(0, 0);
  rectangleParticleSystem.addVelocityGradient(1, 10);

  rectangleParticleSystem.addColorGradient(0.0, new BABYLON.Color4(1, 1, 1, 0.1));
  rectangleParticleSystem.addColorGradient(0.45, new BABYLON.Color4(0, 0, 0, 0));

  rectangleParticleSystem.start();

  // square
  const squareParticleSystem = new BABYLON.ParticleSystem("squareParticles", 30);
  squareParticleSystem.emitRate = 1000;
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
  squareParticleSystem.emitter = new BABYLON.Vector3(0, 0, -8);

  squareParticleSystem.addColorGradient(0.0, new BABYLON.Color4(1, 1, 1, 0.1));
  squareParticleSystem.addColorGradient(0.45, new BABYLON.Color4(0, 0, 0, 0));

  squareParticleSystem.start(100);

  // cylinder
};
