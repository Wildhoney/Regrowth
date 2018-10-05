import path from 'path';
import express from 'express';

const app = express();
const example = path.resolve('./example/public');

app.use(express.static(example));
app.listen(process.env.PORT || 3000);
