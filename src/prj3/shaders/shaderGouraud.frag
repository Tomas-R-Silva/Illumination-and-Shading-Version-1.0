#version 300 es

precision mediump float;

uniform vec3 u_color;

out vec4 color;
in vec4 v_color;

void main() {
    color = vec4(u_color, 1.0f)*v_color;
}

