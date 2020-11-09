import { Request, Response } from 'express';
import * as mysql from 'mysql';
import config from '../config/config';
import * as fs from 'fs';
import * as shortid from 'shortid';
// import * as path from 'path';
import { nouns } from '../nouns';
import { createTransport } from 'nodemailer';
import { CREDS_USER, CREDS_PASSWORD } from '../config/gmail-credentials';

const connection = mysql.createPool(config.mysql);

const transport = createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        auth: {
                user: CREDS_USER,
                pass: CREDS_PASSWORD,
        },
});

export default class HomeController {
        public index(req: Request, res: Response): void {
                // res.sendFile(path.join(__dirname, 'build', 'index.html'));
                res.json('hello there');
        }

        public login(req: Request, res: Response): void {
                connection.query(`SELECT id FROM users WHERE email = '${req.body.email}' AND password = '${req.body.password}'`,
                (err, results) => {
                        if (err)
                                res.json(err);
                        res.json(results);
                });
        }

        public selectUserInfo(req: Request, res: Response): void {
                connection.query(`SELECT email, admin FROM users WHERE id = '${req.body.id}'`,
                (err, results) => {
                        if (err)
                                res.json(err);
                        res.json(results);
                });
        }

        public createUser(req: Request, res: Response): void {
                connection.query(`SELECT id FROM users WHERE email = '${req.body.email}'`,
                (err, results) => {
                        if (err) res.json(err);

                        if (!(results[0]?.id)) {
                                let password = nouns[Math.floor(Math.random() * Math.floor(nouns.length))]
                                        + Math.floor(Math.random() * Math.floor(100));

                                connection.query(`INSERT INTO users (id, email, password, admin) VALUES (NULL, '${req.body.email}', '${password}', '${req.body.admin ? 1 : 0}');`,
                                (errInsert, resultsInsert) => {
                                        if (errInsert) res.json(errInsert);
                                        console.log(resultsInsert);

                                        const message = {
                                                from: `application.partage.ofb@gmail.com`,
                                                to: `${req.body.email}`,
                                                subject: `Mot de passe pour l'application de partage OFB`,
                                                text: `Mot de passe :\n${password}`,
                                        };

                                        transport.sendMail(message, function(errSendMail, info) {
                                                if (errSendMail) {
                                                        console.log(errSendMail)
                                                } else {
                                                        res.json(true);
                                                }
                                        });
                                });
                        } else {
                                res.json(false);
                        }
                });
        }

        public select(req: Request, res: Response): void {
                let strQuery = `SELECT ${req.body.table}.*, users.email FROM ${req.body.table} LEFT JOIN users ON ${req.body.table}.userID = users.id`;

                if (req.body.filters) {
                        let isFirst = true;
                        let filtersArray = [
                                req.body.filters.auteur,
                                req.body.filters.search,
                                req.body.filters.sites,
                                req.body.filters.themes,
                                req.body.filters.year,
                        ];

                        for (let i = 0; i < filtersArray.length; i++) {
                                if (filtersArray[i]) {
                                        if (isFirst) {
                                                strQuery += ` WHERE`;
                                                isFirst = false;
                                        } else {
                                                strQuery += ` AND`;
                                        }
                                        switch (i) {
                                                case 0:
                                                        let arrayAuteur = req.body.filters.auteur.split(' ');
                                                        strQuery += ` users.email LIKE '%${arrayAuteur[0]}%'`;
                                                        if (arrayAuteur[1])
                                                                strQuery += ` AND users.email LIKE '%${arrayAuteur[1]}%'`;
                                                        break;
                                                case 1:
                                                        strQuery += ` (titre LIKE '%${req.body.filters.search.split(`'`).join(`''`)}%'`;
                                                        if (req.body.table !== 'actualite') {
                                                                let keywords: string[] = req.body.filters.search.split(' ');
                                                                for (let j = 0; j < keywords.length; j++) {
                                                                        strQuery += ` OR keywords like '%${keywords[j].split(`'`).join(`''`)}%'`
                                                                }
                                                        }
                                                        strQuery += `)`;
                                                        break;
                                                case 2:
                                                        strQuery += ` site IN (${req.body.filters.sites})`;
                                                        break;
                                                case 3:
                                                        strQuery += ` theme IN (${req.body.filters.themes})`;
                                                        break;
                                                case 4:
                                                        strQuery += ` YEAR(date) = ${req.body.filters.year}`;
                                                        break;
                                                default:
                                                        break;
                                        }
                                }
                        }

                        if (req.body.filters.orderBy && req.body.filters.desc) {
                                strQuery += ` ORDER BY ${req.body.filters.orderBy} DESC`;
                        } else {
                                strQuery += ` ORDER BY ${req.body.filters.orderBy} ASC`;
                        }
                } else {
                        strQuery += ` ORDER BY date DESC`;
                }

                connection.query(strQuery, (err, results) => {
                        if (err) res.json(err);
                        res.json(results);
                });
        }

        public insert(req: Request, res: Response): void {
                let fileName = shortid.generate();
                let fileType = req.body.file.split('/')[1].split(';')[0];

                fs.writeFile(`./files/${fileName}.${fileType}`, req.body.file.split(';base64,').pop(), {encoding: 'base64'}, (err) => {
                        if (err) console.log(err);
                });

                let strQuery: string;

                req.body.titre = req.body.titre.split(`'`).join(`''`);
                if (req.body.keywords)
                        req.body.keywords = req.body.keywords.split(`'`).join(`''`);

                switch (req.body.type) {
                        case 'actualite': {
                                strQuery = `INSERT INTO actualite (id, titre, site, description, date, userID, file) VALUES (NULL, '${req.body.titre}', '${req.body.site}','${req.body.description.split(`'`).join(`''`)}', current_timestamp(), '${req.body.userID}', '${fileName}.${fileType}')`;
                                break;
                        }
                        case 'presentationsites': {
                                strQuery = `INSERT INTO presentationsites (id, titre, site, theme, file, date, userID) VALUES (NULL, '${req.body.titre}', '${req.body.site}', '${req.body.theme}', '${fileName}.pdf', current_timestamp(), '${req.body.userID}')`;
                                break;
                        }
                        case 'crterrain':
                        case 'crpolice': {
                                strQuery = `INSERT INTO ${req.body.type} (id, titre, site, keywords, file, date, userID) VALUES (NULL, '${req.body.titre}', '${req.body.site}', '${req.body.keywords}', '${fileName}.pdf', current_timestamp(), '${req.body.userID}')`;
                                break;
                        }
                        case 'connaissancesproduites':
                        case 'operationsgestion': {
                                strQuery = `INSERT INTO ${req.body.type} (id, titre, site, theme, keywords, file, date, userID) VALUES (NULL, '${req.body.titre}', '${req.body.site}', '${req.body.theme}', '${req.body.keywords}', '${fileName}.pdf', current_timestamp(), '${req.body.userID}')`;
                                break;
                        }
                        default: {
                                console.log('error');
                                break;
                        }
                }
                connection.query(strQuery,
                (err, results) => {
                        if (err) res.json(err);
                        res.json(results);
                });
        }
}

export const homeController = new HomeController();
