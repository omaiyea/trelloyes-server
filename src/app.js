require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const winston = require('winston'); 

const app = express();
const { NODE_ENV } = require('./config');
//use less verbose logging on production
const morganOption = (NODE_ENV === 'production' ? 'tiny' : 'common');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'info.log' })
  ]
});

//use less verbose logging on production
if(NODE_ENV !== 'production'){
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

//sample data for now before database implementation
const cards = [{
  id: 1,
  title: 'Task One',
  content: 'This is card one'
}];
const lists = [{
  id: 1, 
  header: 'List One',
  cardIds: [1]
}];

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());

//use less verbose error messages on prod
app.use(function errorHandler(error, req, res, next){
  let response;
  if (NODE_ENV === 'production'){
    response = { error: { message: 'server error'} };
  } else {
    console.error(error);
    response = { message: error.message, error  };
  }
  res.status(500).json(response);
});

//validate token
app.use(function validateBearerToken(req, res, next) {
  const apiToken = process.env.API_TOKEN;
  const authToken = req.get('Authorization');

  if (!authToken || authToken.split(' ')[1] !== apiToken) {
    logger.error(`Unauthorized request to path: ${req.path}`);
    return res.status(401).json({ error: 'Unauthorized request' })
  }
  // move to the next middleware
  next()
});

/*** endpoints ***/
app.get('/', (req, res) => {
  res.send('Hello, world!');
});

app.get('/card', (req, res) => {
  res.json(cards);
});

app.get('/list', (req, res) => {
  res.json(lists);
});

app.get('/card/:id', (req, res) => {
  const { id } = req.params;
  const card = cards.find(c => c.id == id);

  //validation
  if (!card) {
    logger.error(`Card with id ${id} not found.`);
    return res.status(404).send('Card Not Found');
  }

  res.json(card);
});

app.get('/list/:id', (req, res) => {
  const { id } = req.params;
  const list = lists.find(li => li.id == id);

  //validation
  if (!list) {
    logger.error(`List with id ${id} not found.`);
    return res
      .status(404)
      .send('List Not Found');
  }

  res.json(list);
});

module.exports = app;
