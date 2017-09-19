// DoubleClick HTML polite banner
// tristarDoubleClickBanner

// Rename the archive that will be created here
const adParameters = [
  {
    'id': '300x250',
    'imgFilter': '/filter/Resize/resize_h/68'
   }, 
  {
    'id': '320x50',
    'imgFilter': '/filter/Resize/resize_h/40'
  }, 
  {
    'id': '728x90',
    'imgFilter': '/filter/Resize/resize_h/76'
  }
];

const remoteFolder = 'P:/web-q-hospital.prod.ehc.com/global/webq/tristar-doubleclick-banner';
const gitURL = 'https://github.com/web-q/tristar-banner/raw/master/';

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

// search for --size parameter, 
// if parameter doesn't exist process all sizes
var currentConfig = [];
var currentSize;
var  sizeParam = gutil.env.size;
if(sizeParam !== undefined && sizeParam !== true){  
  var conf = adParameters.find(o => o.id === sizeParam);
  if(conf === undefined){    
    gutil.log('Size '+ currentSize + ' does not exist.');
    process.exit();
  }else{
    currentSize = sizeParam;
    currentConfig.push(conf);    
  }    
}else{
  currentSize = "all";
  currentConfig = adParameters;
}

// read in the package file
const pkg = require('./package.json');

