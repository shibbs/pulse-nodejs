

module.exports = {
  initRoutes : function(_app, _fs, _spawn, _camera, _liveview, _capture, _getCameraImage, _gphotoInit, _downsize){

    _app.get('/', function(req, res){
      res.send('Hello Alpine!');
    });

    _app.get('/frame', function(req, res){
      _liveview(res);
    });

    _app.get('/list', function(req, res){
      if(camera){
        camera.close();
        console.log('Closed camera connection');
        camera = undefined;
      }

      var output = '';
      fileList = _spawn('gphoto2', ['--list-files']);

      fileList.stdout.on('data', function(data){
        console.log('gphoto2 stdout: '+data);
        output += data;
      });

      fileList.stderr.on('data', function(data){
        console.log('gphoto2 stderr: '+data);
        output += data;
      });

      fileList.on('close', function (code){
        console.log('gphoto2 process exited with code ' + code);
        res.send(output);
        fileList = undefined; // garbage collect me plz
        _gphotoInit();
      });
    });

    var captureResponse;
    _app.get('/capture', function(req, res){
      _capture().then(function(photoPath){
        var tmp = '/tmp/foo.'+Date.now();
        _getCameraImage(photoPath, tmp).then(
          function(){
            if(compressionFactor > 1){
              _downsize(tmp, compressionFactor);
            }
            var buffer = _fs.readFileSync(tmp);
            res.send(buffer);
            _fs.unlinkSync(tmp);
          }
        );
      });
    });

    _app.get('/file', function(req, res){
      var path = req.query.path;
      if(path){
        res.send(_fs.readFileSync(path));
      }else{
        res.send('Invalid Path');
      }
    });

    _app.get('/cameraFile', function(req, res){
      var path = req.query.path;
      if(path){
        _getCameraImage(path, __dirname+'/tmpFile').then(
          function(filePath){
            res.send(_fs.readFileSync(filePath));
            _fs.unlinkSync(filePath);
          }
        );
      }else{
        res.send('Invalid Path');
      }

    });

    var tlFrameIndex = 1;
    _app.get('/tlPreview', function(req, res){
      var buffer = _fs.readFileSync(tlObject.tlDirectory+'/'+tlFrameIndex+'.jpg');
        res.send(buffer);
        tlFrameIndex++;
        if(tlFrameIndex > tlObject.total){
          tlFrameIndex = 1;
        }
    });

    _app.listen(80, function() {
    	console.log('http stream server is running on port 80');
    });

  }
};