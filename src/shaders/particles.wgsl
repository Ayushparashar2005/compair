import { hashU32 } from "@vgpu/wgsl-std/hash";

struct Params { 
    time: f32, 
    resolution: vec2f, 
    origin: vec2f,
    isCorrect: f32
}
@group(0) @binding(0) var<uniform> params: Params;

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
}

// Simple hash for float
fn rand(seed: u32) -> f32 {
    let h = hashU32(seed);
    // Convert to float 0..1
    return f32(h) / 4294967295.0;
}

@vertex fn vs_main(@builtin(vertex_index) vIdx: u32) -> VertexOutput {
    let particleIdx = vIdx / 6u; // 6 vertices per particle (quad)
    let localIdx = vIdx % 6u;
    
    // Pseudo-random properties based on particle index
    let r1 = rand(particleIdx * 3u);
    let r2 = rand(particleIdx * 3u + 1u);
    let r3 = rand(particleIdx * 3u + 2u);
    
    // Angle and speed
    let angle = r1 * 6.28318;
    // Speed peaks around origin
    let speed = (r2 * 800.0 + 200.0) * max(0.0, 1.0 - params.time * 1.2);
    
    // Initial position is origin
    // Physics: pos = origin + velocity * time
    let velocity = vec2f(cos(angle), sin(angle)) * speed;
    
    // Adding gravity (Y is down in screen space)
    let gravity = vec2f(0.0, 800.0);
    
    var pos = params.origin + velocity * params.time + 0.5 * gravity * params.time * params.time;
    
    // Particle size
    let size = (r3 * 10.0 + 4.0) * max(0.0, 1.0 - params.time); // shrink over time
    
    // Quad local positions
    var localPos = vec2f(0.0);
    if (localIdx == 0u) { localPos = vec2f(-0.5, -0.5); }
    if (localIdx == 1u) { localPos = vec2f( 0.5, -0.5); }
    if (localIdx == 2u) { localPos = vec2f(-0.5,  0.5); }
    if (localIdx == 3u) { localPos = vec2f( 0.5, -0.5); }
    if (localIdx == 4u) { localPos = vec2f( 0.5,  0.5); }
    if (localIdx == 5u) { localPos = vec2f(-0.5,  0.5); }
    
    // Screen space to NDC
    let screenPos = pos + localPos * size;
    let ndcPos = vec2f(
        (screenPos.x / params.resolution.x) * 2.0 - 1.0,
        1.0 - (screenPos.y / params.resolution.y) * 2.0
    );
    
    var out: VertexOutput;
    out.position = vec4f(ndcPos, 0.0, 1.0);
    
    // Colors
    let alpha = max(0.0, 1.0 - params.time * 1.5); // fade out over 0.66s
    if (params.isCorrect > 0.5) {
        // Correct color: Brand orange or green
        out.color = vec4f(1.0 * alpha, 0.54 * alpha, 0.0, alpha); // #FF8A00
    } else {
        // Wrong color: Red/black
        out.color = vec4f(0.1 * alpha, 0.1 * alpha, 0.1 * alpha, alpha); // Black/dark grey
    }
    
    return out;
}

@fragment fn fs_main(in: VertexOutput) -> @location(0) vec4f {
    return in.color;
}
