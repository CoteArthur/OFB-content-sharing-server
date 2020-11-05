import { Express } from 'express';
import { homeController } from '../controllers/home';

export default class HomeRoute {
 constructor(app: Express) {
  app.route('/').get(homeController.index);

  app.route('/api/login').post(homeController.login);
  app.route('/api/selectUserInfo').post(homeController.selectUserInfo);

  app.route('/api/createUser').post(homeController.createUser);
  app.route('/api/select').post(homeController.select);
  app.route('/api/insert').post(homeController.insert);
 }
}
