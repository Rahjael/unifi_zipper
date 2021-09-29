const fs = require('fs');

// This has been downloaded from https://www.npmjs.com/package/jszip
const jszip = require('./jszip');
const zip = new jszip();


// This whole block is to promisify the pipeline (so i can make it wait at every iteration)
const util = require('util');
const stream = require('stream')
const promisifiedPipeline = util.promisify(stream.pipeline);



// All script's options are set in this object
const CONFIG = {
    mainPath: './test_data/', // root of archive
    destinationPath: './zipped/', // where to put processed files
    filesToIgnore: [
      'unifi_zipper.js',
      'jszip.js'
    ], // ignore during processing

    tags: [
      'anaMat1',
      'fis1',
      'ingSoftware'
    ], // keys to use when renaming files (these are highly dependant on how the unifi-webex-dl tool is configured)
    
    // These should probably be left alone
    webexTimestampRegex: /20[0-9]{6}_[0-9]{4}-[0-9]/gi,
    pruneTimeRegex: /_[0-9]{4}-/gi
};

const DATA = {
  items: recursivelyListFiles(CONFIG.mainPath)
};



/**
 * Generate a suitable .zip name from the original webex name
 * 
 * @param {String} path - the path the file belongs to
 * @param {String} name - the name of the file to process
 * @param {Array} tags - an array of Strings representing available tags
 */
function getZippedName(path, name, tags) {
  let zippedName = '';

  // Fetch timestamp info from webex naming convention
  let fileDate = name.match(CONFIG.webexTimestampRegex)[0];

  // Rename files only if a proper tag is found
  tags.forEach( tag => {
    if(path.includes(tag)) {
      zippedName = tag + '_' + fileDate + '.zip';
    }
  });

  if(zippedName === '') {
    console.log('WARNING: no tag found for file ', name, 'in', path);
  }

  return zippedName;
}



/**
 * Recursively list all files
 * @param {string} startPath - The starting path
 * @param {Array} [array] - This 
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
      if(CONFIG.filesToIgnore.every( name => name != file.name)) {
        array.push({
          path: startPath,
          name: file.name,
          zippedName: getZippedName(startPath, file.name, CONFIG.tags)
        });
      }
    }
  });
  return array;
}


/**
 * Zips every file in the array
 * @param {Array} array - an array of items: {path: string, name: string, zippedName: string}
 */
async function zipAll(array) {
  for(const item of array) {
    if(item.zippedName === '') {
      console.log('WARNING: property zippedName is empty, file will not be processed:', item.name);
      return;
    }
    
    zip.file(item.name, fs.readFileSync(item.path + item.name)),
    
    await promisifiedPipeline(
      zip.generateNodeStream({type: 'nodebuffer', streamFiles: true}),
      fs.createWriteStream(item.zippedName),  
    )
    .then( () => {
      console.log(item.zippedName, 'created.');    
      fs.rename(item.zippedName, CONFIG.destinationPath + item.zippedName, (err) => {
        if(err) console.log(err);
        else console.log(item.zippedName, "moved to zipped folder.");
      });
      },
        (err) => console.log(err)
      )
  }




    
    //
    //  This is the original attempt which closely followed jsZIP's documentation
    //

    // zip.generateNodeStream({type: 'nodebuffer', streamFiles: true})
    //   .pipe(fs.createWriteStream(item.zippedName))
    //   .on('finish', function () {
    //     // JSZip generates a readable stream with a "end" event,
    //     // but is piped here in a writable stream which emits a "finish" event.

    //     // move generated file to proper output directory        
    //     if (!fs.existsSync(CONFIG.destinationPath)){
    //       fs.mkdirSync(CONFIG.destinationPath);
    //     }

    //     console.log(item.zippedName + ' generated.');

    //     fs.rename(item.zippedName, CONFIG.destinationPath + item.zippedName, (err) => {
    //       if(err) {
    //         console.log(err);
    //       }
    //       else {           
    //         console.log(item.zippedName, "moved to zipped folder");
    //       }
    //     });
    // });
}



zipAll(DATA.items).catch(console.error);