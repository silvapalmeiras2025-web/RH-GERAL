/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DatabaseState, RecordType, Secretaria } from '../types';

interface ViewProps {
  db: DatabaseState;
  activeQuadro: RecordType;
  selectedSecretaria: string;
  onDeleteSuccess: (type: RecordType, id: string) => void;
}

export default function TabelasVisualizacao({
  db,
  activeQuadro,
  selectedSecretaria,
  onDeleteSuccess
}: ViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch entries for the specific active quadrimestre
  const allRecords = db[activeQuadro] || [];

  // Filter records based on SELECTEDSECRETARIA (the active secretary contextual filter) and SEARCHTERM (name/matricula)
  const filteredRecords = allRecords.filter((rec: any) => {
    // Secretary match
    if (selectedSecretaria && rec.secretaria !== selectedSecretaria) {
      return false;
    }
    // Search match
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      const nameMatch = (rec.nomeCompleto || '').toLowerCase().includes(term);
      const matriculaMatch = (rec.matricula || '').toLowerCase().includes(term);
      const cpfMatch = (rec.cpf || '').toLowerCase().includes(term);
      const servidorBMatch = (rec.servidorBNome || '').toLowerCase().includes(term) || (rec.servidorBMatricula || '').toLowerCase().includes(term);
      return nameMatch || matriculaMatch || cpfMatch || servidorBMatch;
    }
    return true;
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm('Atenção: Tem certeza de que deseja remover permanentemente este registro da listagem oficial?')) {
      return;
    }

    try {
      const res = await fetch(`/api/records/${activeQuadro}/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        throw new Error('Falha ao remover o registro.');
      }
      onDeleteSuccess(activeQuadro, id);
    } catch (err: any) {
      alert(err.message || 'Erro ao tentar deletar.');
    }
  };

  // Prettify UTC timestamps back to Local Br Time
  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const formatCurrencyBR = (val?: number) => {
    if (val === undefined || val === null) return 'R$ 0,00';
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Determina se um afastamento ainda está em curso com base na data de término informada
  const getStatusAfastamento = (dataTermino?: string) => {
    if (!dataTermino) return { label: 'EM ABERTO', tone: 'amber' as const };
    const termino = new Date(dataTermino + 'T23:59:59');
    if (isNaN(termino.getTime())) return { label: 'EM ABERTO', tone: 'amber' as const };
    return termino.getTime() < Date.now()
      ? { label: 'ENCERRADO', tone: 'slate' as const }
      : { label: 'EM ANDAMENTO', tone: 'blue' as const };
  };

  // Headings config
  const getHeaders = () => {
    switch (activeQuadro) {
      case 'admissoes':
        return ['Matrícula', 'Servidor / CPF', 'Admissão', 'Vínculo', 'Cargo Ocupado', 'Salário / Base', 'Carga H.', 'Envio'];
      case 'demissoes':
        return ['Matrícula', 'Servidor', 'Vínculo', 'Cargo', 'Desligamento', 'Motivo / Causa', 'Portaria', 'Envio'];
      case 'faltas':
        return ['Matrícula', 'Servidor', 'Local de Trabalho', 'Ocorrência', 'Período', 'Dias', 'Status', 'CID / Motivo', 'Abono / Desconto', 'Envio'];
      case 'ferias':
        return ['Matrícula', 'Servidor', 'P. Aquisitivo', 'Período Gozo', 'Dias', 'Abono / 13º', 'Envio'];
      case 'lotacoes':
        return ['Matrícula', 'Servidor', 'Local Anterior', 'Novo Local', 'Cargos (Orig/Dest)', 'Data Vig.', 'Portaria'];
      case 'horasExtras':
        return ['Matrícula', 'Servidor', 'Mês Compet.', 'HE 50% / HE 100%', 'Adic. Noturno', 'Autorizado por', 'Envio'];
      case 'ajudasCusto':
        return ['Matrícula', 'Servidor', 'Tipo', 'Valor', 'Mês Ref.', 'Forma Pagamento', 'Finalidade', 'Ref. PA'];
      case 'gratificacoes':
        return ['Matrícula', 'Servidor', 'Gratificação', 'Valor / %', 'Natureza', 'Data Início', 'Suporte Legal', 'Envio'];
      case 'permutas':
        return ['Servidor A', 'Local A', 'Servidor B', 'Local B', 'Solicitação', 'Efetivação', 'Status', 'Portaria', 'Envio'];
      case 'frequencias':
        return ['Matrícula', 'Servidor', 'Local de Trabalho', 'Competência', 'Dias Úteis', 'Trabalhados', 'Faltas/Atestados/Atrasos', '% Frequência', 'Envio'];
      default:
        return [];
    }
  };

  const headers = getHeaders();

  return (
    <div className="space-y-4">
      {/* Filters and search panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div>
          <h4 className="text-sm font-semibold text-slate-800">
            Registros Efetuados no Lote {selectedSecretaria && `— Secretaria de ${selectedSecretaria}`}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Mostrando {filteredRecords.length} de {allRecords.length} registros no quadro selecionado.
          </p>
        </div>
        <div id="div-search-bar" className="relative w-full max-w-xs">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="size-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            id="inp-search"
            type="text"
            placeholder="Buscar por Matrícula ou Nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-405 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Structured Spreadsheet Layout Display */}
      <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white">
        <table id="tbl-movimentacoes" className="min-w-full divide-y divide-slate-200 text-left text-xs text-slate-700">
          <thead className="bg-slate-50 font-semibold text-slate-600">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-3.5 border-b border-slate-200">{h}</th>
              ))}
              <th className="px-4 py-3.5 border-b border-slate-200 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={headers.length + 1} className="px-4 py-12 text-center text-slate-400 italic bg-slate-50/20">
                  <div className="flex flex-col items-center justify-center">
                    <svg className="size-8 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Nenhuma movimentação de pessoal registrada ou compatível com a busca.
                  </div>
                </td>
              </tr>
            ) : (
              filteredRecords.map((rec: any, idx) => {
                const isLate = rec.foraDoPrazo === true;

                return (
                  <tr key={rec.id} className={`hover:bg-slate-50/50 transition-colors ${isLate ? 'bg-amber-50/10' : ''}`}>
                    {/* Render matching attributes matching activeQuadro */}
                    
                    {activeQuadro === 'admissoes' && (
                      <>
                        <td className="px-4 py-3 font-mono font-medium text-slate-900 border-r border-slate-100">{rec.matricula}</td>
                        <td className="px-4 py-3 border-r border-slate-100">
                          <div className="font-semibold text-slate-900">{rec.nomeCompleto}</div>
                          <div className="text-[10px] text-slate-400">CPF: {rec.cpf}</div>
                        </td>
                        <td className="px-4 py-3 border-r border-slate-100">{formatDate(rec.dataAdmissao)}</td>
                        <td className="px-4 py-3 border-r border-slate-100">
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium leading-4 ${
                            rec.vinculo === 'Efetivo' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10' :
                            rec.vinculo === 'Comissionado' ? 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/10' :
                            'bg-violet-50 text-violet-700 ring-1 ring-violet-600/10'
                          }`}>
                            {rec.vinculo}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800 border-r border-slate-100">{rec.cargo}</td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-900 border-r border-slate-100">{formatCurrencyBR(rec.subsidio)}</td>
                        <td className="px-4 py-3 border-r border-slate-100">{rec.cargaHoraria}h sem.</td>
                      </>
                    )}

                    {activeQuadro === 'demissoes' && (
                      <>
                        <td className="px-4 py-3 font-mono font-medium text-slate-900 border-r border-slate-100">{rec.matricula}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900 border-r border-slate-100">{rec.nomeCompleto}</td>
                        <td className="px-4 py-3 border-r border-slate-100">
                          <span className="text-[10px] rounded-md bg-slate-100 px-2.5 py-0.5 text-slate-700">{rec.vinculo}</span>
                        </td>
                        <td className="px-4 py-3 border-r border-slate-100 text-slate-700">{rec.cargo}</td>
                        <td className="px-4 py-3 font-medium text-rose-700 border-r border-slate-100">{formatDate(rec.dataDesligamento)}</td>
                        <td className="px-4 py-3 border-r border-slate-100">{rec.motivo}</td>
                        <td className="px-4 py-3 font-mono text-slate-500 border-r border-slate-100">{rec.portaria || '-'}</td>
                      </>
                    )}

                    {activeQuadro === 'faltas' && (() => {
                      const status = getStatusAfastamento(rec.dataTermino);
                      const toneClasses = status.tone === 'blue'
                        ? 'bg-blue-50 text-blue-700 border-blue-150'
                        : status.tone === 'slate'
                        ? 'bg-slate-100 text-slate-600 border-slate-200'
                        : 'bg-amber-50 text-amber-800 border-amber-150';
                      return (
                        <>
                          <td className="px-4 py-3 font-mono font-medium text-slate-900 border-r border-slate-100">{rec.matricula}</td>
                          <td className="px-4 py-3 border-r border-slate-100">
                            <div className="font-semibold text-slate-900">{rec.nomeCompleto}</div>
                            <div className="text-[10px] text-slate-400">{rec.vinculo}</div>
                          </td>
                          <td className="px-4 py-3 border-r border-slate-100 text-slate-600">{rec.localTrabalho || '-'}</td>
                          <td className="px-4 py-3 border-r border-slate-100">
                            <span className="inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800 border border-amber-100">{rec.tipoOcorrencia}</span>
                          </td>
                          <td className="px-4 py-3 border-r border-slate-100 text-slate-600">
                            {formatDate(rec.dataInicio)} {rec.dataTermino && `até ${formatDate(rec.dataTermino)}`}
                          </td>
                          <td className="px-4 py-3 border-r border-slate-100 font-bold text-slate-900">{rec.quantidadeDias} dias</td>
                          <td className="px-4 py-3 border-r border-slate-100">
                            <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold border ${toneClasses}`}>{status.label}</span>
                          </td>
                          <td className="px-4 py-3 border-r border-slate-100 font-mono text-slate-500">{rec.motivoCid || '-'}</td>
                          <td className="px-4 py-3 border-r border-slate-100">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px]">Justificado: <strong className={rec.justificado ? 'text-emerald-700' : 'text-slate-500'}>{rec.justificado ? 'SIM' : 'NÃO'}</strong></span>
                              <span className="text-[10px]">Descontar: <strong className={rec.descontar ? 'text-rose-700' : 'text-slate-500'}>{rec.descontar ? 'SIM' : 'NÃO'}</strong></span>
                            </div>
                          </td>
                        </>
                      );
                    })()}

                    {activeQuadro === 'ferias' && (
                      <>
                        <td className="px-4 py-3 font-mono font-medium text-slate-900 border-r border-slate-100">{rec.matricula}</td>
                        <td className="px-4 py-3 border-r border-slate-100">
                          <div className="font-semibold text-slate-900">{rec.nomeCompleto}</div>
                          <div className="text-[10px] text-slate-400">{rec.vinculo}</div>
                        </td>
                        <td className="px-4 py-3 font-mono border-r border-slate-100">{rec.periodoAquisitivo}</td>
                        <td className="px-4 py-3 border-r border-slate-100 text-slate-600">
                          {formatDate(rec.dataInicio)} {rec.dataTermino && `até ${formatDate(rec.dataTermino)}`}
                        </td>
                        <td className="px-4 py-3 border-r border-slate-100 font-bold block-inline">{rec.diasGozo} dias</td>
                        <td className="px-4 py-3 border-r border-slate-100">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px]">Abono: <strong>{rec.abonoPecuniario ? 'SIM (1/3)' : 'NÃO'}</strong></span>
                            <span className="text-[10px]">Adiant. 13º: <strong>{rec.adiantamentoDecimoTerceiro ? 'SIM' : 'NÃO'}</strong></span>
                          </div>
                        </td>
                      </>
                    )}

                    {activeQuadro === 'lotacoes' && (
                      <>
                        <td className="px-4 py-3 font-mono font-medium text-slate-900 border-r border-slate-100">{rec.matricula}</td>
                        <td className="px-4 py-3 border-r border-slate-100">
                          <div className="font-semibold text-slate-900">{rec.nomeCompleto}</div>
                          <div className="text-[10px] text-slate-400">{rec.vinculo}</div>
                        </td>
                        <td className="px-4 py-3 border-r border-slate-100 text-slate-600">{rec.lotacaoAnterior}</td>
                        <td className="px-4 py-3 font-semibold text-blue-700 border-r border-slate-100">{rec.novaLotacao}</td>
                        <td className="px-4 py-3 border-r border-slate-100">
                          <div className="text-[11px] text-slate-600">De: {rec.cargoAtual || '-'}</div>
                          <div className="text-[11px] font-bold text-slate-900">Para: {rec.novoCargo || '-'}</div>
                        </td>
                        <td className="px-4 py-3 border-r border-slate-100">{formatDate(rec.dataVigencia)}</td>
                        <td className="px-4 py-3 font-mono text-slate-500 border-r border-slate-100">{rec.portaria || '-'}</td>
                      </>
                    )}

                    {activeQuadro === 'horasExtras' && (
                      <>
                        <td className="px-4 py-3 font-mono font-medium text-slate-900 border-r border-slate-100">{rec.matricula}</td>
                        <td className="px-4 py-3 border-r border-slate-100">
                          <div className="font-semibold text-slate-900">{rec.nomeCompleto}</div>
                          <div className="text-[10px] text-slate-400">{rec.vinculo}</div>
                        </td>
                        <td className="px-4 py-3 font-mono border-r border-slate-100 text-center">{rec.competencia}</td>
                        <td className="px-4 py-3 border-r border-slate-100 font-mono text-center">
                          <span className="text-slate-600">50%: {rec.he50}h</span> <br />
                          <span className="text-slate-900 font-bold">100%: {rec.he100}h</span>
                        </td>
                        <td className="px-4 py-3 font-mono border-r border-slate-100 text-center text-slate-600">{rec.horasNoturnas ? `${rec.horasNoturnas}h` : '0h'}</td>
                        <td className="px-4 py-3 border-r border-slate-100">
                          <div className="text-slate-700">{rec.autorizadoPor}</div>
                          <div className="text-[10px] text-slate-400 max-w-[200px] truncate" title={rec.justificativa}>{rec.justificativa}</div>
                        </td>
                      </>
                    )}

                    {activeQuadro === 'ajudasCusto' && (
                      <>
                        <td className="px-4 py-3 font-mono font-medium text-slate-900 border-r border-slate-100">{rec.matricula}</td>
                        <td className="px-4 py-3 border-r border-slate-100">
                          <div className="font-semibold text-slate-900">{rec.nomeCompleto}</div>
                          <div className="text-[10px] text-slate-400">{rec.vinculo}</div>
                        </td>
                        <td className="px-4 py-3 border-r border-slate-100">
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium leading-4 ${
                            rec.tipo === 'Diária' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-orange-50 text-orange-700 border border-orange-100'
                          }`}>
                            {rec.tipo}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-900 border-r border-slate-100">{formatCurrencyBR(rec.valor)}</td>
                        <td className="px-4 py-3 font-mono border-r border-slate-100 text-center">{rec.competencia}</td>
                        <td className="px-4 py-3 border-r border-slate-100 font-medium text-slate-600">{rec.formaPagamento}</td>
                        <td className="px-4 py-3 border-r border-slate-100 max-w-[180px] truncate" title={rec.finalidade}>{rec.finalidade}</td>
                        <td className="px-4 py-3 font-mono text-slate-500 border-r border-slate-100">{rec.processoAdministrativo || '-'}</td>
                      </>
                    )}

                    {activeQuadro === 'gratificacoes' && (
                      <>
                        <td className="px-4 py-3 font-mono font-medium text-slate-900 border-r border-slate-100">{rec.matricula}</td>
                        <td className="px-4 py-3 border-r border-slate-100">
                          <div className="font-semibold text-slate-900">{rec.nomeCompleto}</div>
                          <div className="text-[10px] text-slate-400">{rec.vinculo}</div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800 border-r border-slate-100">{rec.tipoGratificacao}</td>
                        <td className="px-4 py-3 font-mono font-bold text-blue-700 border-r border-slate-100">{rec.valorOrPercentual}</td>
                        <td className="px-4 py-3 border-r border-slate-100">
                          <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-medium ${
                            rec.natureza === 'Fixa' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                          }`}>{rec.natureza}</span>
                        </td>
                        <td className="px-4 py-3 border-r border-slate-100">{formatDate(rec.dataInicio)}</td>
                        <td className="px-4 py-3 border-r border-slate-100 text-slate-500 font-mono">{rec.baseLegal}</td>
                      </>
                    )}

                    {activeQuadro === 'permutas' && (() => {
                      const statusTone: Record<string, string> = {
                        Solicitada: 'bg-amber-50 text-amber-800 border-amber-150',
                        Aprovada: 'bg-blue-50 text-blue-700 border-blue-150',
                        Efetivada: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                        Negada: 'bg-rose-50 text-rose-700 border-rose-150'
                      };
                      return (
                        <>
                          <td className="px-4 py-3 border-r border-slate-100">
                            <div className="font-semibold text-slate-900">{rec.servidorANome}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{rec.servidorAMatricula} · {rec.servidorAVinculo}</div>
                          </td>
                          <td className="px-4 py-3 border-r border-slate-100 text-slate-600">{rec.localA}</td>
                          <td className="px-4 py-3 border-r border-slate-100">
                            <div className="font-semibold text-slate-900">{rec.servidorBNome}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{rec.servidorBMatricula} · {rec.servidorBVinculo}</div>
                          </td>
                          <td className="px-4 py-3 border-r border-slate-100 text-slate-600">{rec.localB}</td>
                          <td className="px-4 py-3 border-r border-slate-100">{formatDate(rec.dataSolicitacao)}</td>
                          <td className="px-4 py-3 border-r border-slate-100">{rec.dataEfetivacao ? formatDate(rec.dataEfetivacao) : '-'}</td>
                          <td className="px-4 py-3 border-r border-slate-100">
                            <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold border ${statusTone[rec.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>{rec.status}</span>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-500 border-r border-slate-100">{rec.portaria || '-'}</td>
                        </>
                      );
                    })()}

                    {activeQuadro === 'frequencias' && (() => {
                      const pct = rec.diasUteis > 0 ? Math.round((rec.diasTrabalhados / rec.diasUteis) * 1000) / 10 : 0;
                      const pctTone = pct >= 95 ? 'text-emerald-700' : pct >= 85 ? 'text-amber-700' : 'text-rose-700';
                      return (
                        <>
                          <td className="px-4 py-3 font-mono font-medium text-slate-900 border-r border-slate-100">{rec.matricula}</td>
                          <td className="px-4 py-3 border-r border-slate-100">
                            <div className="font-semibold text-slate-900">{rec.nomeCompleto}</div>
                            <div className="text-[10px] text-slate-400">{rec.vinculo}</div>
                          </td>
                          <td className="px-4 py-3 border-r border-slate-100 text-slate-600">{rec.localTrabalho || '-'}</td>
                          <td className="px-4 py-3 font-mono border-r border-slate-100 text-center">{rec.competencia}</td>
                          <td className="px-4 py-3 border-r border-slate-100 text-center">{rec.diasUteis}</td>
                          <td className="px-4 py-3 border-r border-slate-100 text-center font-bold text-slate-900">{rec.diasTrabalhados}</td>
                          <td className="px-4 py-3 border-r border-slate-100 text-center font-mono text-slate-600">
                            {rec.faltas}F / {rec.atestados}A / {rec.atrasos}At
                          </td>
                          <td className={`px-4 py-3 border-r border-slate-100 text-center font-bold ${pctTone}`}>{pct}%</td>
                        </>
                      );
                    })()}

                    {/* Metadata indicators */}
                    <td className="px-4 py-3 border-r border-slate-100 whitespace-nowrap text-slate-500">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-700">{rec.secretaria}</span>
                        <span className="text-[10px] scale-95 origin-left text-slate-400">{formatDateTime(rec.timestamp)}</span>
                        {isLate && (
                          <span className="inline-flex mt-1 items-center justify-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 border border-amber-200">
                            FOLHA SUBSEQUENTE
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Interactive Action to Delete error-entries */}
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleDelete(rec.id)}
                        className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600 cursor-pointer transition-all inline-flex items-center"
                        title="Remover registro do banco"
                      >
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
