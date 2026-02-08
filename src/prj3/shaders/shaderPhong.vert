#version 300 es

in vec4 a_position; //enviado pelo obj.draw (está nas funções draw das bibliotecas .js dos objetos)
in vec3 a_normal;

uniform mat4 u_projection;
uniform mat4 u_model_view;
uniform mat4 u_normals;

out vec3 v_normal;
out vec3 v_position;

void main() {
    gl_Position = u_projection * u_model_view * a_position;
    v_normal = (u_normals * vec4(a_normal, 0.0f)).xyz;
    v_position = (u_model_view * a_position).xyz;
}
        