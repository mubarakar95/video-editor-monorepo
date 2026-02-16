struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
  @location(1) local_pos: vec2f,
}

struct ClipUniforms {
  transform: mat4x4f,
  color: vec4f,
  size: vec2f,
  corner_radius: f32,
  _padding: f32,
}

@group(0) @binding(0) var<uniform> uniforms: ClipUniforms;

@vertex
fn vs_main(
  @location(0) position: vec2f,
  @location(1) uv: vec2f
) -> VertexOutput {
  var output: VertexOutput;
  output.position = uniforms.transform * vec4f(position, 0.0, 1.0);
  output.uv = uv;
  output.local_pos = position;
  return output;
}

fn rounded_rect_sdf(pos: vec2f, size: vec2f, radius: f32) -> f32 {
  let half_size = size * 0.5;
  let q = abs(pos - half_size) - half_size + vec2f(radius);
  return length(max(q, vec2f(0.0))) + min(max(q.x, q.y), 0.0) - radius;
}

@fragment
fn fs_main(
  @location(0) uv: vec2f,
  @location(1) local_pos: vec2f
) -> @location(0) vec4f {
  let sdf = rounded_rect_sdf(local_pos, uniforms.size, uniforms.corner_radius);
  let alpha = 1.0 - smoothstep(-1.0, 1.0, sdf);
  return vec4f(uniforms.color.rgb, uniforms.color.a * alpha);
}
