import * as express from 'express';
import * as cors from 'cors';
import HomeRoute from './routes/home';
import * as path from 'path';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10MB' }));
app.use('/files', express.static('files'));
app.use(express.static(path.join(__dirname, '../../build')));


const port = process.env.PORT || 25565;
app.listen(port, () => console.log(`Server listening on port: ${port}`));


new HomeRoute(app);
