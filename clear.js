const sqlite3 = require('sqlite3').verbose();

// Conectar ao banco de dados
const db = new sqlite3.Database('banco-de-dados.db');

// Função para limpar a tabela 'usuarios'
db.serialize(() => {
    db.run('DELETE FROM usuarios', (err) => {
        if (err) {
            console.error('Erro ao apagar dados da tabela usuarios:', err.message);
        } else {
            console.log('Todos os dados da tabela usuarios foram apagados com sucesso.');
        }
    });
});

// Fechar a conexão com o banco de dados
db.close((err) => {
    if (err) {
        console.error('Erro ao fechar a conexão com o banco de dados:', err.message);
    } else {
        console.log('Conexão com o banco de dados fechada.');
    }
});
