'use strict';

module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-screeps');

    grunt.initConfig({
        screeps: {
            options: {
                email: process.env.EMAIL,
                password: process.env.PASSWORD,
                branch: 'testing',
                ptr: false
            },
            dist: {
                src: ['src/*.js']
            }
        }
    });
}
