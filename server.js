const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;
const SECRET_KEY = process.env.SECRET_KEY || 'testeKey';

// Middleware para logar todas as requisições recebidas e validar JSON
app.use((req, res, next) => {
    console.log(`Recebida requisição ${req.method} em ${req.path}`);
    if ((req.method === 'POST' || req.method === 'PUT') && !req.is('application/json')) {
        return res.status(415).json({ message: 'Content-Type deve ser application/json' });
    }
    next();
});

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    }
});

// Middleware para verificar o token JWT
const authenticateJWT = (req, res, next) => {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    if (token) {
        jwt.verify(token, SECRET_KEY, (err, user) => {
            if (err) return res.status(403).json({ message: 'Acesso negado' });
            req.user = user;
            next();
        });
    } else {
        res.status(401).json({ message: 'Token não fornecido' });
    }
};

const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'API CareView',
            version: '1.0.0',
            description: 'Documentação da API para o projeto CareView',
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
                description: 'Servidor de Desenvolvimento'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: ['./server.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Banco de dados e rotas
const db = new sqlite3.Database('banco-de-dados.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS dados_sensores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sensor_id INTEGER,
        temperatura REAL,
        umidade REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Cadastra um novo usuário
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuário cadastrado com sucesso.
 *       400:
 *         description: Usuário já existe.
 *       500:
 *         description: Erro ao cadastrar usuário.
 */
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username e senha são obrigatórios' });
    
    try {
        db.get('SELECT * FROM usuarios WHERE username = ?', [username], async (err, row) => {
            if (row) return res.status(400).json({ message: 'Usuário já existe' });
            
            const hashedPassword = await bcrypt.hash(password, 10);
            db.run('INSERT INTO usuarios (username, password) VALUES (?, ?)', [username, hashedPassword], (err) => {
                if (err) return res.status(500).json({ message: 'Erro ao cadastrar usuário' });
                res.status(201).json({ message: 'Usuário cadastrado com sucesso' });
            });
        });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao processar o cadastro' });
    }
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Realiza login do usuário
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login realizado com sucesso.
 *       400:
 *         description: Usuário ou senha incorretos.
 */
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username e senha são obrigatórios' });
    }

    db.get('SELECT * FROM usuarios WHERE username = ?', [username], async (err, row) => {
        if (err) return res.status(500).json({ message: 'Erro no servidor' });

        if (!row || !(await bcrypt.compare(password, row.password))) {
            return res.status(400).json({ message: 'Usuário ou senha incorretos' });
        }

        const token = jwt.sign({ userId: row.id }, SECRET_KEY, { expiresIn: '1h' });
        
        res.json({ message: 'Login realizado com sucesso', token });
    });
});

/**
 * @swagger
 * /dados-sensores:
 *   get:
 *     summary: Retorna todos os dados dos sensores
 *     tags: [Sensores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de dados dos sensores.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   sensor_id:
 *                     type: integer
 *                   temperatura:
 *                     type: number
 *                   umidade:
 *                     type: number
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 */
app.get('/dados-sensores', authenticateJWT, (req, res) => {
    db.all(`SELECT * FROM dados_sensores`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao buscar os dados.' });
        }
        res.json(rows);
    });
});

server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`Documentação Swagger disponível em http://localhost:${PORT}/api-docs`);
});
