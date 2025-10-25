// Express backend for Next.js static export
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());


const pitchesRouter = require('./routes/pitches');
const ratingsRouter = require('./routes/ratings');
const resultsRouter = require('./routes/results');
const stateRouter = require('./routes/state');
const exportRouter = require('./routes/export');
const feedbackRouter = require('./routes/feedback');
const recapRouter = require('./routes/recap');
const eventRouter = require('./routes/event');

app.use('/api/pitches', pitchesRouter);
app.use('/api/ratings', ratingsRouter);
app.use('/api/results', resultsRouter);
app.use('/api/state', stateRouter);
app.use('/api/export', exportRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/recap', recapRouter);
app.use('/api/event', eventRouter);

app.get('/', (req, res) => {
  res.send('Backend API is running');
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
