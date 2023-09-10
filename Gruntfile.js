module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            options: {
                esversion: 8
            },
            all: ['src/*.js']
        },
        concat: {
            dist: {
                src: [
                    'src/util.ts',
                    'src/constants.ts',
                    'src/graphics.ts',
                    'src/audio.ts',
                    'src/input.ts',
                    'src/store.ts',
                    'src/shader.ts',
                    'src/screen.ts',
                    'src/gui.ts',
                    'src/fish.ts'
                ],
                sourceMap: true,
                dest: 'build/<%= pkg.name %>.js'
            }
        },
        sprite: {
            all: {
                src: 'testSprites/*.png',
                dest: 'test/sprites.png',
                destCss: 'test/sprites.json',
                padding: 1
            }
        },
        jsdoc: {
            dist: {
                src: [
                    'src/*.js',
                    'package.json',
                    'README.md',
                    'logo.png'
                ],
                options: {
                    destination: 'docs',
                    template: 'node_modules/docdash'
                },
            }
        },
        copy: {
            main: {
                files: [
                    {src: ['logo.png'], dest: 'docs/'},
                    {src: ['build/fish-tank.js'], dest: 'test/fish-tank.js'},
                    {expand: true, src: ['test/*'], dest: 'docs/'}
                ]
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.loadNpmTasks('grunt-spritesmith');
    grunt.registerTask(
        'default',
        ['jshint', 'concat', 'jsdoc', 'sprite', 'copy']
    );
};
