/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import ExcelJS from 'exceljs';
import { DatabaseState, RecordType, Secretaria } from './src/types.js';

const app = express();
const PORT = 3000;

// Path to persistent data
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure database file and directory exist with default blank schemas
function initDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initialState: DatabaseState = {
      admissoes: [],
      demissoes: [],
      faltas: [],
      ferias: [],
      lotacoes: [],
      horasExtras: [],
      ajudasCusto: [],
      gratificacoes: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialState, null, 2), 'utf-8');
    console.log('Database initialized successfully at:', DB_FILE);
  }
}

// Read database
function readDatabase(): DatabaseState {
  try {
    initDatabase();
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Failed to read database, returning empty state:', error);
    return {
      admissoes: [],
      demissoes: [],
      faltas: [],
      ferias: [],
      lotacoes: [],
      horasExtras: [],
      ajudasCusto: [],
      gratificacoes: []
    };
  }
}

// Write database
function writeDatabase(data: DatabaseState) {
  try {
    initDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write database:', error);
  }
}

// Express body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rule check helper: Decreto 409/2026 Art 1º (Deadline: Day 10 at 23:59)
function checkPrazoCorte() {
  const currentDate = new Date();
  const day = currentDate.getDate();
  
  // Se o dia atual for maior que 10, o registro está fora do prazo regulamentar.
  // Note: Para fins de controle rigoroso de 23:59h, qualquer dia após o dia 10 (ou seja, dia 11 adiante) é fora do prazo.
  const isForaDoPrazo = day > 10;
  
  return {
    isForaDoPrazo,
    diaAtual: day,
    dataServidor: currentDate.toISOString(),
    mesVigente: currentDate.toLocaleString('pt-BR', { month: 'long' }).toUpperCase(),
    anoVigente: currentDate.getFullYear()
  };
}

// API: Get Database and Rule context
app.get('/api/records', (req, res) => {
  const db = readDatabase();
  const ruleContext = checkPrazoCorte();
  res.json({ db, ruleContext });
});

// API: Submit a record
app.post('/api/records/:type', (req, res) => {
  const type = req.params.type as RecordType;
  const newRecord = req.body;
  
  const db = readDatabase();
  if (!db[type]) {
    res.status(400).json({ error: `Quadro de movimentação inválido: ${type}` });
    return;
  }
  
  const rule = checkPrazoCorte();
  
  // Inject metadata
  const recordWithMeta = {
    ...newRecord,
    id: newRecord.id || 'rec_' + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    foraDoPrazo: rule.isForaDoPrazo // Safe storage flag indicating deadline status
  };
  
  db[type].push(recordWithMeta as any);
  writeDatabase(db);
  
  res.json({
    success: true,
    record: recordWithMeta,
    foraDoPrazo: rule.isForaDoPrazo,
    message: rule.isForaDoPrazo 
      ? 'Atenção: Registro fora do prazo regulamentar. Esta movimentação será processada apenas na folha de pagamento do mês subsequente, conforme Art. 3º do Decreto 409/2026.'
      : 'Registro inserido com sucesso dentro do prazo regulamentar.'
  });
});

// API: Delete a record
app.delete('/api/records/:type/:id', (req, res) => {
  const type = req.params.type as RecordType;
  const id = req.params.id;
  
  const db = readDatabase();
  if (!db[type]) {
    res.status(400).json({ error: 'Quadro inválido' });
    return;
  }
  
  const initialLength = db[type].length;
  db[type] = db[type].filter((r: any) => r.id !== id) as any;
  
  if (db[type].length === initialLength) {
    res.status(404).json({ error: 'Registro não encontrado' });
    return;
  }
  
  writeDatabase(db);
  res.json({ success: true, message: 'Registro removido com sucesso.' });
});

// Helper formatted dates
const getFormattedDateString = (isoString?: string) => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('pt-BR');
  } catch {
    return isoString;
  }
};

