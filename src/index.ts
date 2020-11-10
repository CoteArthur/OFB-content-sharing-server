import * as express from 'express';
import * as cors from 'cors';
import * as path from 'path';
import HomeRoute from './routes/home';

import * as greenlockExpress from 'greenlock-express';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10MB' }));
app.use('/files', express.static('files'));
app.use(express.static(path.join(__dirname, '../../build')));

greenlockExpress.init({
    packageRoot: path.join(__dirname, '..'),
    configDir: "./greenlock.d",
    maintainerEmail: "application.partage.ofb@gmail.com",
    cluster: false
}).serve(app);

const port = 443;
app.listen(port, () => console.log(`Server listening on port: ${port}`));

new HomeRoute(app);
