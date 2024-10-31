# CareView API

Esta é a API para o projeto **CareView**, uma solução para monitoramento de sensores em máquinas hospitalares na área neonatal. Esta API foi desenvolvida usando **Node.js**, **Express**, e **SQLite3** e possui autenticação JWT e documentação Swagger.

## Índice

- [Tecnologias](#tecnologias)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Endpoints](#endpoints)
- [Uso do Socket.IO](#uso-do-socketio)
- [Swagger](#swagger)
- [Contribuição](#contribuição)
- [Licença](#licença)

## Tecnologias

- Node.js
- Express
- SQLite3
- bcrypt para criptografia de senhas
- JWT para autenticação
- Swagger para documentação da API
- Socket.IO para comunicação em tempo real

## Instalação

Clone o repositório e instale as dependências.

```bash
# Clone o repositório
git clone https://github.com/le0nardomartins/careview-api.git

# Navegue até a pasta do projeto
cd careview-api

# Instale as dependências
npm install
```

## Configuração

Crie um arquivo `.env` na raiz do projeto e adicione as variáveis de ambiente necessárias:

```plaintext
PORT=4000
SECRET_KEY=suaChaveSecreta
```

O `SECRET_KEY` é utilizado para gerar tokens JWT.

## Executando o servidor

Após configurar as variáveis de ambiente, inicie o servidor com:

```bash
npm start
```

O servidor estará disponível em `http://localhost:4000` e a documentação Swagger em `http://localhost:4000/api-docs`.

## Endpoints

### Autenticação

#### Registrar Usuário

**POST** `/register`

- **Descrição**: Cadastra um novo usuário.
- **Body**:

  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```

- **Respostas**:
  - `201`: Usuário cadastrado com sucesso
  - `400`: Usuário já existe ou parâmetros inválidos
  - `500`: Erro no servidor

#### Login

**POST** `/login`

- **Descrição**: Autentica um usuário e retorna um token JWT.
- **Body**:

  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```

- **Respostas**:
  - `200`: Login bem-sucedido com token JWT
  - `400`: Usuário ou senha incorretos

### Dados dos Sensores

#### Listar Dados dos Sensores

**GET** `/dados-sensores`

- **Descrição**: Retorna todos os dados dos sensores.
- **Headers**:
  - `Authorization: Bearer <token>`

- **Respostas**:
  - `200`: Retorna um array com os dados dos sensores
  - `401`: Token JWT não fornecido
  - `403`: Acesso negado

## Uso do Socket.IO

A aplicação também utiliza Socket.IO para comunicação em tempo real. Para configurar e usar sockets, consulte a [documentação do Socket.IO](https://socket.io/).

## Swagger

A documentação da API é gerada com o Swagger e está disponível em:

[http://localhost:4000/api-docs](http://localhost:4000/api-docs)

Os esquemas dos endpoints são definidos no formato OpenAPI 3.0.