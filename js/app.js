"use strict";

var core = {
	"camera" : null,
	"scene" : null,
	"renderer" : null,
	"controls" : null
};

var flakeGeom;
var flakeMaterial;
var flakeShardsMaterial;
var flakeWireMaterial;

var particleTexture;
var frostTexture;

var snow = new THREE.Object3D();

function addPointLight(x, y, z, color) {
	var light = new THREE.PointLight({"color":color});
	light.position.set(x, y, z);
	core.scene.add(light);
	return light;
}

function initializeCore() {
	core.camera   = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 5000);
	core.scene    = new THREE.Scene();
	core.renderer = new THREE.WebGLRenderer({antialias:false});
	
	core.camera.target = new THREE.Vector3();

	document.getElementById("content").appendChild(core.renderer.domElement);
}


function initializeScene() {

	var ambient = new THREE.AmbientLight(0x4a5052);
	core.scene.add(ambient);

	addPointLight(12,19,15, 0xfffbe7);

  flakeMaterial = new THREE.MeshPhongMaterial({
	 	shading:THREE.FlatShading,
	 	shininess:80,
	 	transparent:true,
	 	opacity:0.53,
	 	specular:0xffffff,
	 	color:0x42575d,
	 	depthTest:false,
	 	depthWrite:false,
	 	blending:THREE.AdditiveBlending,
	 	specularMap: frostTexture,
	 	bumpScale:0.1
	});
 

	flakeShardsMaterial = new THREE.MeshPhongMaterial({
	 	shading:THREE.FlatShading,
	 	shininess:80,
	 	transparent:true,
	 	opacity:0.53,
	 	specular:0xffffff,
	 	color:0x42575d,
	 	depthTest:false,
	 	depthWrite:false,
	 	blending:THREE.AdditiveBlending,
	 	wireframe:true
	});
}


var linesGeo = new THREE.Geometry();
var fragments = [];

var rings; 
var tubes;
var shards;

function makeFrond(startPoint, direction, gen, steps) {

	var mat = new THREE.Matrix4();

	var geo = new THREE.Geometry();
	var spawn = new THREE.Vector3();

	spawn.copy(startPoint);

	var scl = 4 / (gen+1);

	var spawnCooldown = 3;
	
	for(var i = 0; i < steps; i++){
		var angle = direction+Math.PI/2;
		
		var stepScale = (steps-i)/steps;
		var xo = Math.cos(angle) * 2 * scl * stepScale;
		var yo = Math.sin(angle) * 2 * scl * stepScale;

		angle = direction-Math.PI/2;
		var xo2 = Math.cos(angle) * 2 * scl * stepScale;
		var yo2 = Math.sin(angle) * 2 * scl * stepScale;
		
		var x = spawn.x + Math.cos(direction) * 6 * stepScale;;
		var y = spawn.y + Math.sin(direction) * 6 * stepScale;;

		geo.vertices.push(
			new THREE.Vector3( spawn.x + xo2, spawn.y + yo2, spawn.z - Math.random()*4 ),
			new THREE.Vector3( x, y, spawn.z ),
			new THREE.Vector3( spawn.x, spawn.y, spawn.z )
		);
		geo.faces.push( new THREE.Face3( i*6, i*6+1, i*6+2 ) );

		geo.vertices.push(
			new THREE.Vector3( spawn.x + xo, spawn.y + yo, spawn.z- Math.random()*4 ),
			new THREE.Vector3( spawn.x, spawn.y, spawn.z ),
			new THREE.Vector3( x, y, spawn.z )
		);
		geo.faces.push( new THREE.Face3( i*6+3, i*6+4, i*6+5 ) );


		spawn.x += Math.cos(direction) * 2 * (scl);
		spawn.y += Math.sin(direction) * 2 * (scl);

		if((Math.random() > 0.6) && (gen < 3) && (spawnCooldown <= 0)) {
			var pt = spawn.clone();
			var nextSteps = Math.random() * 15 + 5 - gen*2;
			makeFrond(pt, direction + Math.PI/3, gen+1, nextSteps);
			makeFrond(pt, direction - Math.PI/3, gen+1, nextSteps);
			spawnCooldown = 5;
		}

		spawnCooldown--;
	}

	geo.computeFaceNormals();
	geo.computeVertexNormals();

	shards.merge(hexagonalize(geo));

	fragments.push(geo);

	var finalRadius = spawn.length();
	var segmentLength = new THREE.Vector3();
	segmentLength.subVectors(spawn, startPoint);
	segmentLength = segmentLength.length();

	var allTubes = new THREE.Geometry();
	var r2 = Math.random()*4+4;
	var tubeGeo = new THREE.CylinderGeometry(r2*0.2, r2, segmentLength, 6, 1, true );

	mat.makeTranslation(0, -segmentLength/2, 0);
	tubeGeo.applyMatrix(mat);
	
	mat.makeScale(1, 1, Math.random() * 0.4 + 0.1);
	tubeGeo.applyMatrix(mat);

	mat.makeRotationZ(direction - Math.PI / 2);
	tubeGeo.applyMatrix(mat);

	mat.makeTranslation(spawn.x, spawn.y, spawn.z);
	tubeGeo.applyMatrix(mat);

	tubes.merge( hexagonalize(tubeGeo) );

	if(gen == 0){
		var innerRadius = startPoint.length();
		var coreRingGeo = new THREE.TorusGeometry( innerRadius, Math.random()*6+4, 6, 1, Math.PI/3 );
			
		var ringScale = Math.random() * 0.1 + 0.05;
		mat.makeScale(1,1,0.2);
		coreRingGeo.applyMatrix(mat);
		var ringObj = new THREE.Mesh(hexagonalize(coreRingGeo), flakeMaterial);
		
		flake.add(ringObj);
	}


	if(Math.random() > 0.75) {

		if(Math.random() > 0.5) {
			
			var ringGeo = new THREE.TorusGeometry( finalRadius, Math.random()*20+4, 6, 1, Math.PI/3 );
			
			var ringScale = Math.random() * 0.1 + 0.05;
			mat.makeScale(1,1,0.2);
			ringGeo.applyMatrix(mat);

			rings.merge( hexagonalize(ringGeo) );
		} else {
			
			var ringGeo = new THREE.TorusGeometry( Math.random()*10+4, Math.random()*6+4, 6, 6);
			mat.makeTranslation(0, finalRadius, 0);
			ringGeo.applyMatrix(mat);
			mat.makeScale(1,1,0.2);
			ringGeo.applyMatrix(mat);
			
			rings.merge( hexagonalize(ringGeo) );
		}
	}

}


