struct TimelineUniforms {
  resolution: vec2f,
  scroll_offset: vec2f,
  zoom: f32,
  track_height: f32,
  grid_spacing: f32,
  num_tracks: f32,
}

@group(0) @binding(0) var<uniform> uniforms: TimelineUniforms;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
}

@vertex
fn vs_main(@builtin(vertex_index) vertex_index: u32) -> VertexOutput {
  var positions = array<vec2f, 6>(
    vec2f(-1.0, -1.0),
    vec2f(1.0, -1.0),
    vec2f(-1.0, 1.0),
    vec2f(1.0, -1.0),
    vec2f(1.0, 1.0),
    vec2f(-1.0, 1.0)
  );
  
  var output: VertexOutput;
  output.position = vec4f(positions[vertex_index], 0.0, 1.0);
  output.uv = (positions[vertex_index] + 1.0) * 0.5;
  return output;
}

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let pos = uv * uniforms.resolution + uniforms.scroll_offset;
  
  let grid_x = pos.x / (uniforms.grid_spacing * uniforms.zoom);
  let grid_y = pos.y / uniforms.track_height;
  
  let grid_line_x = abs(fract(grid_x) - 0.5) * 2.0;
  let grid_line_y = abs(fract(grid_y) - 0.5) * 2.0;
  
  let line_thickness = 1.0 / uniforms.resolution.y;
  
  let x_grid = 1.0 - smoothstep(0.98, 1.0, grid_line_x);
  let y_grid = 1.0 - smoothstep(0.98, 1.0, grid_line_y);
  
  let bg_color = vec3f(0.1, 0.1, 0.12);
  let grid_color = vec3f(0.2, 0.2, 0.22);
  let track_line_color = vec3f(0.25, 0.25, 0.28);
  
  var color = bg_color;
  color = mix(color, grid_color, x_grid * 0.5);
  color = mix(color, track_line_color, y_grid * 0.8);
  
  return vec4f(color, 1.0);
}
