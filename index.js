const express = require('express');
const fs = require('fs');
const app = express();
const path = require('path');
const PORT = 3000;

app.use(express.json());

const history = [];

const historyFile = path.join(__dirname, 'history.csv');
if (fs.existsSync(historyFile)) {
  const data = fs.readFileSync(historyFile, 'utf-8');
  const lines = data.split('\n');
  lines.forEach(line => {
    const [question, answer] = line.split(',');
    if (question && answer) {
      history.push({ question, answer: parseFloat(answer) });
    }
  });
}

app.get('/', (req, res) => {
  res.sendFile(__dirname+'/index.html');
});

app.get('/history', (req, res) => {
    const formattedHistory = history.map(op => `${op.question} = ${op.answer}`).join('\n');
    res.type('text').send(formattedHistory);
  });
  

app.get('/:params*', (req, res) => {
  const params = req.params.params + (req.params[0] || '');

  const equationParts = params.split('/');
  const equation = equationParts
    .map(part => {
      if (part === 'into') return '*';
      if (part === 'plus') return '+';
      if (part === 'minus') return '-';
      if (part==='by') return '/';
      if (part==='mod') return '%';
      return part;
    })
    .join('');

  console.log('Equation:', equation);

  try {
    const answer = eval(equation);
    const operation = {
      question: equationParts
        .map(part => {
          if (part === 'into') return ' * ';
          if (part === 'plus') return ' + ';
          if (part === 'minus') return ' - ';
          if (part==='by') return '/';
          if (part==='mod') return '%';
          return part;
        })
        .join(''),
      answer: answer
    };

    if (history.length >= 20) {
      history.shift();
    }
    history.push(operation);
    res.json(operation);

    const csvData = history.map(op => `${op.question},${op.answer}`).join('\n');
    fs.writeFileSync(historyFile, csvData, 'utf-8');
  } catch (error) {
    res.status(400).json({ error: 'Invalid equation' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
