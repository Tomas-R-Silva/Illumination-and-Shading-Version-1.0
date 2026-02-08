import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from '../libs/utils.js';
import { length, flatten, inverse, mult, normalMatrix, perspective, lookAt, vec4, vec3, vec2, subtract, add, scale, rotate, normalize } from '../libs/MV.js';
import { modelView, loadMatrix, multRotationY, multScale, pushMatrix, popMatrix, multTranslation, multRotationZ, multRotationX } from "../libs/stack.js";

import * as dat from '../libs/dat.gui.module.js';

import * as CUBE from '../libs/objects/cube.js';
import * as SPHERE from '../libs/objects/sphere.js';
import * as COW from '../libs/objects/cow.js';
import * as BUNNY from '../libs/objects/bunny.js';
import * as TORUS from '../libs/objects/torus.js';

import * as STACK from '../libs/stack.js';

const PINK = vec3(1.0,.0,1.0);
const BLUE = vec3(.0,.0,1.0);
const RED = vec3(1.0,.0,.0);
const GREEN = vec3(0.,1.0,.0);
const YELLOW = vec3(1.0,.75,.0);


function setup(shaders) {
    const canvas = document.getElementById('gl-canvas');
    const gl = setupWebGL(canvas);

    CUBE.init(gl);
    SPHERE.init(gl);
    BUNNY.init(gl);
    COW.init(gl);
    TORUS.init(gl);

    const programG = buildProgramFromSources(gl, shaders['shaderGouraud.vert'], shaders['shaderGouraud.frag']);
    const programP = buildProgramFromSources(gl, shaders['shaderPhong.vert'], shaders['shaderPhong.frag']);
    let program = programP;

    // Camera  
    let camera = {
        eye: vec3(0, 0, 15),
        at: vec3(0, 0, 0),
        up: vec3(0, 1, 0),
        fovy: 45,
        aspect: 1, // Updated further down
        near: 0.1,
        far: 20
    }

    let options = {
        wireframe: false,
        normals: true,
        backface_culling: true,
        depth_test: true,
        gouraud: false,
        phong: true
    }

    let light1 = {
        on: 1,
        referencial: 1,
        directional: false,
        spotlight: 0,
        position: vec4(0,0,0,1), // x, y, z, w = se é pontoal ou direcional, pode ser um boolean
        ia: [50,50,50],
        id:[60,60,60],
        is:[200,200,200],
        axis: vec3(0,0,-1),
        aperture: 10, // angulo da luz, maior angulo, maior diametro do circulo
        cutoff: 10,
        //angleSpotlight: 0 // dar valor zero ao início
    }

    let light2 = {
        on: 0,
        referencial: 1,
        directional: false,
        spotlight: 0,
        position: vec4(0,0,0,1), // x, y, z, w = se é pontoal ou direcional, pode ser um boolean
        ia: [50,50,50],
        id:[60,60,60],
        is:[200,200,200],
        axis: vec3(0,0,-1),
        aperture: 10, // angulo da luz, maior angulo, maior diametro do circulo
        cutoff: 10,
        //angleSpotlight: 0
    }

    let light3 = {
        on: 0,
        referencial: 1,
        directional: false,
        spotlight: 0,
        position: vec4(0,0,0,1), // x, y, z, w = se é pontoal ou direcional, pode ser um boolean
        ia: [50,50,50],
        id:[60,60,60],
        is:[200,200,200],
        axis: vec3(0,0,-1),
        aperture: 10, // angulo da luz, maior angulo, maior diametro do circulo
        cutoff: 10,
        //angleSpotlight: 0
    }

    let material = {
        ka: [150,150,150],
        kd: [150,150,150],
        ks: [200,200,200],
        shinness: 100
    }

    let materials = {
    bunny:  material, // fica o único a usar o gui
    cow:    { ka:[85,85,85],   kd:[250,150,150], ks:[50,50,50],     shinness:20 },
    torus:  { ka:[100,50,150],  kd:[150,100,200], ks:[150,200,200],  shinness:80 },
    sphere: { ka:[140,150,50], kd:[200,200,100], ks:[100,100,0],    shinness:10 },
    base:   { ka:[50,150,50],  kd:[10,210,100], ks:[10,50,50],     shinness:5 }
};

    // GUI //

    const gui = new dat.GUI();

    const optionsGui = gui.addFolder("options");
    optionsGui.add(options, "wireframe").name("Wireframe");
    optionsGui.add(options, "normals").name("Normals");
    optionsGui.add(options, "backface_culling").name("Backface Culling").onChange(function(v){
        if(v){
            gl.enable(gl.CULL_FACE);
        }else{
            gl.disable(gl.CULL_FACE);
        }
    });
    optionsGui.add(options, "depth_test").name("Depht Test").onChange(function(v){
        if(v){
            gl.enable(gl.DEPTH_TEST);
        }else{
            gl.disable(gl.DEPTH_TEST);
        }
    });
    optionsGui.add(options, "gouraud").listen().name("Gouraud").onChange(function(v){
        options.phong = !options.gouraud;
        optionsGui.updateDisplay();
        program = programG;
    });
    optionsGui.add(options, "phong").listen().name("Phong").onChange(function(v){
        options.gouraud = !options.phong;
        optionsGui.updateDisplay();
        program = programP;
    });

    // CAMERA GUI //

    const cameraGui = gui.addFolder("camera");

    cameraGui.add(camera, "fovy").min(1).max(179).step(1).listen();
    cameraGui.add(camera, "aspect").min(0).max(10).step(0.01).listen().domElement.style.pointerEvents = "none";

    cameraGui.add(camera, "near").min(0.1).max(20).step(0.01).listen().onChange(function (v) {
        camera.near = Math.min(camera.far - 0.5, v);
    });

    cameraGui.add(camera, "far").min(0.1).max(20).step(0.01).listen().onChange(function (v) {
        camera.far = Math.max(camera.near + 0.5, v);
    });

    const eye = cameraGui.addFolder("eye");
    eye.add(camera.eye, 0).step(0.05).listen().domElement.style.pointerEvents = "none";;
    eye.add(camera.eye, 1).step(0.05).listen().domElement.style.pointerEvents = "none";;
    eye.add(camera.eye, 2).step(0.05).listen().domElement.style.pointerEvents = "none";;

    const at = cameraGui.addFolder("at");
    at.add(camera.at, 0).step(0.05).listen().domElement.style.pointerEvents = "none";;
    at.add(camera.at, 1).step(0.05).listen().domElement.style.pointerEvents = "none";;
    at.add(camera.at, 2).step(0.05).listen().domElement.style.pointerEvents = "none";;

    const up = cameraGui.addFolder("up");
    up.add(camera.up, 0).step(0.05).listen().domElement.style.pointerEvents = "none";;
    up.add(camera.up, 1).step(0.05).listen().domElement.style.pointerEvents = "none";;
    up.add(camera.up, 2).step(0.05).listen().domElement.style.pointerEvents = "none";;

    // LIGHTS GUI //

    const lightsGui = gui.addFolder("Lights");

    // lights 1 GUI //

    const light1gui = lightsGui.addFolder("Light 1");
    light1gui.add(light1,"on").name("Turn On");
    light1gui.add(light1,"referencial").name("Camera Referencial");
    light1gui.add(light1,"directional").name("Directional").onChange(function(v){
        if(v){
            light1.position[3]=0;
        }else{
            light1.position[3]=1;
        }
    });
    light1gui.add(light1,"spotlight").name("Spotlight");
    const position1 = light1gui.addFolder("Position");
    position1.add(light1.position,0).step(1).listen().name("X");
    position1.add(light1.position,1).step(1).listen().name("Y");
    position1.add(light1.position,2).step(1).listen().name("Z");
    position1.add(light1.position,3).step(1).listen().name("W");
    const intensities1 = light1gui.addFolder("Intensities");
    intensities1.addColor(light1,'ia').listen().name("Ambient").onChange(function([r,g,b]) {
        light1.ia[0] = r;
        light1.ia[1] = g;
        light1.ia[2] = b;
    });
    intensities1.addColor(light1,'id').listen().name("Difuse").onChange(function([r,g,b]) {
        light1.id[0] = r;
        light1.id[1] = g;
        light1.id[2] = b;
    });
    intensities1.addColor(light1,'is').listen().name("Specular").onChange(function([r,g,b]) {
        light1.is[0] = r;
        light1.is[1] = g;
        light1.is[2] = b;
    });
    const axis1 = light1gui.addFolder("Axis");
    axis1.add(light1.axis,0).step(1).listen().name("X");
    axis1.add(light1.axis,1).step(1).listen().name("Y");
    axis1.add(light1.axis,2).step(1).listen().name("Z");
    light1gui.add(light1,'aperture').min(1).max(100).step(1).listen().name("Aperture");
    light1gui.add(light1,'cutoff').min(1).max(100).step(1).listen().name("Cutoff");

    // lights 2 GUI //

    const light2gui = lightsGui.addFolder("Light 2");
    light2gui.add(light2,"on").name("Turn On");
    light2gui.add(light2,"referencial").name("Camera Referencial");
    light2gui.add(light2,"directional").name("Directional").onChange(function(v){
        if(v){
            light2.position[3]=0;
        }else{
            light2.position[3]=1;
        }
    });
    light2gui.add(light2,"spotlight").name("Spotlight");
    const position2 = light2gui.addFolder("Position");
    position2.add(light2.position,0).step(1).listen().name("X");
    position2.add(light2.position,1).step(1).listen().name("Y");
    position2.add(light2.position,2).step(1).listen().name("Z");
    position2.add(light2.position,3).step(1).listen().name("W");
    const intensities2 = light2gui.addFolder("Intensities");
    intensities2.addColor(light2,'ia').listen().name("Ambient").onChange(function([r,g,b]) {
        light2.ia[0] = r;
        light2.ia[1] = g;
        light2.ia[2] = b;
    });
    intensities2.addColor(light2,'id').listen().name("Difuse").onChange(function([r,g,b]) {
        light2.id[0] = r;
        light2.id[1] = g;
        light2.id[2] = b;
    });
    intensities2.addColor(light2,'is').listen().name("Specular").onChange(function([r,g,b]) {
        light2.is[0] = r;
        light2.is[1] = g;
        light2.is[2] = b;
    });
    const axis2 = light2gui.addFolder("Axis");
    axis2.add(light2.axis,0).step(1).listen().name("X");
    axis2.add(light2.axis,1).step(1).listen().name("Y");
    axis2.add(light2.axis,2).step(1).listen().name("Z");
    light2gui.add(light2,'aperture').min(1).max(100).step(1).listen().name("Aperture");
    light2gui.add(light2,'cutoff').min(1).max(100).step(1).listen().name("Cutoff");

    // lights 3 GUI //

    const light3gui = lightsGui.addFolder("Light 3");
    light3gui.add(light3,"on").name("Turn On");
    light3gui.add(light3,"referencial").name("Camera Referencial");
    light3gui.add(light3,"directional").name("Directional").onChange(function(v){
        if(v){
            light3.position[3]=0;
        }else{
            light3.position[3]=1;
        }
    });
    light3gui.add(light3,"spotlight").name("Spotlight");
    const position3 = light3gui.addFolder("Position");
    position3.add(light3.position,0).step(1).listen().name("X");
    position3.add(light3.position,1).step(1).listen().name("Y");
    position3.add(light3.position,2).step(1).listen().name("Z");
    position3.add(light3.position,3).step(1).listen().name("W");
    const intensities3 = light3gui.addFolder("Intensities");
    intensities3.addColor(light3,'ia').listen().name("Ambient").onChange(function([r,g,b]) {
        light3.ia[0] = r;
        light3.ia[1] = g;
        light3.ia[2] = b;
    });
    intensities3.addColor(light3,'id').listen().name("Difuse").onChange(function([r,g,b]) {
        light3.id[0] = r;
        light3.id[1] = g;
        light3.id[2] = b;
    });
    intensities3.addColor(light3,'is').listen().name("Specular").onChange(function([r,g,b]) {
        light3.is[0] = r;
        light3.is[1] = g;
        light3.is[2] = b;
    });
    const axis3 = light3gui.addFolder("Axis");
    axis3.add(light3.axis,0).step(1).listen().name("X");
    axis3.add(light3.axis,1).step(1).listen().name("Y");
    axis3.add(light3.axis,2).step(1).listen().name("Z");
    light3gui.add(light3,'aperture').min(1).max(100).step(1).listen().name("Aperture");
    light3gui.add(light3,'cutoff').min(1).max(100).step(1).listen().name("Cutoff");

    // MATERIAL GUI //

    const materialGui = gui.addFolder("Material");
    materialGui.addColor(material,"ka").listen().name("Ka").onChange(function([r,g,b]) {
        material.ka[0] = r;
        material.ka[1] = g;
        material.ka[2] = b;
    });
    materialGui.addColor(material,"kd").listen().name("Kd").onChange(function([r,g,b]) {
        material.kd[0] = r;
        material.kd[1] = g;
        material.kd[2] = b;
    });
    materialGui.addColor(material,"ks").listen().name("Ks").onChange(function([r,g,b]) {
        material.ks[0] = r;
        material.ks[1] = g;
        material.ks[2] = b;
    });
    materialGui.add(material, "shinness").min(0).step(1).name("Shinness").onChange(function(v){
        material.shinness = v;
    })

    // matrices
    let mView, mProjection;

    let down = false;
    let lastX, lastY;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    resizeCanvasToFullWindow();

    window.addEventListener('resize', resizeCanvasToFullWindow);

    window.addEventListener('wheel', function (event) {


        if (!event.altKey && !event.metaKey && !event.ctrlKey) { // Change fovy
            const factor = 1 - event.deltaY / 1000;
            camera.fovy = Math.max(1, Math.min(100, camera.fovy * factor));
        }
        else if (event.metaKey || event.ctrlKey) {
            // move camera forward and backwards (shift)

            const offset = event.deltaY / 1000;

            const dir = normalize(subtract(camera.at, camera.eye));

            const ce = add(camera.eye, scale(offset, dir));
            const ca = add(camera.at, scale(offset, dir));

            // Can't replace the objects that are being listened by dat.gui, only their properties.
            camera.eye[0] = ce[0];
            camera.eye[1] = ce[1];
            camera.eye[2] = ce[2];

            if (event.ctrlKey) {
                camera.at[0] = ca[0];
                camera.at[1] = ca[1];
                camera.at[2] = ca[2];
            }
        }
    });

    function inCameraSpace(m) {
        const mInvView = inverse(mView);

        return mult(mInvView, mult(m, mView));
    }

    function uploadModelView() {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_normals"), false, flatten(normalMatrix(STACK.modelView())));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_model_view"), false, flatten(modelView()));
    }

    function drawObj(obj, color){
        const u_color = gl.getUniformLocation(program,"u_color");
        gl.uniform3fv(u_color,color);
        uploadModelView();
        obj.draw(gl,program,gl.TRIANGLES);
    }

    function createBase(){
        pushMatrix();
        multScale([10,0.5,10]);
        multTranslation([0,-0.5,0]);
        drawObj(CUBE,GREEN);
        popMatrix();
    }

    function createBunny(){
        pushMatrix();
        multTranslation([2.5,0.0,2.5]);
        multScale([2,2,2]);
        multTranslation([0,0.5,0]);
        uploadMaterial(materials.bunny);
        drawObj(BUNNY,PINK);
        popMatrix();
    }

    function createCow(){
        pushMatrix();
        multTranslation([-2.5,0.0,2.5]);
        multScale([2,2,2]);
        multTranslation([0,0.5,0]);
        uploadMaterial(materials.cow);
        drawObj(COW,YELLOW);
        popMatrix();
    }

    function createTorus(){
        pushMatrix();
        multTranslation([2.5,0.0,-2.5]);
        multScale([2,2,2]);
        multTranslation([0,0.2,0]);
        uploadMaterial(materials.torus);
        drawObj(TORUS,BLUE);
        popMatrix();
    }

    function createSphere(){
        pushMatrix();
        multTranslation([-2.5,0.0,-2.5]);
        multScale([2,2,2]);
        multTranslation([0,0.5,0]);
        uploadMaterial(materials.sphere);
        drawObj(SPHERE,RED);
        popMatrix();
    }

    canvas.addEventListener('mousemove', function (event) {
        if (down) {
            const dx = event.offsetX - lastX;
            const dy = event.offsetY - lastY;

            if (dx != 0 || dy != 0) {
                // Do something here...

                const d = vec2(dx, dy);
                const axis = vec3(-dy, -dx, 0);

                const rotation = rotate(0.5 * length(d), axis);

                let eyeAt = subtract(camera.eye, camera.at);
                eyeAt = vec4(eyeAt[0], eyeAt[1], eyeAt[2], 0);
                let newUp = vec4(camera.up[0], camera.up[1], camera.up[2], 0);

                eyeAt = mult(inCameraSpace(rotation), eyeAt);
                newUp = mult(inCameraSpace(rotation), newUp);

                console.log(eyeAt, newUp);

                camera.eye[0] = camera.at[0] + eyeAt[0];
                camera.eye[1] = camera.at[1] + eyeAt[1];
                camera.eye[2] = camera.at[2] + eyeAt[2];

                camera.up[0] = newUp[0];
                camera.up[1] = newUp[1];
                camera.up[2] = newUp[2];

                lastX = event.offsetX;
                lastY = event.offsetY;
            }

        }
    });

    canvas.addEventListener('mousedown', function (event) {
        down = true;
        lastX = event.offsetX;
        lastY = event.offsetY;
        gl.clearColor(0.2, 0.0, 0.0, 1.0);
    });

    canvas.addEventListener('mouseup', function (event) {
        down = false;
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
    });

    window.requestAnimationFrame(render);

    function resizeCanvasToFullWindow() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        camera.aspect = canvas.width / canvas.height;

        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function uploadMaterial (material){
        gl.uniform3f(gl.getUniformLocation(program, "u_material.ka"), material.ka[0]/255, material.ka[1]/255, material.ka[2]/255);
        gl.uniform3f(gl.getUniformLocation(program, "u_material.kd"), material.kd[0]/255, material.kd[1]/255, material.kd[2]/255);
        gl.uniform3f(gl.getUniformLocation(program, "u_material.ks"), material.ks[0]/255, material.ks[1]/255, material.ks[2]/255);
        gl.uniform1f(gl.getUniformLocation(program, "u_material.shinness"), material.shinness);
    }

    function render(time) {
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(program);

        mView = lookAt(camera.eye, camera.at, camera.up);
        STACK.loadMatrix(mView);

        mProjection = perspective(camera.fovy, camera.aspect, camera.near, camera.far);


        gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_model_view"), false, flatten(STACK.modelView()));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_projection"), false, flatten(mProjection));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_normals"), false, flatten(normalMatrix(STACK.modelView())));


        //  PASSAGEM DOS VALORES DAS INTENSIDADES E POSIÇÃO PARA OS SHADERS DA LIGHT1 //
        gl.uniform3f(gl.getUniformLocation(program, "u_lights[0].ia"), light1.ia[0]/255, light1.ia[1]/255, light1.ia[2]/255);
        gl.uniform3f(gl.getUniformLocation(program, "u_lights[0].id"), light1.id[0]/255, light1.id[1]/255, light1.id[2]/255);
        gl.uniform3f(gl.getUniformLocation(program, "u_lights[0].is"), light1.is[0]/255, light1.is[1]/255, light1.is[2]/255);
        gl.uniform4fv(gl.getUniformLocation(program, "u_lights[0].lightPosition"), light1.position);
        gl.uniform1i(gl.getUniformLocation(program, "u_lights[0].on"), light1.on);
        gl.uniform1i(gl.getUniformLocation(program, "u_lights[0].spotlight"), light1.spotlight);
        gl.uniform3fv(gl.getUniformLocation(program, "u_lights[0].axis"), light1.axis);
        gl.uniform1i(gl.getUniformLocation(program, "u_lights[0].aperture"), light1.aperture);
        gl.uniform1f(gl.getUniformLocation(program, "u_lights[0].cutoff"), light1.cutoff);
        //gl.uniform1f(gl.getUniformLocation(program, "u_lights[0].angleSpotlight"), light1.angleSpotlight);

        //  PASSAGEM DOS VALORES DAS INTENSIDADES E POSIÇÃO PARA OS SHADERS DA LIGHT2 //
        gl.uniform3f(gl.getUniformLocation(program, "u_lights[1].ia"), light2.ia[0]/255, light2.ia[1]/255, light2.ia[2]/255);
        gl.uniform3f(gl.getUniformLocation(program, "u_lights[1].id"), light2.id[0]/255, light2.id[1]/255, light2.id[2]/255);
        gl.uniform3f(gl.getUniformLocation(program, "u_lights[1].is"), light2.is[0]/255, light2.is[1]/255, light2.is[2]/255);
        gl.uniform4fv(gl.getUniformLocation(program, "u_lights[1].lightPosition"), light2.position);
        gl.uniform1i(gl.getUniformLocation(program, "u_lights[1].on"), light2.on);
        gl.uniform1i(gl.getUniformLocation(program, "u_lights[1].spotlight"), light2.spotlight);
        gl.uniform3fv(gl.getUniformLocation(program, "u_lights[1].axis"), light2.axis);
        gl.uniform1i(gl.getUniformLocation(program, "u_lights[1].aperture"), light2.aperture);
        gl.uniform1f(gl.getUniformLocation(program, "u_lights[1].cutoff"), light2.cutoff);
        //gl.uniform1f(gl.getUniformLocation(program, "u_lights[1].angleSpotlight"), light2.angleSpotlight);

        //  PASSAGEM DOS VALORES DAS INTENSIDADES E POSIÇÃO PARA OS SHADERS DA LIGHT3 //
        gl.uniform3f(gl.getUniformLocation(program, "u_lights[2].ia"), light3.ia[0]/255, light3.ia[1]/255, light3.ia[2]/255);
        gl.uniform3f(gl.getUniformLocation(program, "u_lights[2].id"), light3.id[0]/255, light3.id[1]/255, light3.id[2]/255);
        gl.uniform3f(gl.getUniformLocation(program, "u_lights[2].is"), light3.is[0]/255, light3.is[1]/255, light3.is[2]/255);
        gl.uniform4fv(gl.getUniformLocation(program, "u_lights[2].lightPosition"), light3.position);
        gl.uniform1i(gl.getUniformLocation(program, "u_lights[2].on"), light3.on);
        gl.uniform1i(gl.getUniformLocation(program, "u_lights[2].spotlight"), light3.spotlight);
        gl.uniform3fv(gl.getUniformLocation(program, "u_lights[2].axis"), light3.axis);
        gl.uniform1i(gl.getUniformLocation(program, "u_lights[2].aperture"), light3.aperture);
        gl.uniform1f(gl.getUniformLocation(program, "u_lights[2].cutoff"), light3.cutoff);
        //gl.uniform1f(gl.getUniformLocation(program, "u_lights[2].angleSpotlight"), light3.angleSpotlight);


        //  CRIAÇÂO DOS OBJETOS  //
        createBase();
        createBunny();
        createCow();
        createTorus();
        createSphere();
    }
}

const urls = ['shaderPhong.vert', 'shaderPhong.frag', 'shaderGouraud.vert', 'shaderGouraud.frag', 'shaderBase.frag', 'shaderBase.vert'];

loadShadersFromURLS(urls).then(shaders => setup(shaders));