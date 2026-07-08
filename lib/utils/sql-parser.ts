export interface ParsedColumn {
  name: string;
  dataType: string;
  isPrimaryKey?: boolean;
  foreignKey?: {
    targetTable: string;
    targetColumn: string;
  };
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

      // Parse table-level primary key constraint
      // e.g. PRIMARY KEY (id)
      const pkMatch = line.match(/^PRIMARY\s+KEY\s*\(\s*([^\)]+)\s*\)/i) || 
                      line.match(/^CONSTRAINT\s+[^\s]+\s+PRIMARY\s+KEY\s*\(\s*([^\)]+)\s*\)/i);
      if (pkMatch && currentTable) {
        const pkCols = pkMatch[1].split(',').map(c => c.trim().replace(/[\[\]"`]/g, ""));
        pkCols.forEach(pkCol => {
          const col = currentTable!.columns.find(c => c.name === pkCol);
          if (col) col.isPrimaryKey = true;
        });
        continue;
      }

      // Parse table-level foreign key constraint
      // e.g. FOREIGN KEY (user_id) REFERENCES users(id)
      // or CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
      const fkMatch = line.match(/FOREIGN\s+KEY\s*\(\s*([^\)]+)\s*\)\s*REFERENCES\s+([^\(]+)\s*\(\s*([^\)]+)\s*\)/i);
      if (fkMatch && currentTable) {
        const fkCol = fkMatch[1].trim().replace(/[\[\]"`]/g, "");
        const targetTable = fkMatch[2].trim().replace(/[\[\]"`]/g, "");
        const targetCol = fkMatch[3].trim().replace(/[\[\]"`]/g, "");
        
        const col = currentTable.columns.find(c => c.name === fkCol);
        if (col) {
          col.foreignKey = { targetTable, targetColumn: targetCol };
        }
        continue;
      }

      // Ignore other standard constraint lines or GO
      if (
        line.toUpperCase().startsWith('CONSTRAINT') ||
        line.toUpperCase().startsWith('UNIQUE') ||
        line.toUpperCase().startsWith('GO')
      ) {
        continue;
      }

      // Ignore lines that are just parentheses or index directions (ASC/DESC)
      if (line.match(/^[\(\)]$/) || line.match(/^[\[\]`"a-zA-Z0-9_]+\s+(ASC|DESC)$/i)) {
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

        // Check for inline PRIMARY KEY
        const isPrimaryKey = line.toUpperCase().includes('PRIMARY KEY');
        
        // Check for inline FOREIGN KEY
        // e.g. user_id INT REFERENCES users(id)
        let foreignKey = undefined;
        const inlineFkMatch = line.match(/REFERENCES\s+([^\(]+)\s*\(\s*([^\)]+)\s*\)/i);
        if (inlineFkMatch) {
          foreignKey = {
            targetTable: inlineFkMatch[1].trim().replace(/[\[\]"`]/g, ""),
            targetColumn: inlineFkMatch[2].trim().replace(/[\[\]"`]/g, "")
          };
        }

        currentTable.columns.push({
          name: colName,
          dataType: dataType,
          ...(isPrimaryKey && { isPrimaryKey: true }),
          ...(foreignKey && { foreignKey }),
        });
      }
    }
  }

  // Post-process to find ALTER TABLE foreign keys (often spanning multiple lines)
  // e.g. ALTER TABLE [dbo].[add_city] ADD CONSTRAINT [FK_...] FOREIGN KEY([country_code]) REFERENCES [dbo].[add_country] ([code])
  const alterFkRegex = /ALTER\s+TABLE\s+([^\s]+)[\s\S]*?FOREIGN\s+KEY\s*\(\s*([^\)]+)\s*\)\s*REFERENCES\s+([^\(]+)\s*\(\s*([^\)]+)\s*\)/gi;
  let match;
  while ((match = alterFkRegex.exec(cleanSql)) !== null) {
    const tableName = match[1].replace(/[\[\]"`]/g, "");
    const fkCol = match[2].trim().replace(/[\[\]"`]/g, "");
    const targetTable = match[3].trim().replace(/[\[\]"`]/g, "");
    const targetCol = match[4].trim().replace(/[\[\]"`]/g, "");

    // The stored table name might have 'dbo.' while the alter table might not, or vice versa.
    // Try exact match first, or endsWith match.
    const table = tables.find(t => t.name === tableName || t.name.endsWith(`.${tableName}`) || tableName.endsWith(`.${t.name}`));
    if (table) {
      const col = table.columns.find(c => c.name === fkCol);
      if (col) {
        col.foreignKey = { targetTable, targetColumn: targetCol };
      }
    }
  }

  return tables;
}
