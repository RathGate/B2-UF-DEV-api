import mysql from "mysql";
export function connectToDatabase() {
    const connection = mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT as unknown as number,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWD,
        database: process.env.DB_NAME
    })

    connection.connect(function(err) {
        if (err) {
            console.error('error connecting: ' + err.stack);
            return;
        }
    })

    return connection;
}

export function checkQueryParameters(acceptedParameters: Array<string>, query: any) {
    let correctQuery = [];
    for (const [key, value] of Object.entries(query)) {
        if (acceptedParameters.includes(key)) {
            correctQuery.push({[key]: value});
        }
    }
    return correctQuery;
}

export function buildSqlQuery(baseSql: string, query: Array<any>, whereClauseUsed: boolean = false) {
    if(Object.keys(query).length > 0) {
        whereClauseUsed ? baseSql += " AND " : baseSql += " WHERE ";
        for (const q of query) {
            const key = Object.keys(q);
            const value = Object.values(q);
            baseSql += `${key} = '${value}'`;
            if (query.indexOf(q) !== query.length - 1) baseSql += " AND ";
        }
    }
    return baseSql;
}