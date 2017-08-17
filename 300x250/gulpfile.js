// DoubleClick HTML polite banner
// tristarDoubleClickBanner

// Rename the archive that will be created here
const archivePostfix = '300x250';
const imgFilter = '/filter/Resize/resize_h/70';
const remoteFolder = 'P:/web-q-hospital.prod.ehc.com/global/webq/tristar-doubleclick-banner';

// dependencies
const gulp = require('gulp');
const gutil = require('gulp-util');
const uglify = require('gulp-uglify');
const sass = require('gulp-sass');
const minifyHTML = require('gulp-htmlmin');
const rename = require('gulp-rename');
const del = require('del');
const connect = require('gulp-connect');
const open = require('gulp-open');
const zip = require('gulp-zip');
const runSequence = require('run-sequence');
const header = require('gulp-header');
const replace = require('gulp-replace');
const htmlparser = require("htmlparser2");
const handlebars = require('gulp-compile-handlebars');
const mergeStream = require('merge-stream');
// used to guess expected size of banner based on the backup image
const sizeOf = require('image-size');
// used to get the GZIP size of the banner during the build process
const size = require('gulp-size');
const download = require("gulp-download"); 
const notify = require("gulp-notify");

const fs = require('fs');

// read in the package file
const pkg = require('./package.json');

// read int the facilities feed
const facilities = require('../facilities-feed.json');
// add foolder field to facilities
for (var i = 0; i < facilities.length; i++) {  
  facilities[i].folder =  facilities[i].title.replace(/ +/g, '-').toLowerCase()  
}

// Banner message to be appended to minified files
const nowDate = new Date();

const bannerMessageHtml = ['<!--',
  ' AVG ER Wait Time - <%= facilityName %> - <%= archivePostfix %>',
  ' @version v<%= pkg.version %>',
  ' @date ' + (nowDate.getMonth() + 1) + "-" + nowDate.getDate() + "-" + nowDate.getFullYear() + " at " + nowDate.getHours() + ":" + nowDate.getMinutes() + ":" + nowDate.getSeconds(),
  ' -->',
  ''
].join('\n');
const bannerMessageJsCss = ['/**',
  ' * AVG ER Wait Time - <%= facilityName %> - <%= archivePostfix %>',
  ' * @version v<%= pkg.version %>',
  ' * @date ' + (nowDate.getMonth() + 1) + "-" + nowDate.getDate() + "-" + nowDate.getFullYear() + " at " + nowDate.getHours() + ":" + nowDate.getMinutes() + ":" + nowDate.getSeconds(),
  ' */',
  ''
].join('\n');


// TASKS

// CHECK task - reading index.html and then check the meta tag for size

gulp.task('check', function() {
  gutil.log(gutil.colors.yellow('******************************'));
  gutil.log(gutil.colors.yellow('* Checking for banner errors *'));
  gutil.log(gutil.colors.yellow('******************************'));
  gutil.log(gutil.colors.yellow('* Scanning: ') + gutil.colors.green('index.html') + gutil.colors.yellow(' for ad.size metadata *'));

  // Read the index.html file in the dev folder
  fs.readFile('dev/index.html', 'utf8', function(err, theFileContents) {
    if (err) {
      gutil.log(gutil.colors.red('*** metadata ad.size validation error encountered ***'));
      gutil.log(gutil.colors.red(err));
    }
    var adSizeMetaData;
    var parser = new htmlparser.Parser({
      onopentag: function(name, attribs) {
        //gutil.log('opentag');
        if (name === "meta" && attribs.name === 'ad.size') {
          gutil.log(gutil.colors.yellow('* Found ad.size metadata: ') + gutil.colors.green(attribs.content));
          adSizeMetaData = attribs.content
          //gutil.log(attribs.content);
        }
      },
      ontext: function(text) {
        //console.log("-->", text);
      },
    }, { decodeEntities: true, recognizeSelfClosing: true });
    parser.write(theFileContents);
    parser.end();

    if (adSizeMetaData) {
      //gutil.log('adSizeMetaData: ' + adSizeMetaData)
    } else {
      gutil.log(gutil.colors.red("ERROR: The metadata ad.size was not found in dev\/index.html"))
    }
    // Get a list of files in the backupImage directory
    var backupImages = fs.readdirSync('backupImage/');
    // remove invisible files from list, ie. .DS_Store
    backupImages = backupImages.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item));

    if (backupImages.length === 1) {
      // if there is the expected 1 file, let's proceed
      var expectedDimensions = sizeOf('backupImage/' + backupImages[0]);
      var expectedDimensionsFormatted = 'width=' + expectedDimensions.width + ',height=' + expectedDimensions.height;
      gutil.log('expected: ' + expectedDimensionsFormatted);
      if (expectedDimensionsFormatted === adSizeMetaData) {
        gutil.log(gutil.colors.green("SUCCESS: The metadata ad.size matched the dimensions of the backup image."));
      } else {
        gutil.log(gutil.colors.red("ERROR: The metadata ad.size did not match the dimensions of the backup image."))
        gutil.log('expected: ' + gutil.colors.red(expectedDimensionsFormatted))
        gutil.log('found   : ' + gutil.colors.red(adSizeMetaData))
      }

    } else {
      gutil.log(gutil.colors.red("ERROR: Expected 1 image in backupImage directory but found " + backupImages.length))

    }

  });

})

