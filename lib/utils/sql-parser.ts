export interface ParsedColumn {
  name: string;
  dataType: string;
}

export interface ParsedTable {
  name: string;
  columns: ParsedColumn[];
}

export function parseSqlSchema(sqlContent: string): ParsedTable[] {
  const tables: ParsedTable[] = [];

  // Remove single line comments
  const noComments = sqlContent.replace(/--.*$/gm, "");
  // Remove multi-line comments
  const cleanSql = noComments.replace(/\/\*[\s\S]*?\*\//g, "");

  const lines = cleanSql.split(/\r?\n/).map(l => l.trim());

  let inTable = false;
  let currentTable: ParsedTable | null = null;

  for (const line of lines) {
    if (!line) continue;

    if (!inTable) {
      const match = line.match(/^CREATE\s+TABLE\s+([^\(]+)(?:\s*\()?/i);
      if (match) {
        inTable = true;
        let tableName = match[1].trim();
        tableName = tableName.replace(/[\[\]"`]/g, "");
        currentTable = { name: tableName, columns: [] };
      }
    } else {
      // Check if we reached the end of the table definition
      if (line.startsWith(')') || line.match(/^\)\s*(?:ON|;|GO|$)/i)) {
        inTable = false;
        if (currentTable && currentTable.columns.length > 0) {
          tables.push(currentTable);
        }
        currentTable = null;
        continue;
      }

      // Ignore standard constraint lines or GO
      if (
        line.toUpperCase().startsWith('CONSTRAINT') ||
        line.toUpperCase().startsWith('PRIMARY KEY') ||
        line.toUpperCase().startsWith('FOREIGN KEY') ||
        line.toUpperCase().startsWith('UNIQUE') ||
        line.toUpperCase().startsWith('GO')
      ) {
        continue;
      }

      // Parse column: expected format "[colName] [dataType] ..."
      // Handle optional brackets or quotes around colName
      // Usually first token is col name, second is data type
      const parts = line.match(/^([^\s]+)\s+([^\s]+)/);
      if (parts && currentTable) {
        let colName = parts[1].replace(/[\[\]"`]/g, "");
        let dataType = parts[2];
        
        // Sometimes the column name might have a trailing comma if there is no type (invalid SQL but just in case)
        if (colName.endsWith(',')) colName = colName.slice(0, -1);
        
        // Data type might have a trailing comma or parens like (50)
        if (dataType.endsWith(',')) dataType = dataType.slice(0, -1);

        currentTable.columns.push({
          name: colName,
          dataType: dataType
        });
      }
    }
  }

  return tables;
}
