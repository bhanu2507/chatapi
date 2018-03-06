const express = require('express');
const app = express();
const download = require('image-downloader');
const fs = require('fs');
const url = require('url');
const http = require('http');
const exec = require('child_process').exec;
const spawn = require('child_process').spawn;
const Storage = require('@google-cloud/storage');
const storage = Storage({
  projectId: 'ondotsys-poc',
  keyFilename: './ondotsyspoc-1abae5bb0f92.json'
})
const bucketName = 'pocimages';
const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient();

app.get('/moveimg', (req1, res1) => {
console.log(req1.query.iurl);
  imgdld(req1.query.iurl, function(fres) {
	gsupload(fres, function(res) {
		detecttxt(res, function(res) {
			//console.log(res);
			res1.send(res[0].description);
			//res1.send("test");
			//console.log(res[0].description);
		})
  })

  })

})

async function detecttxt(fileName, callback) {	
await client
		  .textDetection(`gs://${bucketName}/${fileName}`)
		  .then(results => {
			const detections = results[0].textAnnotations;
			//console.log('Text:');
			//detections.forEach(text => console.log(text));
			callback(detections);
		  })
		  .catch(err => {
			console.error('ERROR:', err);
		  });

}

async function gsupload(file, callback) {
          //console.log(file);
          //const storage = new Storage();
    await storage
          .bucket(bucketName)
          .upload('./pocimages/'+file)
          .then(() => {
            //console.log(`${file} uploaded to ${bucketName}.`);
            //fs.unlinkSync('./trailers/' + file);
            callback(file);
          })
          .catch(err => {
            console.error('ERROR:', err);
          });

}

function imgdld(iurl, callback) {
//let file_url = 'https://scontent-ort2-1.xx.fbcdn.net/v/t35.0-12/28309173_10155627133793089_1990338823_o.jpg?_nc_ad=z-m&_nc_cid=0&oh=4f1d8e37683cdce1bed223c6cb6d13fc&oe=5A8EB17A';
//console.log(iurl);
let file_url = iurl;
let DOWNLOAD_DIR = './pocimages/';

// We will be downloading the files to a directory, so make sure it's there
// This step is not required if you have manually created the directory
/*
let mkdir = 'mkdir -p ' + DOWNLOAD_DIR;
let child = exec(mkdir, function(err, stdout, stderr) {
    if (err) throw err;
    else download_file_curl(file_url);
});*/

let download_file_curl = function(file_url) {

    // extract the file name
    let file_name = url.parse(file_url).pathname.split('/').pop();
	console.log(url.parse(file_url).pathname.split('/').pop());
    // create an instance of writable stream
    let file = fs.createWriteStream(DOWNLOAD_DIR + file_name);
    // execute curl using child_process' spawn function
    let curl = spawn('curl', [file_url]);
    // add a 'data' event listener for the spawn instance
    curl.stdout.on('data', function(data) { file.write(data); });
    // add an 'end' event listener to close the writeable stream
    curl.stdout.on('end', function(data) {
        file.end();
        //console.log(file_name + ' downloaded to ' + DOWNLOAD_DIR);
		callback(file_name);
    });
    // when the spawn child process exits, check if there were any errors and close the writeable stream
    curl.on('exit', function(code) {
        if (code != 0) {
            console.log('Failed: ' + code);
        }
    });

}
download_file_curl(file_url);
}

// Function to download file using curl
app.use(express.static('public'));
app.use('/pocimages', express.static(__dirname+'/pocimages'));
app.listen(2000, () => console.log('Example app listening on port 2000!'))
