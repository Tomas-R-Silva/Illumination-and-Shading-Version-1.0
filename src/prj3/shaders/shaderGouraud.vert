#version 300 es

precision mediump float;

const int MAX_LIGHTS = 8;

struct LightInfo {
    int on;
    int spotlight;
    vec4 lightPosition;
    vec3 ia;
    vec3 id;
    vec3 is;
    vec3 axis;
    int aperture;
    float cutoff;
    //int angleSpotlight;
};

struct MaterialInfo {
    vec3 ka;
    vec3 kd;
    vec3 ks;
    float shinness; // valor alto => brilho metalico, valor baixo => textura bassa
};

uniform int u_n_lights;

uniform LightInfo u_lights[MAX_LIGHTS]; // The array of lights present in the scene
uniform MaterialInfo u_material; 

uniform mat4 u_model_view;
uniform mat4 u_projection;
uniform mat4 u_normals;

uniform bool u_use_normals;

in vec4 a_position;
in vec3 a_normal;

out vec4 v_color;


void main() {
    gl_Position = u_projection * u_model_view * a_position;

    vec3 ambient = vec3(0.0);
    vec3 diffuse = vec3(0.0);
    vec3 specular = vec3(0.0); 
    
    for(int i = 0; i < 3; i++){
        if(u_lights[i].on == 0){
            continue;
        }

    // posC //
    vec3 posC = (u_model_view * a_position).xyz;

    // L //
    vec3 L;
    float attenuation = 1.0;
    if(u_lights[i].lightPosition.w == 0.0)
        L = normalize(u_lights[i].lightPosition.xyz); //directional
    else{
        L = normalize(u_lights[i].lightPosition.xyz - posC); //pontual

        if(u_lights[i].spotlight == 1){ //spotlight
            vec3 axis = normalize(u_lights[i].axis);
            float angle = dot(-L, axis);

            float cone_limit = cos(radians(float(u_lights[i].aperture)));

            if(angle < cone_limit){
                attenuation = 0.0;
            } else{
                attenuation = pow(angle,u_lights[i].cutoff); 
            }
        }

    }

    // V //
    vec3 V = normalize(-posC);

    // H //
    vec3 H = normalize(L+V);

    // N //
    vec3 N = normalize((u_normals * vec4(a_normal,0.0f)).xyz);

    // LUZ AMBIENTE //
    ambient += u_lights[i].ia*u_material.ka;

    // RELFLEXÃO DIFUSA //
    float diffuseFactor = max(dot(L,N), 0.0);
    diffuse += u_lights[i].id*u_material.kd*diffuseFactor;

    // REFLEXÃO ESPECULAR //
    float specularFactor = pow(max(dot(N,H), 0.0), u_material.shinness);
    specular += u_lights[i].is*u_material.ks*specularFactor;
    
    // NÃO EXISTE REFLEXÃO ESPECULAR SE O FRAGMENTO NÃO RECEBE LUZ //
    if( dot(L,N) < 0.0 ) {
        specular += vec3(0.0, 0.0, 0.0);
    };

    }
    // FORMAÇÃO DA COR //
    v_color = vec4(ambient + diffuse + specular, 0.0f);
    
}