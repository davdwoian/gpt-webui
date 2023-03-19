import express from 'express'


const server = express()
const port = 8080

server.get('/api/req', (req, res) => {
    res.send('ok')
})

server.listen(port)

