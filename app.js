'use strict';
const Hapi = require('hapi');
const Queue = require('bee-queue');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Counter = require('./model/Counter');
dotenv.config();


///database connection/////////
mongoose
  .connect(
    process.env.DB_CONNECT_URL,
    { useNewUrlParser: true }
  )
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));


  try {
    var counterQueue = new Queue('increaseCounter', {
      redis: {
        host: process.env.REDIS_URL
      },
      isWorker: true
    });
    
  } catch (error) {
    
  }

var server;
const init = async () => {

  server = Hapi.server({
    port: 4000,
    host: '0.0.0.0'
  });

  await server.start();
  console.log('Server running on %s', server.info.uri);
};

init();


var job;

/////post end point///
server.route({
  method: 'POST',
  path: '/counter',
  handler: async function (request, h) {

    var thread = request.payload.threadId;
    var prevCount;
    const prevData = await Counter.find({ threadId: thread });
    const counter = new Counter({
      threadId: thread,
      count: "1"
    });
    if (prevData.length < 1) {
      const save = await counter.save();
    }
    else {
      prevCount = prevData[0].count;
      console.log(prevCount);

   

    job = counterQueue.createJob({ threadId: thread, count: prevCount });
    job
      .timeout(3000)
      .retries(2)
      .save()
      .then((job) => {
        // job enqueued, job.id populated
        console.log("job created" + job.id);

      });


    counterQueue.process(async (job, _result) => {
      console.log(`Processing job ${job.id}`);
      var currentCount = (parseInt(job.data.count) + 1)
      console.log(job.data.count);
      return currentCount;
    });

    counterQueue.on('succeeded', async (job, result) => {
      try {
        const data = await Counter.findOneAndUpdate({ threadId: job.data.threadId }, { count: result });
        console.log(data);


      } catch (error) {
        console.log(error);

      }
      console.log(`Job ${job.id} succeeded with count : ${result}` + `with thread id: ${job.data.threadId}`);
    });
  }
    return ("succeed");

  }
});







// counterQueue.getJob(2)
//  .then((job) => console.log(`Job 3 has status ${job.status}`+job.id));