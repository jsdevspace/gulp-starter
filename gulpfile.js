const concat = require('gulp-concat');
const scss = require('gulp-sass')(require('sass'));
const uglify = require('gulp-uglify-es').default;
const browserSync = require('browser-sync').create();
const { src, dest, watch, parallel, series } = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const clean = require('gulp-clean');
const avif = require('gulp-avif');
const webp = require('gulp-webp');
const imagemin = require('gulp-imagemin');
const svgSprite = require('gulp-svg-sprite');
const fonter = require('gulp-fonter');
const ttf2woff2 = require('gulp-ttf2woff2');
const include = require('gulp-include');
const newer = require('gulp-newer');

function createStyles() {
    return src('./src/scss/**/*.scss')
        .pipe(autoprefixer())
        .pipe(concat('style.min.css'))
        .pipe(scss({ outputStyle: 'compressed' }).on('error', scss.logError))
        .pipe(dest('./src/css'))
        .pipe(browserSync.stream());
}

function createScripts() {
    return src('./src/js/**/*.js')
        .pipe(concat('index.min.js'))
        .pipe(uglify())
        .pipe(dest('./src/js'))
        .pipe(browserSync.stream());
}



function sync() {
    browserSync.init({
        server: {
            baseDir: './src',
        },
    });
}

function createImages() {
    return (
        src(['./src/images/src/**/*.*', '!./src/images/src/**/*.svg'])
            // run gulp-avif with 50% quality
            .pipe(avif({ quality: 50 }))
            // back to our source folder
            .pipe(src('./src/images/src/**/*.*'))
            // run webp
            .pipe(webp())
            .pipe(src('./src/images/src/**/*.*'))
            .pipe(imagemin())
            .pipe(dest('./src/images'))
    );
}

function createSvg() {
    return src('./src/images/src/*.svg')
        .pipe(
            svgSprite({
                mode: {
                    stack: {
                        sprite: '../sprite.svg',
                        example: true,
                        allowEmpty: true
                    },
                },
            })
        )
        .pipe(dest('./src/images'));
}

function createFonts() {
    return src('./src/fonts/src/*.*')
        .pipe(fonter({ formats: ['woff', 'ttf'] }))
        .pipe(src('./src/fonts/*.ttf'))
        .pipe(ttf2woff2())
        .pipe(dest('./src/fonts'));
}

function images() {
    return (
        src(['./src/images/src/**/*.*', '!./src/images/src/**/*.svg'])
            // avoid loading processed images
            .pipe(newer('./src/images'))
            .pipe(avif({ quality: 50 }))
            .pipe(src('./src/images/src/**/*.*'))
            // ...
            .pipe(newer('./src/images'))
            .pipe(webp())
            .pipe(src('./src/images/src/**/*.*'))
            // ...
            .pipe(newer('./src/images'))
            .pipe(imagemin())
            .pipe(dest('./src/images'))
    );
}

function build() {
    return src(
        [
            './src/css/**/*.min.css',
            './src/images/**/*.*',
            '!./src/images/**/*.svg',
            './src/images/sprite.svg',
            './src/js/**/*.min.js',
            './src/fonts/*.*',
            './src/**/*.html',
        ],
        { base: 'src' }
    ).pipe(dest('dist'));
}

function cleanProject() {
    return src('dist/**').pipe(clean());
}

function includes() {
    return src('./src/pages/**/*.html')
        .pipe(
            include({
                includePath: './src/components/',
            })
        )
        .pipe(dest('./src'))
        .pipe(browserSync.stream());
}

function watching() {
    watch(['./src/scss/**/*.scss'], createStyles);
    watch(['./src/js/**/*.js'], createScripts);
    watch(['./src/**/*.html']).on('change', browserSync.reload);
    watch(['./src/images/src/**/*.*'], images);
    watch(['./src/components/**/*.html', './src/pages/**/*.html'], includes);
}

exports.cleanProject = cleanProject;
exports.sync = sync;
exports.createStyles = createStyles;
exports.createScripts = createScripts;
exports.watching = watching;
exports.createFonts = createFonts;
exports.build = series(cleanProject, build);
exports.default = parallel(createStyles, createScripts, images, watching, sync);