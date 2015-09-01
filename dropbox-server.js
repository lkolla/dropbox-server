//DropBox  


//Define all the required third-party modules
let express = require('express')
let morgan = require('morgan')
let nodeify = require('bluebird-nodeify')
let path = require('pn/path')
let fs = require('fs')
let mime = require('mime-types')
let rimraf = require('rimraf')
let mkdirp = require('mkdirp')

require('songbird')

const DROPBOX_EVN = process.env.DROPBOX_ENV
const PORT = process.env.DROPBOX_HTTP_PORT
//const ROOT_DIR = process.env.ROOT_DIR
const ROOT_DIR = path.resolve(process.cwd())

//console.log(process.env)
console.log('DropBox running in ' + DROPBOX_EVN + ' mode.')
console.log('DropBox running on ' + PORT + ' port.')
console.log('DropBox control the directory:' + ROOT_DIR)

let app = express()

if(DROPBOX_EVN === 'development'){
	app.use(morgan('dev'))
}

app.listen(PORT, () => console.log(`LISTENING @ http://localhost:${PORT}/`))

app.get('*', setFilePath, setIfBadRequest, setHeaders, (req, res) => {

	//console.log(req.params.type)

	if(req.params.type === 'DIR'){
		res.json(res.body)
		return
	}

	
	fs.createReadStream(req.filePath).pipe(res)		
})

app.head('*', setFilePath, setIfBadRequest, setHeaders, (req, res) => res.end())

app.delete('*', setFilePath, setIfBadRequest, (req, res, next) => {

	async ()=> {

		if(req.stat.isDirectory()){
			await rimraf.promise(req.filePath)
		}else{
			fs.promise.unlink(req.filePath)
		}
		res.status(200).send(req.filePath + ' Successfully Deleted')
		res.end()
	}().catch(next)
})

app.put('*', setFilePath, checkGivenPathExists,  setDirectoryDetails, (req, res, next) => {

	async () =>{

		console.log(req.dirPath)

		await mkdirp.promise(req.dirPath)

		console.log(req.isDir)

		if(!req.isDir){
			req.pipe(fs.createWriteStream(req.filePath))
		}

		res.status(200).send('File / Directory added Successfully')
		res.end()

	}().catch(next)
})

app.post('*', setFilePath, setIfBadRequest, setDirectoryDetails, (req, res, next) => {

	async () =>{

		if(req.isDir){
			return res.status(405).send('Directory can not update')
		}

		await fs.promise.truncate(req.filePath, 0)
		req.pipe(fs.createWriteStream(req.filePath))

		res.status(200).send('File / Directory updated Successfully')
		res.end()

	}().catch(next)
})

function checkGivenPathExists(req, res, next){

	//Check if the requested directory exists in system.
	//If yes, then return 405
	if(req.stat){
		return res.status(405).send('File / Directory already exists')
	}

	next()
}

function setDirectoryDetails(req, res, next){

	let endWithSlash = req.filePath.charAt(req.filePath.length - 1) === path.sep
	let isFile = path.extname(req.filePath) !== ''

	req.isDir = endWithSlash || !isFile
	req.dirPath = req.isDir ? req.filePath : path.dirname(req.filePath)

	next()
}


function setIfBadRequest(req, res, next){

	console.log(req.stat)

	if(!req.stat){
		//Given request is invalid..
		res.status(400).send('Invalid Request')
		res.end()
		return
	}

	next()

}

function setFilePath(req, res, next) {

	//console.log(req.url)
	req.filePath = path.resolve(path.join(ROOT_DIR, req.url))
	//console.log(req.filePath)
	if(req.filePath.indexOf(ROOT_DIR) !== 0){
		res.send(400, 'Invalid request')
		req.params.type='400'
		return
	}

	fs.promise.stat(req.filePath)
		.then(stat => req.stat = stat, () => req.stat = null)
		.nodeify(next)

}

function setHeaders(req, res, next){

	nodeify(async () => {

	if(req.stat.isDirectory()){
		let files = await fs.promise.readdir(req.filePath)
		res.body = JSON.stringify(files)
		res.setHeader('Content-Length', res.body.length)
		res.setHeader('Content-Type', 'application/json')	
		req.params.type='DIR'
		return
	}

	req.params.type='FILE'
	res.setHeader('Content-Length', req.stat.size)
	let mimeType = mime.contentType(path.extname(req.filePath))
	res.setHeader('Content-Type', mimeType)
	
	return
	}(), next)

}
