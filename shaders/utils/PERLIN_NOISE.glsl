// THANKS TO https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
float rand(vec2 c){
    return fract(sin(dot(c.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

float noise(vec2 p, float freq, float unitValue){
    float unit = unitValue/freq;
    vec2 ij = floor(p/unit);
    vec2 xy = mod(p,unit)/unit;
    //xy = 3.*xy*xy-2.*xy*xy*xy;
    xy = .5*(1.-cos(PI*xy));
    float a = rand((ij+vec2(0.,0.)));
    float b = rand((ij+vec2(1.,0.)));
    float c = rand((ij+vec2(0.,1.)));
    float d = rand((ij+vec2(1.,1.)));
    float x1 = mix(a, b, xy.x);
    float x2 = mix(c, d, xy.x);
    return mix(x1, x2, xy.y);
}

float pNoise(vec2 p, int res, float persistence, float frequency, float amplitude, float unitValue){

    float n = 0.;
    float f = frequency;
    float normK = 0.;
    float amp = amplitude;
    int iCount = 0;
    for (int i = 0; i<50; i++){
        n+=amp*noise(p, f, unitValue);
        f*=2.;
        normK+=amp;
        amp*=persistence;
        if (iCount == res) break;
        iCount++;
    }
    float nf = n/normK;
    return nf*nf*nf*nf;
}