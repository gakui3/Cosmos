import * as BABYLON from "@babylonjs/core";

export const CreateGalaxy = (scene) => {
  const ps = new BABYLON.ParticleSystem("particles", 10000, scene);
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
};
