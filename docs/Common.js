import * as BABYLON from "@babylonjs/core";

export const Mode = {
  floating: 0,
  walking: 1,
};

export const params = {
  humanAlt: 8,
  t: 0.03,
  pi: 3.1415,
  attenuationRate: 0.998,
  acceleration: 0.02,
};

export const calcLonLatToXYZ = (phi, theta, alt) => {
  const x = alt * Math.sin(theta) * Math.sin(phi);
  const y = alt * Math.cos(theta);
  const z = alt * Math.sin(theta) * Math.cos(phi);
  return new BABYLON.Vector3(x, y, z);
};

export const getDecimal = (num) => {
  return num - ((num >= 0) ? Math.floor(num) : Math.ceil(num));
};

export const lookAt = (currentDir, currentPos, targetPos) => {
  const targetDir = targetPos.subtract(currentPos);
  const axis = currentDir.clone().cross(targetDir);
  const rad = Math.acos(BABYLON.Vector3.Dot(targetDir, currentDir));
  const q = BABYLON.Quaternion.RotationAxis(axis, rad);
  return q;
};
