const fs = require('fs');

//This has been downloaded from https://www.npmjs.com/package/jszip
const jszip = require('./jszip');
const zip = new jszip();

// All script's options are set in this object
const CONFIG = {
    mainPath: './test_data/', // root of archive
    destinationPath: './zipped', // where to put processed files
    filesToIgnore: [
      'renamer.js', 
      'jszip.js'], // ignore during processing

    // renamingDictionary: [
    //   {
    //     inFolder: 'anamat1_22004',
    //     tag: ''
    //   }
    // ],
    tags: [
      'anaMat1',
      'fis1',
      'ingSoftware'
    ]
};

const DATA = {
  items: recursivelyListFiles(CONFIG.mainPath)
};



/**
 * 
 * 
 * @param {String} path - the path the file belongs to
 * @param {String} name - the name of the file to process
 * @param {Array} tags - an array of Strings reprenting available tags
 */
function getZippedName(path, name, tags) {
  let zippedName = '';
  tags.forEach( tag => {
    if(path.includes(tag)) {

    }
  })

  if(zippedName === '') {
    console.log('WARNING: no tag found for file ', name, 'in', path);
  }

  return zippedName;
}



/**
 * Recursively list all files
 * @param {string} startPath - The starting path
 * @param {Array} [array] - The array to return
 * @returns An array with all listed files in every subfolder
 */
function recursivelyListFiles(startPath, array) {
  let files = fs.readdirSync(startPath, {withFileTypes: true});
  array = array || [];
  files.forEach( file => {

    if(file.isDirectory()) {
      recursivelyListFiles(startPath + file.name + '/', array);
    }
    else {
      array.push({
        path: startPath, 
        name: file.name,
        zippedName: getZippedName(startPath, file.name)});
      // array.push(startPath + file.name);
      // array.push(file);
    }
  });
  return array;
}


/**
 * Zips every file in the array
 * @param {Array} array - an array of items: {path: string, name: string}
 */
function zipAll(array) {
  array.forEach( item => {
    if(item.zippedName === '') {
      console.log('WARNING: file has no zippedName and will be skipped', item.name);
      return;
    }
    console.log("Begin zipping ", item.name);


    let destName = CONFIG.destinationPath + item.zippedName;

    zip.file(destName, fs.readFileSync(item.path + item.name));
    zip.generateNodeStream({type: 'nodebuffer', streamFiles: true})
      .pipe(fs.createWriteStream(item.name + '.zip'))
      .on('finish', function () {
        // JSZip generates a readable stream with a "end" event,
        // but is piped here in a writable stream which emits a "finish" event.
        console.log(item.name + '.zip generated.');
    });

  });
}







console.log(DATA.items)