import * as BABYLON from "@babylonjs/core";
import GUI from "lil-gui";
import { gsap } from "gsap";

const params = {
  Width: 0.0,
  Core: 0.5,
  NoiseScale: 20.0,
  NoiseSpeed: 2.38,
  Time: 0,
  FadeOut: () => {
    FadeOut();
  },
  FadeIn: () => {
    FadeIn();
  },
};

export const FadeIn = () => {
  gsap.fromTo(params, { Width: 1.0 }, { duration: 1.25, Width: 2.0, ease: "power2.in" });
};

export const FadeOut = () => {
  gsap.fromTo(params, { Width: 0.0 }, { duration: 1.25, Width: 1.0, ease: "power2.out" });
};

export const FadeInOut = () => {
  gsap.fromTo(params, { Width: 0.0 }, { duration: 1.25, Width: 1.0, ease: "power2.out", onComplete: () => { FadeIn(); } });
};

export const AddTransitionEffect = (camera) => {
  const gui = new GUI();

  BABYLON.Effect.ShadersStore.customFragmentShader = `
    #ifdef GL_ES
        precision highp float;
    #endif

    // Samplers
    varying vec2 vUV;
    uniform sampler2D textureSampler;

    // Parameters
    uniform vec4 _Color;
    uniform float _Width;
    uniform float _Core;
    uniform float _NoiseScale;
    uniform float _NoiseSpeed;
    uniform float _Time;

    float _norm(float value, float low, float hight){
        return(value-low)/(hight-low);
    }
    
    float _Lerp(float sourceValue1, float sourceValue2, float amount){
        return sourceValue1 + (sourceValue2 - sourceValue1) * amount;
    }
        
    float Map(float value, float low1, float hight1, float low2, float hight2){
        return _Lerp(low2, hight2, _norm(value, low1, hight1));
    }

    float rand(vec3 co) {
        return fract(sin(dot(co.xyz, vec3(12.9898, 78.233, 56.787))) * 43758.5453);
    }

    // Value Noise
    float noise(vec3 pos) {
        vec3 ip = floor(pos);
        vec3 fp = fract(pos);
        vec4 a = vec4(
            rand(ip + vec3(0, 0, 0)),
            rand(ip + vec3(1, 0, 0)),
            rand(ip + vec3(0, 1, 0)),
            rand(ip + vec3(1, 1, 0)));
        vec4 b = vec4(
            rand(ip + vec3(0, 0, 1)),
            rand(ip + vec3(1, 0, 1)),
            rand(ip + vec3(0, 1, 1)),
            rand(ip + vec3(1, 1, 1)));

        a = mix(a, b, fp.z);
        a.xy = mix(a.xy, a.zw, fp.y);
        return mix(a.x, a.y, fp.x);
    }

    // Perlin Noise
    float perlin(vec3 pos) {
        return (noise(pos) * 32.0 + noise(pos * 2.0) * 16.0 + noise(pos * 4.0) * 8.0 + noise(pos * 8.0) * 4.0 + noise(pos * 16.0) * 2.0 + noise(pos * 32.0)) / 63.0;
    }

    void main(void) 
    {
        vec4 baseColor = texture2D(textureSampler, vUV);
        float v = _Width + 0.1;


        if(v <= 1.1){
            float d = clamp((1.0 - abs(1.2-vUV.y) * (11.0 - v * 10.0) * 2.0) * (1.0 + _Core), 0.0, 1.0)
                * clamp((1.0 - abs(vUV.x - 0.5) * (11.0 - v * 10.0) * 2.0) * (1.0 + _Core), 0.0, 1.0);

            d = d * 2.0;
            d *= perlin(vec3(vUV.x, vUV.y, 1) * _NoiseScale + _Time * _NoiseSpeed);
            d = step(d, 0.5);// *(1.0 - step(d, v));
            d = (1.0 - d);
            float s = Map(v, 1.05, 1.1, 0.0, 1.0);
            float p = step(1.0-s, vUV.y);

            gl_FragColor = mix(baseColor, vec4(_Color.rgb, 1), d+p);//vec4(_Color.rgb, d) * baseColor;
        }else{
            float _v = Map(v, 1.1, 2.1, 1.1, 0.0);
            float d = clamp((1.0 - abs(vUV.y+0.2) * (11.0 - _v * 10.0) * 2.0) * (1.0 + _Core), 0.0, 1.0)
                * clamp((1.0 - abs(vUV.x - 0.5) * (11.0 - _v * 10.0) * 2.0) * (1.0 + _Core), 0.0, 1.0);

            d = d * 2.0;
            d *= perlin(vec3(vUV.x, vUV.y, 1) * _NoiseScale + _Time * _NoiseSpeed);
            d = step(d, 0.5);// *(1.0 - step(d, v));
            d = (1.0 - d);
            float s = Map(v, 1.1, 1.15, 1.0, 0.0);
            float p = 1.0-step(s, vUV.y);

            gl_FragColor = mix(baseColor, vec4(_Color.rgb, 1), d+p);
        }
    }
    `;

  const postProcess = new BABYLON.PostProcess("My custom post process", "custom", ["_Cplor", "_Width", "_Core", "_NoiseScale", "_NoiseSpeed", "_Time"], null, 1, camera);
  postProcess.onApply = function (effect) {
    // effect.setFloat2("screenSize", postProcess.width, postProcess.height);
    // effect.setFloat("threshold", 0.30);
    effect.setFloat4("_Color", 0, 0, 0, 1.0);
    effect.setFloat("_Width", params.Width);
    effect.setFloat("_Core", params.Core);
    effect.setFloat("_NoiseScale", params.NoiseScale);
    effect.setFloat("_NoiseSpeed", params.NoiseSpeed);
    effect.setFloat("_Time", params.Time);
  };

  addGUI(); // for test

  function addGUI () {
    gui.add(params, "Width", 0, 2.0, 0.01);
    gui.add(params, "Core", 0, 2.0);
    gui.add(params, "NoiseScale", 1.0, 50.0);
    gui.add(params, "NoiseSpeed", 0.1, 5.0);
    gui.add(params, "Time", 0, 10.0, 0.01);
    gui.add(params, "FadeOut");
    gui.add(params, "FadeIn");
  }
};