function hexagonalize(geometry) {
	var result = new THREE.Geometry();
	var rotationMatrix = new THREE.Matrix4();
	rotationMatrix.makeRotationZ(Math.PI/3);
	
	for(var i = 0; i < 6; i++) {
		result.merge(geometry);
		geometry.applyMatrix(rotationMatrix);
	}
	return result;
}


function resizeViewport(width, height) {
	core.camera.aspect = width / height;
	core.camera.updateProjectionMatrix();
	core.renderer.setSize( width, height );
}

var frameNumber = 0;

function render() {

	frameNumber++;
	var time = new Date().getTime() * 0.000005;
	for(var i = 0; i < snow.children.length; i++){
		snow.children[i].rotation.y = time * ( i < 4 ? i + 1 : - ( i + 1 ) )
	}

	var count = Math.min(flake.children.length, Math.floor(frameNumber * 0.05));
	var targetAlpha = (destroying) ? 0 : 0.5;
	var direction = (destroying) ? -1 : 1;
	
	var finishedCount = 0;

	for(var i = 0; i < count; i++) {
		flake.children[i].material.opacity += (targetAlpha - flake.children[i].material.opacity) * 0.1;
		

		if((flake.children[i].material.opacity < 0.4) || destroying){
			
			flake.children[i].visible = Math.random() < 0.9;
			
			if(Math.random() > 0.95){
				flake.children[i].scale.y = Math.random() * 2 + 0.9;
				flake.children[i].scale.x = Math.random() * 0.5 + 0.5;
			} else{
				flake.children[i].scale.y = 1;
				flake.children[i].scale.x = 1;	
			}
		} else {
			flake.children[i].visible = true;
			flake.children[i].scale.y = 1;
			flake.children[i].scale.x = 1;	
		}

		if(Math.abs(flake.children[i].material.opacity - targetAlpha) < 0.001){
			finishedCount++;
		}
	}

	if(finishedCount == flake.children.length){
		transitionComplete();
	}

	updateCamera();
	
	core.renderer.render( core.scene, core.camera);

	window.requestAnimationFrame(render);
}

