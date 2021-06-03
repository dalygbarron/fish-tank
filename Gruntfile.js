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
                    'src/util.js',
                    'src/constants.js',
                    'src/graphics.js',
                    'src/audio.js',
                    'src/input.js',
                    'src/store.js',
                    'src/shader.js',
                    'src/screen.js',
                    'src/gui.js',
                    'src/fish.js'
                ],
                dest: 'build/<%= pkg.name %>.js'
            }
        },
        terser: {
            options: {ecma: 2017},
            main: {
                files: {
                    'build/fish-tank.min.js': ['build/fish-tank.js']
                }
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
                    template : 'node_modules/ink-docstrap/template',
                    configure : 'node_modules/ink-docstrap/template/jsdoc.conf.json'
                }
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-terser');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.loadNpmTasks('grunt-spritesmith');
    grunt.registerTask(
        'default',
        ['jshint', 'concat', 'terser:main', 'jsdoc', 'sprite']
    );
};
