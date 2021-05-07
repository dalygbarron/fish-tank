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
                    'src/graphics.js',
                    'src/audio.js',
                    'src/input.js',
                    'src/store.js',
                    'src/shader.js',
                    'src/screen.js',
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
        jsdoc: {
            dist: {
                src: ['src/*.js', 'package.json', 'README.md'],
                options: {
                    destination: 'doc'
                }
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-terser');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.registerTask(
        'default',
        ['jshint', 'concat', 'terser:main', 'jsdoc']
    );
};