// read the facilities feed
var facilities = require('./facilities-feed.json');
// add folder field to facilities
for (var i = 0; i < facilities.length; i++) {  
  facilities[i].folder =  facilities[i].title.replace(/ +/g, '-').toLowerCase();  
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


gulp.task('download-image:dev', function(){  
  var logoURL;  
  if(facilities[0].hasOwnProperty('customLogo' + currentSize) && facilities[0]['customLogo' + currentSize] !== ''){
    logoURL = gitURL + currentSize + '/logo/' + facilities[0]['customLogo' + currentSize];
  }else{
    logoURL = facilities[0].knockoutlogo + currentConfig[0].imgFilter;
  }  
  return download(logoURL)
    .pipe(rename('logo.png'))
    .pipe(gulp.dest(currentSize + "/dev"));  
});

gulp.task('sass:dev', function() {
  return gulp.src(currentSize + '/dev/style.scss')
    .pipe(header('$bannerBackColor: ' + facilities[0].bgcolor + ';'))
    .pipe(sass({
      outputStyle: "expanded"
    }).on('error', sass.logError))
    .pipe(rename('style.css'))
    .pipe(gulp.dest(currentSize + '/dev'));
});

gulp.task('handlebars:dev', function() {
  var facility = facilities[0];
  return gulp.src(currentSize + '/dev/index.handlebars')
    .pipe(handlebars(facility))
    .pipe(rename('index.html'))
    .pipe(gulp.dest(currentSize +'/dev'));
});

gulp.task('del', function() {
  var i;
  for (i = 0; i < currentConfig.length; i++){
    gutil.log('Deleting ' + currentConfig[i].id + '...');
    del([
      currentConfig[i].id + '/dist/*',
      currentConfig[i].id + '/delivery/*',
      currentConfig[i].id + '/archive/*'
    ]);
  }  
});

gulp.task('download-image:dist', function(){
  var tasks = [];
  var facility;
  var logoURL;
  var i;
  var j;

  for (j = 0; j < currentConfig.length; j++) {   

    for (i = 0; i < facilities.length; i++) {   
      facility = facilities[i];
      logoURL;      

      if(facility.hasOwnProperty('customLogo' + currentConfig[j].id) && facility['customLogo' + currentConfig[j].id] !== ''){        
        logoURL = gitURL + currentConfig[j].id + '/logo/' + facility['customLogo' + currentConfig[j].id];        
      }else{
        logoURL = facility.knockoutlogo + currentConfig[j].imgFilter;
      }
      tasks.push(
        download(logoURL)
          .pipe(rename('logo.png'))
          .pipe(gulp.dest(currentConfig[j].id + '/dist/' + facility.folder))
      );
    }

  }
          
  return mergeStream(tasks);       
});
  
gulp.task('sass:dist', function() {
  
    var tasks = [];
    var facility;
    var i;
    var j;

    for (j = 0; j < currentConfig.length; j++) {

      for (i = 0; i < facilities.length; i++) {   
        facility = facilities[i];
        tasks.push(
          gulp.src(currentConfig[j].id + '/dev/style.scss')
            .pipe(header('$bannerBackColor: ' + facility.bgcolor + ';'))
            .pipe(sass({
              outputStyle: "compressed"
            }).on('error', sass.logError))
            .pipe(header(bannerMessageJsCss, {
              pkg: pkg,
              facilityName: facility.title,
              archivePostfix: currentSize
            }))
            .pipe(rename('style.css'))          
            .pipe(gulp.dest(currentConfig[j].id + '/dist/' + facility.folder ))      
        );    
      }

    }

    return mergeStream(tasks);   
});

gulp.task('handlebars:dist', function() {
  var tasks = [];
  var facility;
  var i;
  var j;

  for (j = 0; j < currentConfig.length; j++) {
    for (i = 0; i < facilities.length; i++) {    
      facility = facilities[i];    
      tasks.push(
        gulp.src(currentConfig[j].id + '/dev/index.handlebars')
          .pipe(handlebars(facility))
          .pipe(rename('index.html'))
          .pipe(gulp.dest(currentConfig[j].id + '/dist/' + facility.folder ))
      );      
    }
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
  var facility;
  var i;
  var j;

  for (j = 0; j < currentConfig.length; j++) {
    for (i = 0; i < facilities.length; i++) {
      facility = facilities[i];        
      tasks.push(
        gulp.src(currentConfig[j].id + '/dist/' + facility.folder + '/index.html')      
          .pipe(replace(consoleRegEx, ''))
          .pipe(minifyHTML(opts))      
          .pipe(header(bannerMessageHtml, {
            pkg: pkg,
            facilityName : facility.title,
            archivePostfix: currentConfig[j].id
          }))          
          .pipe(gulp.dest(currentConfig[j].id + '/dist/' + facility.folder))        
      );
    }
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
  var facility;
  var i;
  var j;

  for (j = 0; j < currentConfig.length; j++) {
    for (var i = 0; i < facilities.length; i++) {   
      var facility = facilities[i];
      tasks.push(
        gulp.src(currentConfig[j].id + '/dev/script.js')
          .pipe(uglify(opt))
          .pipe(rename('script.js'))
          .pipe(header(bannerMessageJsCss, {
            pkg: pkg,
            facilityName: facility.title,
            archivePostfix: currentConfig[j].id 
          }))
          .pipe(gulp.dest(currentConfig[j].id + '/dist/' + facility.folder))
      );    
    }
  }
  return mergeStream(tasks); 

});

gulp.task('copy-to-remote-folder', function() {  
  var tasks = [];
  var facility;
  var i;
  var j;

  for (j = 0; j < currentConfig.length; j++) {
    for (var i = 0; i < facilities.length; i++) {    
      var facility = facilities[i];    
      tasks.push(
        gulp.src(currentConfig[j].id + '/dist/**/*')        
          .pipe(gulp.dest(remoteFolder + '/' + currentConfig[j].id))
      );      
    }
  }

  return mergeStream(tasks);  
});


gulp.task('compress', function() {
  
  const s = size({ showFiles: false, gzip: false, showTotal: false });

  var tasks = [];
  var facility;
  var i;
  var j;
  
  for (j = 0; j < currentConfig.length; j++) {
    for (var i = 0; i < facilities.length; i++) {   
      var facility = facilities[i];
      tasks.push(
        gulp.src(currentConfig[j].id + '/dist/' + facility.folder + '/*')        
        .pipe(zip(facility.folder + '-' + currentConfig[j].id + '.zip'))
        //.pipe(s)
        .pipe(gulp.dest(currentConfig[j].id + '/delivery'))
      );    
    }
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
  const s = size({ showFiles: false, gzip: false, showTotal: false });

  var tasks = [];  
  var i;
    
  for (j = 0; j < currentConfig.length; j++) {  
      tasks.push(
        gulp.src(currentConfig[j].id + '/delivery/*')        
        .pipe(zip('./' + currentConfig[j].id + '.zip'))
        //.pipe(s)
        .pipe(gulp.dest('./'))
      );        
  }
  return mergeStream(tasks);   

});


gulp.task('connect', function() {
  connect.server({
    root: [currentSize + '/dev'],
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


gulp.task('config-reload', function() {
  //delete require cache
  delete require.cache[require.resolve('./facilities-feed.json')];  
  //reload facilities-feed
  facilities = require('./facilities-feed.json');  
  for (var i = 0; i < facilities.length; i++) {  
    facilities[i].folder =  facilities[i].title.replace(/ +/g, '-').toLowerCase();  
  }  
});

gulp.task('basic-reload', function() {
  gulp.src(currentSize + '/dev')
    .pipe(connect.reload());
});

gulp.task('watch', function() {
  gulp.watch([currentSize + '/dev/*.html', currentSize + '/dev/*.js'], ['basic-reload']);
  gulp.watch([currentSize + '/dev/*.scss'], ['sass:dev']);
  gulp.watch([currentSize + '/dev/*.handlebars'], ['handlebars:dev']);
  gulp.watch([currentSize + '/dev/*.css'], ['basic-reload']);
  gulp.watch(['facilities-feed.json'], ['config-reload', 'sass:dev','handlebars:dev','basic-reload']);
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
    'archive',
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
  if(currentSize !== 'all'){
    runSequence('download-image:dev','sass:dev', 'handlebars:dev', ['connect'], ['open', 'watch'],
      callback);
  }else{
    gutil.log('Please use "--size " parameter');
  }
});




// Shortcut to build and archive all at once
gulp.task('ba', function() { runSequence(['check'], ['build'], ['archive']) });

gulp.task('help', function() {  
  gutil.log('There are 3 basic commands.');
  gutil.log(gutil.colors.yellow('gulp --size 300x250|320x50|728x90'), ': for dev use, spins up server w livereload as you edit files, --size parameter required');
  gutil.log(gutil.colors.yellow('gulp build [--size 300x250|320x50|728x90]'), ': minifies files from the dev directory into the', gutil.colors.red('dist'), 'directory');
  gutil.log('and creates a zip of these files in', gutil.colors.red('delivery'), 'directory');
  gutil.log(gutil.colors.yellow('gulp copy'), ': copy the ', gutil.colors.red('dist'), 'directory to a remote folder.');    
  gutil.log('--------------------------');
});

gulp.task('default', ['serve']);
