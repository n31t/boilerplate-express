import 'dotenv/config';
import express from 'express';
// import connectDB from './db';
import globalRouter from './global-router';
import { correlationMiddleware, logger, requestLogger } from './observability/logger';
import { log } from './observability/logger';
import { config } from './config/config';
import redisConnection from './config/redis';
import cors from 'cors';
const app = express();;

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: "*",
    exposedHeaders: "*",
    credentials: true,
  })
);

app.use(correlationMiddleware);
app.use(requestLogger);
app.use(express.json());
app.use('/api/v1/',globalRouter);


app.get('/',(request,response) =>{
  response.send("Hello World!");
})

app.listen(config.PORT, () => {
  log.info(`Server runs at http://localhost:${config.PORT}`,);
});
