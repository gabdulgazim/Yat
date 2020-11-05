import express from 'express'
import { verify, sign } from 'jsonwebtoken'
import cors from 'cors'
import { json } from 'body-parser'
import { writeFile, readFileSync } from 'fs'
import events from './db/events.json'

const app = express()

app.use(cors())
app.use(json())

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the API.'
  })
})

// MIDDLEWARE
function verifyToken(req, res, next) {
  const bearerHeader = req.headers['authorization']

  if (typeof bearerHeader !== 'undefined') {
    const bearer = bearerHeader.split(' ')
    const bearerToken = bearer[1]
    req.token = bearerToken
    next()
  } else {
    res.sendStatus(401)
  }
}

app.get('/form', verifyToken, (req, res) => {
  verify(req.token, 'the_secret_key', err => {
    if (err) {
      res.sendStatus(401)
    } else {
      res.json({
        events: events
      })
    }
  })
})

app.post('/register', (req, res) => {
  if (req.body) {
    const user = {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password
      // In a production app, you'll want to encrypt the password
    }

    const data = JSON.stringify(user, null, 2)
    const dbUserEmail = require('./db/user.json').email

    if (dbUserEmail === req.body.email) {
      res.sendStatus(400)
    } else {
      writeFile('./db/user.json', data, err => {
        if (err) {
          console.log(err + data)
        } else {
          const token = sign({ user }, 'the_secret_key')
          // In a production app, you'll want the secret key to be an environment variable
          res.json({
            token,
            email: user.email,
            name: user.name
          })
        }
      })
    }
  } else {
    res.sendStatus(400)
  }
})

app.post('/login', (req, res) => {
  const userDB = readFileSync('./db/user.json')
  const userInfo = JSON.parse(userDB)
  if (
    req.body &&
    req.body.email === userInfo.email &&
    req.body.password === userInfo.password
  ) {
    const token = sign({ userInfo }, 'the_secret_key')
    // In a production app, you'll want the secret key to be an environment variable
    res.json({
      token,
      email: userInfo.email,
      name: userInfo.name
    })
  } else {
    res.sendStatus(400)
  }
})

app.listen(3000, () => {
  console.log('Server started on port 3000')
})