function transitionComplete(){

	if(destroying) {
		removeFlake();
		buildFlake();
	}
}

function removeFlake() {
	while(flake.children.length > 0){
		flake.children[0].geometry.dispose();
		flake.children[0].geometry = null;
		
		flake.children[0].material.dispose();
		flake.children[0].material = null;

		flake.remove(flake.children[0]);
	}
	destroying = false;
}


var flake = new THREE.Object3D();

function buildFlake() {

	flake.rotation.set(0, 0, 0);

	rings = new THREE.Geometry();
	tubes = new THREE.Geometry();
	shards = new THREE.Geometry();

	makeFrond( new THREE.Vector3(Math.random() * 30,0,0), 0, 0, 8);

	var tubeMesh = new THREE.Mesh(tubes, flakeMaterial.clone());
	flake.add(tubeMesh);

	var ringMesh = new THREE.Mesh(rings, flakeMaterial.clone());
	flake.add(ringMesh);

	var shardMesh = new THREE.Mesh(shards, flakeMaterial.clone());
	flake.add(shardMesh);


	var tubeMesh2 = new THREE.Mesh(tubes, flakeShardsMaterial.clone());
	flake.add(tubeMesh2);

	var ringMesh2 = new THREE.Mesh(rings, flakeShardsMaterial.clone());
	flake.add(ringMesh2);

	var shardMesh2 = new THREE.Mesh(shards, flakeShardsMaterial.clone());
	flake.add(shardMesh2);

	frameNumber = 0;

	for(var i = 0; i < flake.children.length; i++){
		flake.children[i].material.opacity = 0;
	}
}

var destroying = false;
function deconstructFlake() {
	frameNumber = 0;
	destroying = true;
}


var cameraPhases = [
	{
		pathFunc: startEndCameraPath
	},
	{
		pathFunc: startEdgeCameraPath
	},
	{
		pathFunc: startDistantCameraPath
	},
	{
		pathFunc: startEdgeCameraPath
	},
	{
		pathFunc: startEndCameraPath
	}
];

function updateCamera() {
	
	var cameraPathAmount = new Date().getTime() - cameraStartTime;
	cameraProgress = cameraPathAmount / (cameraPathDuration * 1000);
	var timeRemaining = (cameraPathDuration * 1000) - cameraPathAmount;

	
	if((timeRemaining < 4000) && (cameraPhase >= cameraPhases.length) && !destroying) {
		deconstructFlake();
	}

	if(cameraProgress >= 1) {
		cameraProgress = 0;
		
		if(cameraPhase >= cameraPhases.length) {
			cameraPhase = 0;
		}
		
		cameraProgress = 0;
		cameraStartTime = new Date().getTime();
		cameraPhases[cameraPhase++].pathFunc();

	} else {
		flake.rotation.z += 0.000025;
	}

	core.camera.position.copy(cameraSpline.getPointAt(cameraProgress));
	core.camera.lookAt(core.camera.target);
	
}

var cameraPhase = 0;
var cameraSpline;
var cameraProgress = 0;
var cameraStartTime = 0;
var cameraPathDuration = 15;

function startCameraPath(){
	startEdgeCameraPath();
}

function startDistantCameraPath() {
	var startAngle = Math.random() * Math.PI * 2;
	var startRadius = Math.random() * 100 + 60;
	
	var endAngle = startAngle + (Math.random * Math.PI*1.5);
	var endRadius = Math.random() * 100 + 60;

	var zOffset = 100;
	cameraPathDuration = Math.random() * 20 + 15;

	core.camera.up.set(0,1,0);
	core.camera.target.copy(core.scene.position);

	cameraSpline = new THREE.CatmullRomCurve3( [
		new THREE.Vector3( Math.cos(startAngle)*startRadius, Math.sin(startAngle)*startRadius, (Math.random()*100+50) + zOffset ),
		new THREE.Vector3( -5, 5, (Math.random()*50)  + zOffset ),
		new THREE.Vector3( Math.cos(endAngle)*endRadius, Math.sin(endAngle)*endRadius, (Math.random()*20)  + zOffset)
	] );
}