// HELPER FOR EXCEL CONVERSION (MONETARY VALUES)
function formatCurrency(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  const cleaned = String(val).replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// API: Export database to structured multi-tab XLSX utilizing exceljs
app.get('/api/export', async (req, res) => {
  const targetSecretaria = req.query.secretaria as Secretaria | undefined;
  const db = readDatabase();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema de Movimentação PM Rosário';
  workbook.lastModifiedBy = 'PM Rosário MA';
  workbook.created = new Date();
  
  // Configured columns structure for the 8 sheets mapping fields and human labels
  const sheetsConfig: { 
    type: RecordType; 
    name: string; 
    headers: string[]; 
    keys: string[];
    monetaryKeys?: string[];
  }[] = [
    {
      type: 'admissoes',
      name: '1. Admissões',
      headers: ['Matrícula', 'Nome Completo', 'CPF', 'Data Admissão', 'Vínculo', 'Cargo', 'Subsídio/Salário', 'Carga Horária', 'Observações', 'Registrado em', 'Fora do Prazo?'],
      keys: ['matricula', 'nomeCompleto', 'cpf', 'dataAdmissao', 'vinculo', 'cargo', 'subsidio', 'cargaHoraria', 'observacoes', 'timestamp', 'foraDoPrazo'],
      monetaryKeys: ['subsidio']
    },
    {
      type: 'demissoes',
      name: '2. Demissões',
      headers: ['Matrícula', 'Nome Completo', 'Vínculo', 'Cargo', 'Data Desligamento', 'Motivo', 'Portaria/Processo', 'Observações', 'Registrado em', 'Fora do Prazo?'],
      keys: ['matricula', 'nomeCompleto', 'vinculo', 'cargo', 'dataDesligamento', 'motivo', 'portaria', 'observacoes', 'timestamp', 'foraDoPrazo']
    },
    {
      type: 'faltas',
      name: '3. Faltas e Afast.",',
      headers: ['Matrícula', 'Nome Completo', 'Vínculo', 'Tipo Ocorrência', 'Data Início', 'Data Término', 'Dias/Horas', 'Motivo/CID', 'Justificado', 'Descontar', 'Registrado em', 'Fora do Prazo?'],
      keys: ['matricula', 'nomeCompleto', 'vinculo', 'tipoOcorrencia', 'dataInicio', 'dataTermino', 'quantidadeDias', 'motivoCid', 'justificado', 'descontar', 'timestamp', 'foraDoPrazo']
    },
    {
      type: 'ferias',
      name: '4. Férias',
      headers: ['Matrícula', 'Nome Completo', 'Vínculo', 'Período Aquisitivo', 'Data Início', 'Data Término', 'Dias Gozo', 'Abono Pecuniário', 'Adiant. 13º', 'Registrado em', 'Fora do Prazo?'],
      keys: ['matricula', 'nomeCompleto', 'vinculo', 'periodoAquisitivo', 'dataInicio', 'dataTermino', 'diasGozo', 'abonoPecuniario', 'adiantamentoDecimoTerceiro', 'timestamp', 'foraDoPrazo']
    },
    {
      type: 'lotacoes',
      name: '5. Lotacões',
      headers: ['Matrícula', 'Nome Completo', 'Vínculo', 'Lotação Ant.', 'Nova Lotação', 'Cargo Atual', 'Novo Cargo', 'Data Vigência', 'Portaria', 'Registrado em', 'Fora do Prazo?'],
      keys: ['matricula', 'nomeCompleto', 'vinculo', 'lotacaoAnterior', 'novaLotacao', 'cargoAtual', 'novoCargo', 'dataVigencia', 'portaria', 'timestamp', 'foraDoPrazo']
    },
    {
      type: 'horasExtras',
      name: '6. Horas Extras',
      headers: ['Matrícula', 'Nome Completo', 'Vínculo', 'Competência', 'HE 50%', 'HE 100%', 'Adic. Noturno', 'Autorizado por', 'Justificativa', 'Registrado em', 'Fora do Prazo?'],
      keys: ['matricula', 'nomeCompleto', 'vinculo', 'competencia', 'he50', 'he100', 'horasNoturnas', 'autorizadoPor', 'justificativa', 'timestamp', 'foraDoPrazo']
    },
    {
      type: 'ajudasCusto',
      name: '7. Ajudas de Custo',
      headers: ['Matrícula', 'Nome Completo', 'Vínculo', 'Tipo', 'Valor', 'Competência', 'Forma Pagamento', 'Proc. Administrativo', 'Finalidade', 'Registrado em', 'Fora do Prazo?'],
      keys: ['matricula', 'nomeCompleto', 'vinculo', 'tipo', 'valor', 'competencia', 'formaPagamento', 'processoAdministrativo', 'finalidade', 'timestamp', 'foraDoPrazo'],
      monetaryKeys: ['valor']
    },
    {
      type: 'gratificacoes',
      name: '8. Gratificações',
      headers: ['Matrícula', 'Nome Completo', 'Vínculo', 'Tipo Gratificação', 'Valor ou %', 'Natureza', 'Data Início', 'Base Legal', 'Motivo', 'Registrado em', 'Fora do Prazo?'],
      keys: ['matricula', 'nomeCompleto', 'vinculo', 'tipoGratificacao', 'valorOrPercentual', 'natureza', 'dataInicio', 'baseLegal', 'motivo', 'timestamp', 'foraDoPrazo']
    }
  ];

  sheetsConfig.forEach((cfg) => {
    // Check records belonging to the selected sheet
    let records: any[] = db[cfg.type] || [];
    
    // Apply filtering by Secretaria if parameter is provided
    if (targetSecretaria) {
      records = records.filter((r) => r.secretaria === targetSecretaria);
    }

    const sheetNameCleaned = cfg.name.substring(0, 31); // max sheet length is 31
    const ws = workbook.addWorksheet(sheetNameCleaned, {
      views: [{ showGridLines: true }]
    });

    // 1. Title Header of Prefeitura
    ws.mergeCells('A1', 'K1');
    const titleCell1 = ws.getCell('A1');
    titleCell1.value = 'PREFEITURA MUNICIPAL DE ROSÁRIO - MA';
    titleCell1.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell1.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell1.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' } // Deep Navy Blue
    };
    ws.getRow(1).height = 36;

    // Subtitle
    ws.mergeCells('A2', 'K2');
    const titleCell2 = ws.getCell('A2');
    titleCell2.value = `SISTEMA DE ALIMENTAÇÃO DE MOVIMENTAÇÃO DE PESSOAL — DECRETO Nº 409/2026`;
    titleCell2.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF334155' } };
    titleCell2.alignment = { vertical: 'middle', horizontal: 'center' };
    ws.getRow(2).height = 20;

    // Details info about Quadro and Secretary
    ws.mergeCells('A3', 'K3');
    const titleCell3 = ws.getCell('A3');
    titleCell3.value = `QUADRO REGULAMENTAR: ${cfg.name.toUpperCase()}  |  SECRETARIA: ${targetSecretaria || 'TODAS AS SECRETARIAS REUNIDAS'}`;
    titleCell3.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF475569' } };
    titleCell3.alignment = { vertical: 'middle', horizontal: 'center' };
    ws.getRow(3).height = 20;

    // Date/Subtitle parameters
    ws.mergeCells('A4', 'K4');
    const titleCell4 = ws.getCell('A4');
    titleCell4.value = `Relatório gerado em: ${new Date().toLocaleString('pt-BR')}  -  Prazo de Corte Mensal: Dia 10`;
    titleCell4.font = { name: 'Arial', size: 8, italic: true, color: { argb: 'FF64748B' } };
    titleCell4.alignment = { vertical: 'middle', horizontal: 'center' };
    ws.getRow(4).height = 18;

    // Space Row 5
    ws.getRow(5).height = 12;

    // 2. Build Tabled Header Row (Row 6)
    const headerRowNumber = 6;
    const headerRow = ws.getRow(headerRowNumber);
    headerRow.height = 26;

    cfg.headers.forEach((h, colIndex) => {
      const cell = headerRow.getCell(colIndex + 1);
      cell.value = h;
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF475569' } // Dark Slate Blue
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF94A3B8' } },
        bottom: { style: 'medium', color: { argb: 'FF1E293B' } },
        left: { style: 'thin', color: { argb: 'FF94A3B8' } },
        right: { style: 'thin', color: { argb: 'FF94A3B8' } }
      };
    });

    // 3. Render Data rows starting at Row 7
    let currentRowIdx = 7;
    records.forEach((record: any, idx) => {
      const r = ws.getRow(currentRowIdx);
      r.height = 22;
      const isEven = idx % 2 === 0;

      cfg.keys.forEach((key, colIndex) => {
        const cell = r.getCell(colIndex + 1);
        let val = record[key];

        // Format transformations
        if (val === true || val === 'Sim') {
          val = 'SIM';
        } else if (val === false || val === 'Não') {
          val = 'NÃO';
        }

        // Apply string dates prettifier
        if (key.toLowerCase().includes('data') || key === 'timestamp') {
          val = getFormattedDateString(val);
        }

        // Apply formatting rules
        if (cfg.monetaryKeys?.includes(key)) {
          // Format numeric values
          const numValue = formatCurrency(val);
          cell.value = numValue;
          cell.numFmt = '"R$ "#,##0.00';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        } else if (typeof val === 'number') {
          cell.value = val;
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else {
          cell.value = val !== undefined && val !== null ? String(val) : '';
          cell.alignment = { 
            vertical: 'middle', 
            horizontal: (key === 'nomeCompleto' || key === 'observacoes' || key === 'motivo' || key === 'justificativa') ? 'left' : 'center'
          };
        }

        // Formatting text and colors
        cell.font = { name: 'Arial', size: 9, color: { argb: 'FF000000' } };
        
        // Mark Fora do Prazo cells red
        if (key === 'foraDoPrazo' && record[key]) {
          cell.value = 'SIM (FORA DO PRAZO)';
          cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF991B1B' } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FEE2E2' } // Light red alert background
          };
        } else {
          // Zebra stripe styling
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF8FAFC' } // White / Very Light Slate Blue
          };
        }

        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      });

      currentRowIdx++;
    });

    // If empty data row
    if (records.length === 0) {
      const r = ws.getRow(currentRowIdx);
      r.height = 28;
      ws.mergeCells(`A${currentRowIdx}`, `K${currentRowIdx}`);
      const emptyCell = r.getCell(1);
      emptyCell.value = 'Nenhum registro inserido para este lote de movimentações de pessoal no período.';
      emptyCell.alignment = { vertical: 'middle', horizontal: 'center' };
      emptyCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF94A3B8' } };
      emptyCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFBFBFE' }
      };
      
      // Fine outer border
      for (let col = 1; col <= 11; col++) {
        r.getCell(col).border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      }
      currentRowIdx++;
    }

    // Space before signatures
    currentRowIdx += 2;

    // 4. ADD THREE COLUMNS FOR OFFICIAL SIGNATURES
    const sigLineRow = currentRowIdx;
    const sigTitleRow = currentRowIdx + 1;
    const sigSubRow = currentRowIdx + 2;

    ws.getRow(sigLineRow).height = 18;
    ws.getRow(sigTitleRow).height = 16;
    ws.getRow(sigSubRow).height = 14;

    // Signature 1: Solicitante (Secretário/Diretor)
    ws.mergeCells(`A${sigLineRow}`, `C${sigLineRow}`);
    const s1L = ws.getCell(`A${sigLineRow}`);
    s1L.value = '_____________________________________________';
    s1L.alignment = { horizontal: 'center' };
    s1L.font = { name: 'Arial', size: 9, color: { argb: 'FF475569' } };

    ws.mergeCells(`A${sigTitleRow}`, `C${sigTitleRow}`);
    const s1T = ws.getCell(`A${sigTitleRow}`);
    s1T.value = 'Responsável pelo Envio';
    s1T.alignment = { horizontal: 'center' };
    s1T.font = { name: 'Arial', size: 9, bold: true };

    ws.mergeCells(`A${sigSubRow}`, `C${sigSubRow}`);
    const s1S = ws.getCell(`A${sigSubRow}`);
    s1S.value = targetSecretaria ? `Secretaria de ${targetSecretaria}` : 'Secretaria Solicitante';
    s1S.alignment = { horizontal: 'center' };
    s1S.font = { name: 'Arial', size: 8, italic: true };

    // Signature 2: Controller / Homologação de RH
    ws.mergeCells(`E${sigLineRow}`, `G${sigLineRow}`);
    const s2L = ws.getCell(`E${sigLineRow}`);
    s2L.value = '_____________________________________________';
    s2L.alignment = { horizontal: 'center' };
    s2L.font = { name: 'Arial', size: 9, color: { argb: 'FF475569' } };

    ws.mergeCells(`E${sigTitleRow}`, `G${sigTitleRow}`);
    const s2T = ws.getCell(`E${sigTitleRow}`);
    s2T.value = 'Setor de Recursos Humanos';
    s2T.alignment = { horizontal: 'center' };
    s2T.font = { name: 'Arial', size: 9, bold: true };

    ws.mergeCells(`E${sigSubRow}`, `G${sigSubRow}`);
    const s2S = ws.getCell(`E${sigSubRow}`);
    s2S.value = 'Diretoria de Recursos Humanos - PMR';
    s2S.alignment = { horizontal: 'center' };
    s2S.font = { name: 'Arial', size: 8, italic: true };

    // Signature 3: Auditor Geral / Secretário Geral de Adm
    ws.mergeCells(`I${sigLineRow}`, `K${sigLineRow}`);
    const s3L = ws.getCell(`I${sigLineRow}`);
    s3L.value = '_____________________________________________';
    s3L.alignment = { horizontal: 'center' };
    s3L.font = { name: 'Arial', size: 9, color: { argb: 'FF475569' } };

    ws.mergeCells(`I${sigTitleRow}`, `K${sigTitleRow}`);
    const s3T = ws.getCell(`I${sigTitleRow}`);
    s3T.value = 'Controle Interno Municipal';
    s3T.alignment = { horizontal: 'center' };
    s3T.font = { name: 'Arial', size: 9, bold: true };

    ws.mergeCells(`I${sigSubRow}`, `K${sigSubRow}`);
    const s3S = ws.getCell(`I${sigSubRow}`);
    s3S.value = 'Visto Auditoria / Decreto 409/2026';
    s3S.alignment = { horizontal: 'center' };
    s3S.font = { name: 'Arial', size: 8, italic: true };

    // Auto-adjust column widths based on contents and padding
    cfg.keys.forEach((key, colIdx) => {
      let maxLen = cfg.headers[colIdx].length;
      records.forEach((rec: any) => {
        let val = rec[key];
        if (key === 'foraDoPrazo' && val) val = 'SIM (FORA DO PRAZO)';
        if (key.toLowerCase().includes('data') || key === 'timestamp') val = getFormattedDateString(val);
        const len = val ? String(val).length : 0;
        if (len > maxLen) maxLen = len;
      });
      
      const col = ws.getColumn(colIdx + 1);
      col.width = Math.max(maxLen + 4, 12); // minimum width is 12 columns
    });
  });

  // Export and send
  const tempFileName = `Fechamento_Lote_${targetSecretaria || 'CONSOLIDADO'}_Decreto409.xlsx`;
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(tempFileName)}"`);
  
  await workbook.xlsx.write(res);
  res.end();
});

// Configure Vite middleware in development or express static files in production
async function startServer() {
  initDatabase();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PM Rosário] Server running on http://localhost:${PORT}`);
  });
}

startServer();
