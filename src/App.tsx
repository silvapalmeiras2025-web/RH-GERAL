/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DatabaseState, LISTA_SECRETARIAS, QUADROS_LIST, RecordType, Secretaria } from './types';
import FormulariosMovimentacao from './components/FormulariosMovimentacao';
import TabelasVisualizacao from './components/TabelasVisualizacao';

export default function App() {
  const [db, setDb] = useState<DatabaseState>({
    admissoes: [],
    demissoes: [],
    faltas: [],
    ferias: [],
    lotacoes: [],
    horasExtras: [],
    ajudasCusto: [],
    gratificacoes: []
  });

  // Mandatory Selected Secretary (restricts insertion and triggers localized views)
  const [selectedSec, setSelectedSec] = useState<Secretaria | ''>(() => {
    const saved = localStorage.getItem('pmr_selected_secretaria');
    return (saved && LISTA_SECRETARIAS.includes(saved as Secretaria)) ? (saved as Secretaria) : '';
  });

  // Selected Active Form Tab (Quadro 1 to 8)
  const [activeQuadro, setActiveQuadro] = useState<RecordType>('admissoes');

  // Mobile sidebar drawer state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Backend rule calendar state checking
  const [ruleContext, setRuleContext] = useState({
    isForaDoPrazo: false,
    diaAtual: 30,
    dataServidor: '',
    mesVigente: 'MAIO',
    anoVigente: 2026
  });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Load database and server timeframe
  const fetchState = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/records');
      if (!res.ok) throw new Error('Erro ao carregar dados do servidor');
      const data = await res.json();
      setDb(data.db);
      setRuleContext(data.ruleContext);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: 'Não foi possível estabelecer contato com a base de dados central: ' + err.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  // Persist selected secretary in local storage
  const handleSecretariaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as Secretaria | '';
    setSelectedSec(val);
    if (val) {
      localStorage.setItem('pmr_selected_secretaria', val);
      setFeedback({
        type: 'success',
        message: `Secretaria de ${val} definida com sucesso. As inserções agora serão vinculadas a este departamento.`
      });
    } else {
      localStorage.removeItem('pmr_selected_secretaria');
    }
  };

  const handleInsertSuccess = (message: string, record: any) => {
    setFeedback({ type: 'success', message });
    // Reload state dynamically
    fetchState();
    
    // Auto clear feedback after 8 seconds
    setTimeout(() => {
      setFeedback(curr => curr?.message === message ? null : curr);
    }, 8000);
  };

  const handleInsertError = (message: string) => {
    setFeedback({ type: 'error', message });
  };

  const handleDeleteSuccess = (type: RecordType, id: string) => {
    setFeedback({
      type: 'success',
      message: 'Registro de movimentação removido com sucesso e excluído da apuração de folha.'
    });
    // Reload state after deletion
    fetchState();
  };

  // Triggers XLSX spreadsheet generation by calling Node backend endpoint
  const handleExportXLSX = (onlyCurrentSec: boolean) => {
    let url = '/api/export';
    if (onlyCurrentSec) {
      if (!selectedSec) {
        setFeedback({
          type: 'error',
          message: 'Selecione sua secretaria no cabeçalho antes de exportar o lote correspondente.'
        });
        return;
      }
      url += `?secretaria=${encodeURIComponent(selectedSec)}`;
    }
    
    setFeedback({
      type: 'success',
      message: `Iniciando compilação do relatório oficial do lote (${onlyCurrentSec ? 'Unidade ' + selectedSec : 'Consolidado Geral'}). O download será iniciado imediatamente.`
    });

    window.open(url, '_blank');
  };

  // Helper to calculate total count for each tab based on selected secretary view
  const getCountForQuadro = (quadroId: RecordType) => {
    const list = db[quadroId] || [];
    if (!selectedSec) return list.length;
    return list.filter((r: any) => r.secretaria === selectedSec).length;
  };

  // Helper to calculate total records in all folders
  const totalMyRecords = Object.keys(db).reduce((acc, currentKey) => {
    const list = db[currentKey as RecordType] || [];
    if (!selectedSec) return acc + list.length;
    return acc + list.filter((r: any) => r.secretaria === selectedSec).length;
  }, 0);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 font-sans antialiased">
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden transition-opacity"
        />
      )}

      {/* LEFT SIDEBAR - SLATE INTERFACE theme */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-slate-900 text-slate-200 flex flex-col shrink-0 border-r border-slate-850 transition-transform duration-350 ease-out md:static md:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-blue-550/10 border border-blue-500/20 flex items-center justify-center p-1.5 shrink-0">
              <svg className="size-full text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 22h20L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 9H13V15H11V9zm0 8H13V18H11V17z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 truncate">Prefeitura de Rosário - MA</div>
              <div className="text-sm font-bold tracking-tight text-white truncate">Recursos Humanos</div>
            </div>
          </div>
          <div className="text-[10px] text-slate-450 bg-slate-950/60 px-2 py-1.5 rounded border border-slate-800/80 leading-relaxed">
            Decreto de Auditoria nº 409/2026
          </div>
        </div>

        {/* Quadro navigation list */}
        <nav id="nav-quadros" className="flex-1 py-4 overflow-y-auto space-y-0.5">
          {QUADROS_LIST.map((quadro, idx) => {
            const isActive = activeQuadro === quadro.id;
            const count = getCountForQuadro(quadro.id);

            return (
              <button
                key={quadro.id}
                onClick={() => {
                  setActiveQuadro(quadro.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full text-left px-5 py-2.5 flex items-center justify-between text-xs transition-colors cursor-pointer border-l-3 ${
                  isActive
                    ? 'bg-slate-800/60 text-white font-bold border-blue-500'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
                }`}
              >
                <span className="truncate pr-2">
                  <span className="font-mono text-slate-500 mr-1">{String(idx + 1).padStart(2, '0')}.</span>
                  {quadro.label.replace(/^\d+\.\s*/, '')}
                </span>
                <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold tracking-tight shrink-0 ${
                  isActive ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer details */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20 text-[10px] text-slate-500 space-y-1">
          <div className="flex justify-between">
            <span>Registros no Lote:</span>
            <span className="font-bold text-slate-350">{totalMyRecords}</span>
          </div>
          <div className="h-px bg-slate-800 my-1"></div>
          <div>© 2026 Gestão Interna Municipal</div>
          <div className="font-mono text-[9px] tracking-wider text-slate-600">v2.4.0-PROD</div>
        </div>
      </aside>

      {/* RIGHT MAIN PANEL */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        
        {/* TOP BAR - High Density Select & User profile */}
        <header className="h-[64px] bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-md text-slate-600 hover:bg-slate-150 cursor-pointer"
              title="Abrir menu"
            >
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Selection element in Topbar */}
            <div className="flex items-center gap-2">
              <label htmlFor="top-select-secretaria" className="text-[10px] font-bold text-slate-450 uppercase tracking-wider hidden sm:inline">
                Unidade Administrativa:
              </label>
              <select
                id="top-select-secretaria"
                value={selectedSec}
                onChange={handleSecretariaChange}
                className="text-xs font-bold rounded-md border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="">-- SELECIONE SUA SECRETARIA COM JURISDIÇÃO --</option>
                {LISTA_SECRETARIAS.map((sec) => (
                  <option key={sec} value={sec}>
                    SECRETARIA DE {sec}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Connected Admin identity */}
          <div className="flex items-center gap-2.5">
            <div className="text-right hidden xs:block">
              <div className="text-xs font-bold text-slate-800 leading-tight">Operador_ADM_01</div>
              <div className="text-[10px] text-slate-400 font-medium">Acesso: {selectedSec ? `Sec. de ${selectedSec}` : 'Sem Órgão'}</div>
            </div>
            <div className="size-8 rounded-full bg-blue-600 font-extrabold text-white text-xs flex items-center justify-center shadow-xs">
              {selectedSec ? selectedSec.substring(0, 2) : 'OP'}
            </div>
          </div>
        </header>

        {/* DYNAMIC SCROLL CONTENT REGION */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Calendar warning widget if out of schedule */}
          {ruleContext.isForaDoPrazo && (
            <div className="bg-[#fffbeb] border border-[#fde68a] p-3.5 rounded-lg flex gap-3 shadow-xs">
              <span className="text-[#f59e0b] font-bold text-base leading-none shrink-0 pt-0.5">⚠️</span>
              <div className="text-xs text-[#92400e] leading-relaxed">
                <strong className="font-bold">Atenção: Registro fora do prazo regulamentar.</strong><br />
                A data atual ({new Date(ruleContext.dataServidor || Date.now()).toLocaleDateString('pt-BR')}) excede o prazo do dia 10 do mês vigente. Esta movimentação será consolidada apenas para a folha de pagamento do mês subsequente, conforme estabelece o Art. 3º do Decreto 2026.
              </div>
            </div>
          )}

          {/* High Density Status cards row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Box: Cut-off Schedule */}
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs flex items-center justify-between">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Apuração de Folha</span>
                <div className="text-xs font-bold text-slate-800 truncate">
                  Hoje: dia <strong className="text-sm font-extrabold text-blue-600">{ruleContext.diaAtual}</strong> de <strong className="uppercase">{ruleContext.mesVigente}</strong>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed truncate">
                  Fechamento mensal impreterível no dia 10 às 23:59h.
                </p>
              </div>
              <div className="shrink-0">
                {ruleContext.isForaDoPrazo ? (
                  <span className="inline-flex items-center rounded bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800 border border-amber-200">
                    🔴 Lançamento Atrasado
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800 border border-emerald-250">
                    🟢 Lote Regular
                  </span>
                )}
              </div>
            </div>

            {/* Box: Selected Administration unit */}
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs flex items-center justify-between">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Setor Ativo no Terminal</span>
                {selectedSec ? (
                  <>
                    <div className="text-xs font-bold text-slate-850 truncate">
                      Secretaria de {selectedSec}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed truncate">
                      Lançamentos autenticados e associados a esta jurisdição.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-xs text-rose-600 font-bold tracking-tight truncate">
                      Entrada Paralisada / Sem Órgão
                    </div>
                    <p className="text-[10px] text-slate-450 leading-relaxed truncate">
                      Identifique o departamento militar/civil no cabeçalho.
                    </p>
                  </>
                )}
              </div>
              <div className="shrink-0">
                {selectedSec ? (
                  <span className="inline-flex items-center rounded bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700 border border-blue-200">
                    Habilitado
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700 border border-rose-150">
                    Bloqueado
                  </span>
                )}
              </div>
            </div>

          </div>

          {/* Feedback slot */}
          {feedback && (
            <div
              id="pnl-feedback"
              className={`rounded-lg p-3.5 shadow-xs border transition-all ${
                feedback.type === 'success'
                  ? 'bg-blue-50 border-blue-200 text-blue-900'
                  : 'bg-rose-50 border-rose-150 text-rose-900'
              }`}
            >
              <div className="flex items-start">
                <div className="shrink-0 pt-0.5">
                  {feedback.type === 'success' ? (
                    <svg className="size-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="size-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </div>
                <div className="ml-2.5 flex-1">
                  <span className="text-[11px] font-medium block whitespace-pre-wrap leading-relaxed">{feedback.message}</span>
                </div>
                <div className="ml-auto pl-2 shrink-0">
                  <button
                    onClick={() => setFeedback(null)}
                    className="inline-flex rounded text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  >
                    <span className="sr-only">Fechar</span>
                    <svg className="size-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Form module container in high density arrangement */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-4 sm:p-5">
            {!selectedSec ? (
              <div className="rounded-lg border border-dashed border-slate-250 p-10 text-center max-w-lg mx-auto my-4 bg-slate-50/50">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-3.5 ring-6 ring-blue-50/20">
                  <svg className="size-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Inserções Bloqueadas</h3>
                <p className="mt-2 text-[11px] text-slate-505 leading-relaxed">
                  Para registrar movimentações de servidores conforme os termos do Decreto Municipal Correto, você deve primeiro <strong>selecionar o departamento responsável</strong> no menu do cabeçalho superior.
                </p>
                <div className="mt-4 flex justify-center">
                  <svg className="animate-bounce size-4.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </div>
              </div>
            ) : (
              <FormulariosMovimentacao
                secretaria={selectedSec}
                activeQuadro={activeQuadro}
                isForaDoPrazo={ruleContext.isForaDoPrazo}
                onSuccess={handleInsertSuccess}
                onError={handleInsertError}
              />
            )}
          </div>

          {/* Grid rows history layout list */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-4 sm:p-5 space-y-3.5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-sans text-sm font-bold text-slate-800 leading-tight uppercase tracking-wide">
                Histórico de Registros do Lote
              </h3>
              <p className="text-[11px] text-slate-450 mt-1">
                Visualização auditada das informações processadas pela unidade. Use o painel de fechamento para download do espelho de assinatura.
              </p>
            </div>

            {loading ? (
              <div className="py-14 text-center text-slate-400 italic flex flex-col items-center justify-center text-xs">
                <svg className="animate-spin h-6 w-6 text-blue-500 mb-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Sincronizando com a base consolidada de servidores...
              </div>
            ) : (
              <TabelasVisualizacao
                db={db}
                activeQuadro={activeQuadro}
                selectedSecretaria={selectedSec}
                onDeleteSuccess={handleDeleteSuccess}
              />
            )}
          </div>

          {/* Legislative reference footnotes */}
          <section className="bg-slate-100 p-4 border border-slate-200 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] text-slate-500 leading-relaxed">
            <div className="space-y-1">
              <h4 className="font-bold text-slate-700 uppercase tracking-wider font-mono">Art. 1º - Limite</h4>
              <p>
                As Secretarias do Município de Rosário determinarão e declararão todas as alterações salariais de seu pessoal até o dia 10 de cada mês, para faturamento na competência corrente.
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-700 uppercase tracking-wider font-mono">Art. 3º - Compensação</h4>
              <p>
                Omissões, inconsistências ou cadastros realizados fora do prazo legal (data de corte) serão apurados apenas na folha de pagamento subsequente, com responsabilidade civil imputada ao ordenador.
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-700 uppercase tracking-wider font-mono">Fiel Homologação</h4>
              <p>
                O relatório oficial gerado constitui ato formal de declaração administrativa de bens e obrigações, subsidiando as prestações de contas de erários perante o egrégio Tribunal de Contas do Estado.
              </p>
            </div>
          </section>

        </div>

        {/* COMPACT ACTION BAR / FOOTER */}
        <footer className="bg-white border-t border-slate-200 px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 shadow-sm z-10">
          <div className="text-center sm:text-left self-center sm:self-auto space-y-0.5">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block font-mono">RESPONSÁVEL PELA homologação</span>
            <span className="text-xs font-bold text-slate-800">DR. ALBERTO FERREIRA JÚNIOR</span>
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5 w-full sm:w-auto">
            <button
              id="btn-export-sec"
              onClick={() => handleExportXLSX(true)}
              disabled={!selectedSec}
              className={`px-3.5 py-2 rounded text-[11px] font-bold border transition-colors shrink-0 text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                !selectedSec
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-white hover:bg-slate-50 border-slate-250 text-slate-700'
              }`}
            >
              <svg className="size-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Espelho da Secretaria (XLSX)
            </button>

            <button
              id="btn-export-total"
              onClick={() => handleExportXLSX(false)}
              className="px-3.5 py-2 rounded text-[11px] font-bold bg-[#10b981] hover:bg-[#0e9f6e] text-white transition-colors text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <svg className="size-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Gerar Relatório de Fechamento (XLSX)
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
}
