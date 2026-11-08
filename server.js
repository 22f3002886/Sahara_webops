import express from 'express';
import helmet from 'helmet';
const app = express();
app.use(helmet());
app.use(express.static('public'));
app.listen(process.env.PORT || 3000, '127.0.0.1', () => console.log(`SAHARA: http://localhost:${process.env.PORT || 3000}`));