gulp.task('del', function() {
  del([
    'dist/*',
    'delivery/*',
    'archive/*'
  ])
});

gulp.task('download-image:dev', function(){
  return download(facilities[0].knockoutlogo + imgFilter)
    .pipe(rename('logo.jpg'))
    .pipe(gulp.dest("dev"));
});


gulp.task('download-image:dist', function(){
  var tasks = [];

  for (var i = 0; i < facilities.length; i++) {   
    var facility = facilities[i];
    tasks.push(
      download(facility.knockoutlogo)
        .pipe(rename('logo.jpg'))
        .pipe(gulp.dest('dist/' + facility.folder))
    );
  }
          
  return mergeStream(tasks);       
});
  

gulp.task('sass:dev', function() {
  var facility = facilities[0];
  return gulp.src('dev/style.scss')
    .pipe(header('$bannerBackColor: ' + facility.bgcolor + ';'))
    .pipe(sass({
      outputStyle: "expanded"
    }).on('error', sass.logError))
    .pipe(rename('style.css'))
    .pipe(gulp.dest('dev'));
});

gulp.task('sass:dist', function() {
  
    var tasks = [];
    for (var i = 0; i < facilities.length; i++) {   
      var facility = facilities[i];
      tasks.push(
        gulp.src('dev/style.scss')
          .pipe(header('$bannerBackColor: ' + facility.bgcolor + ';'))
          .pipe(sass({
            outputStyle: "compressed"
          }).on('error', sass.logError))
          .pipe(header(bannerMessageJsCss, {
            pkg: pkg,
            facilityName: facility.title,
            archivePostfix: archivePostfix
          }))
          .pipe(rename('style.css'))          
          .pipe(gulp.dest('dist/' + facility.folder ))      
      );    
    }
    return mergeStream(tasks); 
  
});

gulp.task('handlebars:dev', function() {
  var facility = facilities[0];
  return gulp.src('dev/index.handlebars')
    .pipe(handlebars(facility))
    .pipe(rename('index.html'))
    .pipe(gulp.dest('dev'));
});

gulp.task('handlebars:dist', function() {
  var tasks = [];
  for (var i = 0; i < facilities.length; i++) {    
    var facility = facilities[i];    
    tasks.push(
      gulp.src('dev/index.handlebars')
        .pipe(handlebars(facility))
        .pipe(rename('index.html'))
        .pipe(gulp.dest('dist/' + facility.folder ))
    );      
  }
  return mergeStream(tasks);  
});

gulp.task('minify-html', function() {
  var opts = {
    collapseWhitespace: true, // must be true if conservativeCollapse or preserveLineBreaks are used as true
    conservativeCollapse: false, // true: collapse to 1 space (never remove it entirely)
    preserveLineBreaks: false, // true: collapse to 1 line break (never remove it entirely)
    useShortDoctype: true,
    removeScriptTypeAttributes: true,
    removeComments: true,
    removeRedundantAttributes: true,
    minifyJS: true, // minify Javascript in script elements and on* attributes
    minifyCSS: true // minify CSS in style elements and style attributes
  };
  var consoleRegEx = /console\.(clear|count|debug|dir|dirxml|error|group|groupCollapsed|groupEnd|info|profile|profileEnd|time|timeEnd|timeStamp|trace|log|warn) *\(.*\);?/gi;

  var tasks = [];
  for (var i = 0; i < facilities.length; i++) {
    var facility = facilities[i];        
    tasks.push(
      gulp.src('dist/' + facility.folder + '/index.html')      
        .pipe(replace(consoleRegEx, ''))
        .pipe(minifyHTML(opts))      
        .pipe(header(bannerMessageHtml, {
          pkg: pkg,
          facilityName : facility.title,
          archivePostfix: archivePostfix
        }))          
        .pipe(gulp.dest('dist/' + facility.folder))        
    );
  }

  return mergeStream(tasks); 
});

// Uglify external JS files
gulp.task('uglify', function() {

  var opt = {
    mangle: true, // make shorter variable names
    compress: {
      drop_debugger: true, // drop debugger messages from code
      drop_console: true // drop console messages from code
    },
    output: {
      beautify: false // make code pretty? default is false
    }
  };

  var tasks = [];
    for (var i = 0; i < facilities.length; i++) {   
      var facility = facilities[i];
      tasks.push(
        gulp.src('dev/script.js')
          .pipe(uglify(opt))
          .pipe(rename('script.js'))
          .pipe(header(bannerMessageJsCss, {
            pkg: pkg,
            facilityName: facility.title,
            archivePostfix: archivePostfix
          }))
          .pipe(gulp.dest('dist/' + facility.folder))
      );    
    }
    return mergeStream(tasks); 

});

