struct PlayheadUniforms {
  position: f32,
  height: f32,
  screen_width: f32,
  _padding: f32,
}

@group(0) @binding(0) var<uniform> uniforms: PlayheadUniforms;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) x_pos: f32,
}

@vertex
fn vs_main(@builtin(vertex_index) vertex_index: u32) -> VertexOutput {
  let x = uniforms.position;
  let y_top = 0.0;
  let y_bottom = uniforms.height;
  
  var positions = array<vec2f, 6>(
    vec2f(x - 1.0, y_top),
    vec2f(x + 1.0, y_top),
    vec2f(x - 1.0, y_bottom),
    vec2f(x + 1.0, y_top),
    vec2f(x + 1.0, y_bottom),
    vec2f(x - 1.0, y_bottom)
  );
  
  var output: VertexOutput;
  let pos = positions[vertex_index];
  output.position = vec4f(
    (pos.x / uniforms.screen_width) * 2.0 - 1.0,
    1.0 - (pos.y / uniforms.height) * 2.0,
    0.0,
    1.0
  );
  output.x_pos = pos.x;
  return output;
}

@fragment
fn fs_main(@location(0) x_pos: f32) -> @location(0) vec4f {
  let dx = abs(x_pos - uniforms.position);
  let alpha = 1.0 - smoothstep(0.0, 1.0, dx);
  return vec4f(1.0, 0.2, 0.2, alpha);
}