function startEdgeCameraPath() {
	var startAngle = Math.random() * Math.PI * 2;
	var startRadius = (Math.random() * 70) + 100;
	
	var endAngle = startAngle + (Math.random() * Math.PI * 0.5) - (Math.PI * 0.25);
	var endRadius = startRadius;

	var zOffset = 12;

	cameraPathDuration = Math.random() * 10 + 5;

	var startPoint = new THREE.Vector3( Math.cos(startAngle)*startRadius, Math.sin(startAngle)*startRadius, (Math.random()*20) + zOffset );
	var endPoint = new THREE.Vector3( Math.cos(endAngle)*endRadius, Math.sin(endAngle)*endRadius, (Math.random()*20) + zOffset);

	core.camera.target.set(Math.cos(startAngle+Math.PI)*startRadius, Math.sin(startAngle+Math.PI)*startRadius, 0);
	core.camera.up.set(0,Math.random()- 0.5,1);

	cameraSpline = new THREE.LineCurve(	startPoint, endPoint );
}

function startEndCameraPath(){
	var startAngle = Math.random() * Math.PI * 2;
	var startRadius = Math.random() * 100 + 60;
	
	var endAngle = startAngle + (Math.random * Math.PI*1.5);
	var endRadius = Math.random() * 100 + 60;

	var zOffset = 100;
	cameraPathDuration = Math.random() * 20 + 15;

	core.camera.up.set(0,1,0);
	core.camera.target.copy(core.scene.position);

	cameraSpline = new THREE.LineCurve(
		new THREE.Vector3( Math.cos(startAngle)*startRadius, Math.sin(startAngle)*startRadius, (Math.random()*100+50) + zOffset ),
		new THREE.Vector3( Math.cos(endAngle)*endRadius, Math.sin(endAngle)*endRadius, (Math.random()*100+250)  + zOffset)
	);
}

function loadTextures(){

	var texturesRemaining = 2;
	var loader = new THREE.TextureLoader();

	loader.load(
		'images/frost_normalized.jpg',
		function ( texture ) {
			frostTexture = texture;
			texturesRemaining--;
			if(texturesRemaining <= 0){
				contentLoaded();
			}
		});

	loader.load(
		'images/dot.png',
		function ( texture ) {
			particleTexture = texture;
			texturesRemaining--;
			if(texturesRemaining <= 0){
				contentLoaded();
			}
		});
}

function contentLoaded() {
	initializeScene();
	initParticles();
	buildFlake();
	
	core.scene.add(flake);
	
	resizeViewport(window.innerWidth, window.innerHeight);

	window.addEventListener('resize', function() {
		resizeViewport(window.innerWidth, window.innerHeight);
	});

	// why... why are browsers so broken.
	window.addEventListener("orientationchange", function() {
		window.getElementById("content").style.display = "none";
	  setTimeout(function() {
      resizeViewport(window.innerWidth, window.innerHeight);
      window.getElementById("content").style.display = "";
    }, 500);
    
	}, false);
	
	render();
}

function initialize() {
	initializeCore();
	loadTextures();
}

function initParticles() {

	var geometry = new THREE.Geometry();

	for ( i = 0; i < 5000; i ++ ) {

		var vertex = new THREE.Vector3();
		vertex.x = Math.random() * 2000 - 1000;
		vertex.y = Math.random() * 2000 - 1000;
		vertex.z = Math.random() * 2000 - 1000;

		geometry.vertices.push( vertex );

	}

	var parameters = [
		[ [1.0, 0.2, 0.5],  20 ],
		[ [0.95, 0.1, 0.5], 15 ],
		[ [0.90, 0.05, 0.5], 10 ],
		[ [0.85, 0, 0.5], 8 ],
		[ [0.80, 0, 0.5], 5 ]
	];
	
	var materials = [];

	for ( var i = 0; i < parameters.length; i ++ ) {

		var color  = parameters[i][0];
		var size   = parameters[i][1];

		materials[i] = new THREE.PointsMaterial( {
		 size: size*0.25, 
		 blending: THREE.AdditiveBlending, 
		 depthTest: false, 
		 map: particleTexture,
		 transparent : true,
		 opacity:0.4
		} );

		var particles = new THREE.Points( geometry, materials[i] );

		particles.rotation.x = Math.random() * 6;
		particles.rotation.y = Math.random() * 6;
		particles.rotation.z = Math.random() * 6;

		snow.add( particles );
	}

	core.scene.add(snow);
	core.scene.fog = new THREE.FogExp2( 0x000000, 0.0001 );
}

window.addEventListener('load', initialize);