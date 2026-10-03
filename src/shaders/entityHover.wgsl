import { simplex2d } from "@vgpu/wgsl-std/noise/simplex";

struct Params { time: f32, resolution: vec2f, isHovered: f32 }
@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var contentSampler: sampler;
@group(0) @binding(2) var contentTexture: texture_2d<f32>;

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
    // If not hovered, render normally (we shouldn't run this shader when not hovered, but just in case)
    if (params.isHovered < 0.5) {
        return vec4f(0.0);
    }
    
    // Create a time-based distortion sweep
    // Sweep from left to right over time
    let sweepTime = (params.time % 2.0); // cycles every 2 seconds roughly
    
    // Noise value to distort UVs
    let noiseScale = 12.0;
    let n = simplex2d(uv * noiseScale + vec2f(params.time * 2.0, 0.0));
    
    // Pixelation effect based on noise
    let pixelSize = 0.05 * (n * 0.5 + 0.5); // Random block sizes
    
    // Calculate pixelated UV
    var distUv = uv;
    if (pixelSize > 0.01) {
        distUv = floor(uv / pixelSize) * pixelSize;
    }
    
    // Only distort in a specific moving window (a wave)
    let distToWave = abs(uv.x - sweepTime);
    
    if (distToWave < 0.2) {
        // We are in the wave, add a glitch color offset
        // We can't sample the DOM, but we can draw a cool brutalist pattern over it!
        // The background of the card is #ffffff (if we want to obscure it)
        // Let's return a static noise/glitch block that overlays the card
        let glitchIntensity = smoothstep(0.2, 0.0, distToWave);
        if (n > 0.3) {
           let alpha = 0.8 * glitchIntensity;
           return vec4f(1.0 * alpha, 0.54 * alpha, 0.0, alpha); // Brand orange overlay glitch
        }
        if (n < -0.3) {
           let alpha = 0.9 * glitchIntensity;
           return vec4f(0.0, 0.0, 0.0, alpha); // Black glitch
        }
    }
    
    return vec4f(0.0); // transparent otherwise
}
