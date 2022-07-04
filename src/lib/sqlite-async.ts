import * as SQLite from 'expo-sqlite';

export const dbExecute =
  (db: SQLite.WebSQLDatabase) =>
  (sqlStatement: string, args?: (number | string)[]): Promise<SQLite.SQLResultSet> =>
    new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          sqlStatement,
          args,
          (_, res) => resolve(res),
          (_, error) => {
            reject(error);
            return true;
          },
        );
      });
    });
