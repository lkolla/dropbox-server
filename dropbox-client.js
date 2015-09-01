let fs = require('fs')
let rimraf = require('rimraf')
let mkdirp = require('mkdirp')
let net = require('net')
let jsonSocket = require('json-socket')
let http = require('http')

const TCP_SERVER_PORT = '8009'
const TCP_SERVER_HOST = 'localhost'
const HTTP_SERVER_PORT = '8000'
const HTTP_SERVER_HOST = 'localhost'
const ROOT_DIR_CLIENT = process.env.CLIENT_ROOT_DIR




let socket = new jsonSocket(new net.Socket())

socket.connect(TCP_SERVER_PORT, TCP_SERVER_HOST);

socket.on('connect', function() { 
     
     socket.sendMessage({name: 'client1'})
     
     socket.on('message', function(message) {

         console.log(message.greeting)

         if(message.action === 'create' 
         	|| message.action === 'update' 
         	|| message.action === 'delete' ){
         	
         	console.log('http://localhost:8000' + message.path)

         	let options = {
         		host:HTTP_SERVER_HOST,
         		path:message.path,
         		port: HTTP_SERVER_PORT,
  				  method: 'GET',
            //headers: {'accept': 'application/x-gtar'}
			     }

          //let file = fs.createWriteStream("file1.zip")
          //let request = http.get(options, function(response) {
           //   response.pipe(file);
          //})

   		 	 http.request(options, callback).end();
   		 	 //http.request(options, 'http://localhost:8000/').pipe(fs.createWriteStream(ROOT_DIR_CLIENT))

         }
         	
     })
	
})


function callback (response) {
  var str = ''

  //another chunk of data has been recieved, so append it to `str`
  response.on('data', function (chunk) {
    str += chunk
  });

  //the whole response has been recieved, so we just print it out here
  response.on('end', function () {
    console.log(str)

    fs.writeFile(`${ROOT_DIR_CLIENT}test1.txt`, str, 'binary', function(err){
            if (err) throw err
            console.log('File saved.')
    })

  })
}




