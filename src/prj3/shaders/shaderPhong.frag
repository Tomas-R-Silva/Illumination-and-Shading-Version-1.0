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

uniform int u_n_lights; // Effective number of lights used
// uniform mat4 u_mView; para passar para as coordenadas corretas

uniform LightInfo u_lights[MAX_LIGHTS]; // The array of lights present in the scene
uniform MaterialInfo u_material;        // The material of the object being drawn

uniform bool u_use_normals;
in vec3 v_normal; // ja vem em coordenadas da camara do vertex
in vec3 v_position; // ja vem em coordenadas da camara do vertex

out vec4 color;
uniform vec3 u_color;

void main() {

    vec3 ambient = vec3(0.0);
    vec3 diffuse = vec3(0.0);
    vec3 specular = vec3(0.0); 
    
    for(int i = 0; i < 3; i++){
        if(u_lights[i].on == 0){
            continue;
        }
    // posC //
    vec3 posC = v_position;

    // L //
    vec3 L;
    float attenuation = 1.0;
    if(u_lights[i].lightPosition.w == 0.0){
        L = normalize(u_lights[i].lightPosition.xyz); //direcional
    }
    else {  
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
    vec3 V = normalize(-posC); // equivalente ao C na imagem do telemovel

    // N //
    vec3 N = normalize(v_normal.xyz);

    // R //
    vec3 R = reflect(-L,N);
    
    // LUZ AMBIENTE //
    ambient += u_lights[i].ia*u_material.ka;
    
    // RELFLEXÃO DIFUSA //
    float diffuseFactor = max(dot(L,N), 0.0);
    diffuse += attenuation * u_lights[i].id*u_material.kd*diffuseFactor;

    // REFLEXÃO ESPECULAR //
    float specularFactor = pow(max(dot(R,V), 0.0), u_material.shinness);
    specular += attenuation* u_lights[i].is*u_material.ks*specularFactor;
    
    // NÃO EXISTE REFLEXÃO ESPECULAR SE O FRAGMENTO NÃO RECEBE LUZ //
    if( dot(L,N) < 0.0 ) {
        specular += vec3(0.0, 0.0, 0.0);
    };

    // //
    if(u_use_normals)
        posC = 0.5f * (v_normal + vec3(1.0f, 1.0f, 1.0f));
    
    // FORMAÇÃO DA COR //   
    }
    color = vec4(u_color*(ambient + diffuse + specular), 1.0);
}
