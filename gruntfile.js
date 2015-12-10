module.exports = function(grunt) {

  grunt.initConfig({

    uglify: {
      dist: {
        options:{
          sourceMap: false
        },
        files: {
          'js/app.min.js': [
            'js/three.min.js', 
            'js/app.js' ]
        }
      }
    },

  });

  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', ['uglify']);
};