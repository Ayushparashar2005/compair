import { fbmSimplex2d } from "@vgpu/wgsl-std/noise/simplex";
import { voronoi2d } from "@vgpu/wgsl-std/noise";

struct Params { time: f32, resolution: vec2f }
@group(0) @binding(0) var<uniform> params: Params;

// Random noise function
fn hash(p: vec2f) -> f32 {
    let q = vec2f(dot(p, vec2f(127.1, 311.7)), dot(p, vec2f(269.5, 183.3)));
    return fract(sin(q.x) * 43758.5453);
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
    // Base light mode color: #fafafa
    var color = vec3f(0.98, 0.98, 0.98);

    let aspect = params.resolution.x / params.resolution.y;
    let st = uv * vec2f(aspect, 1.0);

    // fBM noise field (organic texture, like film grain but mathematical)
    // Scale domain for simplex: simplex is higher frequency than perlin
    let noiseVal = fbmSimplex2d(st * 15.0 + vec2f(params.time * 0.05, -params.time * 0.02), 4, 2.0, 0.5);
    
    // Remap noise from ~[-1, 1] to [0, 1] and scale for subtlety
    let grain = (noiseVal * 0.5 + 0.5) * 0.04;
    color = color - vec3f(grain * 0.5);

    // Voronoi cells to create a brutalist but organic grid structure
    let vScale = 3.0;
    let vSample = voronoi2d(st * vScale + vec2f(params.time * 0.1));
    
    // vSample is a VoronoiSample2: { f1, f2, cell }
    
    // Let's use cell ID to create subtle blocks
    let cellHash = hash(vec2f(f32(vSample.cell.x), f32(vSample.cell.y)));
    if (cellHash > 0.8) {
        color = color - vec3f(0.015);
    }

    // Static fine grain noise
    let fineNoise = hash(st * 500.0 + params.time) * 0.03;
    color = color - vec3f(fineNoise * 0.5);
    
    // A sweeping scanline accent (brand orange #FF8A00)
    let sweep = fract(params.time * 0.15 + st.y * 2.0);
    if (sweep > 0.99) {
        color = mix(color, vec3f(1.0, 0.54, 0.0), 0.15); // subtle orange line
    }

    return vec4f(color, 1.0);
}
