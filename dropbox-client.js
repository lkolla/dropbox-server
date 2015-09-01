let fs = require('fs')
let rimraf = require('rimraf')
let mkdirp = require('mkdirp')
let net = require('net')
let jsonSocket = require('json-socket')

const TCP_SERVER_PORT = '8009'
const TCP_SERVER_HOST = 'localhost'

let socket = new jsonSocket(new net.Socket())

socket.connect(TCP_SERVER_PORT, TCP_SERVER_HOST);

socket.on('connect', function() { 
    socket.sendMessage({name: 'client1'})
     socket.on('message', function(message) {
         console.log(message.greeting)
         console.log(message.action)
         console.log(message.path)
         console.log(message.type)
    })
})