gulp.task('copy-to-remote-folder', function() {  
  var tasks = [];
  for (var i = 0; i < facilities.length; i++) {    
    var facility = facilities[i];    
    tasks.push(
      gulp.src('dist/**/*')        
        .pipe(gulp.dest(remoteFolder + '/' + archivePostfix))
    );      
  }
  return mergeStream(tasks);  
});


gulp.task('compress', function() {
  
  const s = size({ showFiles: false, gzip: false, showTotal: false });

  var tasks = [];
  
  for (var i = 0; i < facilities.length; i++) {   
    var facility = facilities[i];
    tasks.push(
      gulp.src('dist/' + facility.folder + '/*')        
      .pipe(zip(facility.folder + '-' + archivePostfix + '.zip'))
      //.pipe(s)
      .pipe(gulp.dest('delivery'))
    );    
  }
  return mergeStream(tasks);   

});

gulp.task('copyBackupFile', function() {
  var sourceFiles = gulp.src(['backupImage/*.png', 'backupImage/*.jpg', 'backupImage/*.gif']);
  return gulp.src(['backupImage/*.png', 'backupImage/*.jpg', 'backupImage/*.gif'])
    .pipe(rename({
      basename: archiveName + '-backup'
    }))
    .pipe(gulp.dest('delivery'));
});


gulp.task('archive', function() {
  // make a zip all the files, including dev folder, for archiving the banner
  var success = gulp.src(['gulpfile.js', 'package.json', '*.sublime-project', 'dev/**/*', 'dist/**/*', 'backupImage/*', 'delivery/**/*'], { cwdbase: true })
    // for quick access, you can change this
    // name at the top of this file
    .pipe(zip('archive-' + archivePostfix + '.zip'))
    .pipe(gulp.dest('archive'));
  gutil.log('--------------------------------');
  gutil.log('Your banner has been archived in');
  gutil.log('archive/' + gutil.colors.yellow('archive-' + archiveName + '.zip'));
  gutil.log('--------------------------------');
  return success;
});


gulp.task('connect', function() {
  connect.server({
    root: ['dev'],
    port: 8889,
    livereload: true,
    //livereload: { port: '9999' }
  });
});

gulp.task('open', function() {
  var options = {
    uri: 'http://localhost:8889'
    // app: 'Google Chrome' on Max OSX or 'chrome' on Windows
    // app: 'firefox'
  };
  gutil.log('-----------------------------------------');
  gutil.log('Opening browser to:', gutil.colors.yellow('http://localhost:8889'));
  gutil.log('-----------------------------------------');
  gulp.src(__filename)
    .pipe(open(options));
});


gulp.task('basic-reload', function() {
  gulp.src('dev')
    .pipe(connect.reload());
});

gulp.task('watch', function() {
  gulp.watch(['dev/*.html', 'dev/*.js'], ['basic-reload']);
  gulp.watch(['dev/*.scss'], ['sass:dev']);
  gulp.watch(['dev/*.handlebars'], ['handlebars:dev']);
  gulp.watch(['dev/*.css'], ['basic-reload']);
});


gulp.task('build', function(callback) {
  //runSequence('del', 'sass:dist', 'handlebars:dist', 'copy-to-dist-folder', 'minify-html', 'uglify', 'compress', 'copyBackupFile', callback);
  runSequence(
    'del', 
    'download-image:dist',
    'sass:dist', 
    'handlebars:dist', 
    'minify-html', 
    'uglify',    
    'compress',
    callback);
});


gulp.task('copy', function(callback) {  
  runSequence(
    'del', 
    'download-image:dist',
    'sass:dist', 
    'handlebars:dist', 
    'minify-html', 
    'uglify',
    'copy-to-remote-folder',
    callback);
});


gulp.task('serve', function(callback) {
  runSequence('download-image:dev','sass:dev', 'handlebars:dev', ['connect'], ['open', 'watch'],
    callback);
});




// Shortcut to build and archive all at once
gulp.task('ba', function() { runSequence(['check'], ['build'], ['archive']) });

gulp.task('help', function() {  
  gutil.log('There are 4 basic commands.');
  gutil.log(gutil.colors.yellow('gulp'), ': for dev use, spins up server w livereload as you edit files');
  gutil.log(gutil.colors.yellow('gulp build'), ': minifies files from the dev directory into the', gutil.colors.red('dist'), 'directory');
  gutil.log('and creates a zip of these files in', gutil.colors.red('delivery'), 'directory');
  gutil.log(gutil.colors.yellow('gulp copy'), ': copy the ', gutil.colors.red('dist'), 'directory to a remote folder.');  
  gutil.log(gutil.colors.yellow('gulp archive'), ': takes files from the ' + gutil.colors.red('dev'), 'directory' + ' plus other important files');
  gutil.log('and zips them in the', gutil.colors.red('archive'), 'directory for archival purposes. COMING SOON!');
  gutil.log('--------------------------');
});

gulp.task('default', ['serve']);
