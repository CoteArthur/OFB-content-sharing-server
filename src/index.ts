import * as express from 'express';
import * as cors from 'cors';
import HomeRoute from './routes/home';
import * as path from 'path';

import * as fs from 'fs';
import * as https from 'https';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10MB' }));
app.use('/files', express.static('files'));
app.use(express.static(path.join(__dirname, '../../build')));

const port = 443;
const credentials = {
    key: fs.readFileSync(path.join(__dirname, '../sslcert/selfsigned.key')),
    cert: fs.readFileSync(path.join(__dirname, '../sslcert/selfsigned.crt'))
};
https.createServer(credentials, app).listen(port, () => console.log(`Server listening on port: ${port}`));

new HomeRoute(app);
