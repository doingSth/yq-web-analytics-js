var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    clean = require('gulp-clean'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    wrap = require('gulp-wrap'),
    bump = require('gulp-bump'),
    frep = require('gulp-frep'),
    concat = require('gulp-concat'),
    size = require('gulp-size'),
    stylish = require('jshint-stylish'),
    connect = require('connect'),
    serveStatic = require('serve-static');

var template = '(function (window, document) {\n<%= contents %>\n})(window, document);\n';

var sources = [
    // 'bower_components/transform-perf/perf.js',
    'src/util.js',
    'src/event.js',
    'src/cookie.js',
    'src/client.js',
    'src/beacon.js',
    'src/tracker.js',
    'src/plugin/page.js',
    'src/bootstrap.js'
];

var coreSources = [
    'src/util.js',
    'src/event.js',
    'src/cookie.js',
    'src/client.js',
    'src/beacon.js',
    'src/tracker.js',
    'src/bootstrap.js'
];

var injectSources = [
    'src/inject.js',
    'src/xhr.js'
];

var dists = [
    'dist/*.js',
];

// bump npm versions
gulp.task('bump', function () {
    return gulp.src('package.json')
        .pipe(bump())
        .pipe(gulp.dest('.'));
});

// clean up old builds
gulp.task('clean', function () {
    gulp.src(dists)
        .pipe(clean());
});

// lint
gulp.task('lint', function () {
    gulp.src(sources)
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter(stylish));
});

// build files
gulp.task('build', ['clean', 'lint'], function () {
    // wait for package.json change
    setTimeout(__build, 500);
});

// publish new version
gulp.task('publish', ['bump', 'build']);

// dev task
gulp.task('dev', function() {
    __build();

    gulp.watch(sources).on('change', function(file) {
        __build();

        gulp.src(file.path)
            .pipe(jshint('.jshintrc'))
            .pipe(jshint.reporter(stylish));

    });

    var server = connect();
    server.use('/static', serveStatic('dist')).listen(8084);

});

function __build() {
    var pkg = require('./package.json');

    // core + plugins
    gulp.src(sources)
        .pipe(concat('mta.js'), {newLine: ';'})
        .pipe(wrap(template))
        .pipe(frep([{ pattern: /@VERSION@/g, replacement: pkg.version }]))
        .pipe(size({ showFiles: true, gzip: true }))
        .pipe(gulp.dest('dist/'))
        .pipe(uglify({ mangle: true, report: 'gzip' }))
        .pipe(rename('mta.min.js'))
        .pipe(size({ showFiles: true, gzip: true }))
        .pipe(gulp.dest('dist/'));

    // core file
    gulp.src(coreSources)
        .pipe(concat('mta.core.js'), {newLine: ';'})
        .pipe(wrap(template))
        .pipe(frep([{ pattern: /@VERSION@/g, replacement: pkg.version }]))
        .pipe(size({ showFiles: true, gzip: true }))
        .pipe(gulp.dest('dist/'))
        .pipe(uglify({ mangle: true, report: 'gzip' }))
        .pipe(rename('mta.core.min.js'))
        .pipe(size({ showFiles: true, gzip: true }))
        .pipe(gulp.dest('dist/'));

    // inject file
    gulp.src(injectSources)
        .pipe(concat('mta.inject.js'), {newLine: ';'})
        .pipe(size({ showFiles: true, gzip: true }))
        .pipe(gulp.dest('dist/'))
        .pipe(uglify({ mangle: true, report: 'gzip' }))
        .pipe(rename('mta.inject.min.js'))
        .pipe(size({ showFiles: true, gzip: true }))
        .pipe(gulp.dest('dist/'));

}
