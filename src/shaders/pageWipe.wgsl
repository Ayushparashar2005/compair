import { simplex2d } from "@vgpu/wgsl-std/noise/simplex";

struct Params { progress: f32, resolution: vec2f }
@group(0) @binding(0) var<uniform> params: Params;

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
    // progress is 0.0 to 1.0 (or -0.5 to 1.5 to make sure it fully clears)
    // we want a wipe that goes from left to right, but with a noisy edge
    
    let aspect = params.resolution.x / params.resolution.y;
    let st = uv * vec2f(aspect, 1.0);
    
    // Noise to distort the wipe edge
    let n = simplex2d(st * 4.0);
    
    // Wipe threshold based on x coordinate and progress
    // progress goes from -0.5 to 1.5 to ensure full sweep
    let threshold = (params.progress * 2.0 - 0.5); 
    let edge = uv.x - threshold + n * 0.15;
    
    // Anti-aliased edge
    let mask = smoothstep(0.01, -0.01, edge);
    
    // The wipe color is brand orange #FF8A00
    let wipeColor = vec3f(1.0, 0.54, 0.0);
    
    // Add some noise texture to the wipe itself
    let texNoise = simplex2d(st * 20.0) * 0.05;
    let finalColor = wipeColor - vec3f(texNoise);
    
    return vec4f(finalColor * mask, mask);
}
