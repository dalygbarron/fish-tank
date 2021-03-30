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
                    'src/dep/gl-matrix.js',
                    'src/util.js',
                    'src/Graphics.js',
                    'src/Store.js',
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
        }
    });
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-terser');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.registerTask('default', ['jshint', 'concat', 'terser:main']);
};
