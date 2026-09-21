varying vec2 vUv;
uniform float uProgress;
uniform vec3 uColor;

// Resource noise function: https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83

float rand(vec2 n) { 
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 p){
	vec2 ip = floor(p);
	vec2 u = fract(p);
	u = u*u*(3.0-2.0*u);
	
	float res = mix(
		mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
		mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
	return res*res;
}

void main(){
  float noise = noise(vUv * 5.);

  float edge = 0.185;

  float disolve = smoothstep(1. - uProgress - edge, 1. - uProgress + edge, noise);
  
  float alpha = 1. - disolve;

  gl_FragColor = vec4(uColor, alpha);
}