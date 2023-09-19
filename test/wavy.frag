uniform mediump float time;
uniform sampler2D texture;
uniform sampler2D critter;
varying highp vec2 vCritterCoord;
varying highp vec2 vTextureCoord;

void main() {
    mediump vec2 move = vec2(
        sin(time + vCritterCoord.y * 3.0),
        cos(time + vCritterCoord.x * 4.0)
    );
    gl_FragColor = texture2D(texture, vTextureCoord) * sin(time) +
        texture2D(critter, vCritterCoord + move);
}