/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Secretaria, VinculoType, RecordType } from '../types';

interface FormProps {
  secretaria: string;
  activeQuadro: RecordType;
  isForaDoPrazo: boolean;
  onSuccess: (message: string, record: any) => void;
  onError: (err: string) => void;
}

// Simple CPF formatter helper
const formatCPF = (value: string) => {
  const nums = value.replace(/\D/g, '');
  if (nums.length <= 3) return nums;
  if (nums.length <= 6) return `${nums.slice(0, 3)}.${nums.slice(3)}`;
  if (nums.length <= 9) return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6)}`;
  return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6, 9)}-${nums.slice(9, 11)}`;
};

export default function FormulariosMovimentacao({
  secretaria,
  activeQuadro,
  isForaDoPrazo,
  onSuccess,
  onError
}: FormProps) {
  const [submitting, setSubmitting] = useState(false);

  // Core identifiers common across all forms
  const [matricula, setMatricula] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [vinculo, setVinculo] = useState<VinculoType>('Efetivo');

  // Admissões (1)
  const [cpf, setCpf] = useState('');
  const [dataAdmissao, setDataAdmissao] = useState('');
  const [cargo, setCargo] = useState('');
  const [subsidio, setSubsidio] = useState('');
  const [cargaHoraria, setCargaHoraria] = useState('40');
  const [observacoes, setObservacoes] = useState('');

  // Demissões (2)
  const [dataDesligamento, setDataDesligamento] = useState('');
  const [motivoDesligamento, setMotivoDesligamento] = useState('');
  const [portariaDesligamento, setPortariaDesligamento] = useState('');

  // Faltas (3)
  const [tipoOcorrencia, setTipoOcorrencia] = useState('Falta Injustificada');
  const [dataInicioFalta, setDataInicioFalta] = useState('');
  const [dataTerminoFalta, setDataTerminoFalta] = useState('');
  const [quantidadeDias, setQuantidadeDias] = useState('');
  const [motivoCid, setMotivoCid] = useState('');
  const [justificado, setJustificado] = useState('Não');
  const [descontar, setDescontar] = useState('Sim');

  // Férias (4)
  const [periodoAquisitivo, setPeriodoAquisitivo] = useState('');
  const [dataInicioFerias, setDataInicioFerias] = useState('');
  const [dataTerminoFerias, setDataTerminoFerias] = useState('');
  const [diasGozo, setDiasGozo] = useState('30');
  const [abonoPecuniario, setAbonoPecuniario] = useState('Não');
  const [adiantamento13, setAdiantamento13] = useState('Não');

  // Lotações (5)
  const [lotacaoAnterior, setLotacaoAnterior] = useState('');
  const [novaLotacao, setNovaLotacao] = useState('');
  const [cargoAtual, setCargoAtual] = useState('');
  const [novoCargo, setNovoCargo] = useState('');
  const [dataVigenciaLotacao, setDataVigenciaLotacao] = useState('');
  const [portariaLotacao, setPortariaLotacao] = useState('');

  // Horas Extras (6)
  const [competenciaHE, setCompetenciaHE] = useState('');
  const [he50, setHe50] = useState('');
  const [he100, setHe100] = useState('');
  const [horasNoturnas, setHorasNoturnas] = useState('');
  const [autorizadoPor, setAutorizadoPor] = useState('');
  const [justificativaHE, setJustificativaHE] = useState('');

  // Ajuda de Custo (7)
  const [tipoAjuda, setTipoAjuda] = useState<'Ajuda de Custo' | 'Diária'>('Ajuda de Custo');
  const [valorAjuda, setValorAjuda] = useState('');
  const [competenciaAjuda, setCompetenciaAjuda] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('Crédito em Conta');
  const [processoAdm, setProcessoAdm] = useState('');
  const [finalidadeAjuda, setFinalidadeAjuda] = useState('');

  // Gratificações (8)
  const [tipoGratificacao, setTipoGratificacao] = useState('');
  const [valorOuPercentual, setValorOuPercentual] = useState('');
  const [naturezaGratificacao, setNaturezaGratificacao] = useState<'Fixa' | 'Eventual'>('Fixa');
  const [dataInicioGratificacao, setDataInicioGratificacao] = useState('');
  const [baseLegalGratificacao, setBaseLegalGratificacao] = useState('');
  const [motivoGratificacao, setMotivoGratificacao] = useState('');

  // Handle common fields reset
  const resetCommon = () => {
    setMatricula('');
    setNomeCompleto('');
    setVinculo('Efetivo');
    setObservacoes('');
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!secretaria) {
      onError('Por favor, informe a Secretaria responsável no cabeçalho antes de salvar a movimentação.');
      return;
    }

    if (!matricula.trim() || !nomeCompleto.trim()) {
      onError('Matrícula e Nome Completo são campos obrigatórios para qualquer registro.');
      return;
    }

    setSubmitting(true);

    try {
      // Build request body according to current layout
      let recordBody: any = {
        secretaria,
        matricula: matricula.trim(),
        nomeCompleto: nomeCompleto.trim(),
        vinculo
      };

      // Gather form specific fields
      switch (activeQuadro) {
        case 'admissoes':
          if (!cpf.trim() || !dataAdmissao || !cargo.trim() || !subsidio) {
            throw new Error('Preencha os campos obrigatórios da Admissão (CPF, Data, Cargo, Salário).');
          }
          recordBody = {
            ...recordBody,
            cpf: cpf.trim(),
            dataAdmissao,
            cargo: cargo.trim(),
            subsidio: parseFloat(subsidio),
            cargaHoraria: parseInt(cargaHoraria, 10) || 40,
            observacoes: observacoes.trim()
          };
          break;

        case 'demissoes':
          if (!dataDesligamento || !motivoDesligamento.trim() || !cargo.trim()) {
            throw new Error('Preencha o Cargo, Data de Desligamento e o Motivo da desvinculação.');
          }
          recordBody = {
            ...recordBody,
            cargo: cargo.trim(),
            dataDesligamento,
            motivo: motivoDesligamento.trim(),
            portaria: portariaDesligamento.trim(),
            observacoes: observacoes.trim()
          };
          break;

        case 'faltas':
          if (!dataInicioFalta || !quantidadeDias) {
            throw new Error('Preencha a Data de Início e a estimativa de dias de afastamento.');
          }
          recordBody = {
            ...recordBody,
            tipoOcorrencia,
            dataInicio: dataInicioFalta,
            dataTermino: dataTerminoFalta,
            quantidadeDias: parseFloat(quantidadeDias) || 1,
            motivoCid: motivoCid.trim(),
            justificado: justificado === 'Sim',
            descontar: descontar === 'Sim'
          };
          break;

        case 'ferias':
          if (!periodoAquisitivo.trim() || !dataInicioFerias || !diasGozo) {
            throw new Error('Preencha o Período Aquisitivo, a Data de Início e o número de dias de gozo.');
          }
          recordBody = {
            ...recordBody,
            periodoAquisitivo: periodoAquisitivo.trim(),
            dataInicio: dataInicioFerias,
            dataTermino: dataTerminoFerias,
            diasGozo: parseInt(diasGozo, 10) || 30,
            abonoPecuniario: abonoPecuniario === 'Sim',
            adiantamentoDecimoTerceiro: adiantamento13 === 'Sim'
          };
          break;

        case 'lotacoes':
          if (!lotacaoAnterior.trim() || !novaLotacao.trim() || !dataVigenciaLotacao) {
            throw new Error('Informe o local anterior, o novo destino físico e a data de eficácia da lotação.');
          }
          recordBody = {
            ...recordBody,
            lotacaoAnterior: lotacaoAnterior.trim(),
            novaLotacao: novaLotacao.trim(),
            cargoAtual: cargoAtual.trim(),
            novoCargo: novoCargo.trim(),
            dataVigencia: dataVigenciaLotacao,
            portaria: portariaLotacao.trim()
          };
          break;

        case 'horasExtras':
          if (!competenciaHE.trim() || (!he50 && !he100 && !horasNoturnas)) {
            throw new Error('Indique a competência (Mês/Ano) e pelo menos uma quantidade de horas prestadas.');
          }
          recordBody = {
            ...recordBody,
            competencia: competenciaHE.trim(),
            he50: parseFloat(he50) || 0,
            he100: parseFloat(he100) || 0,
            horasNoturnas: parseFloat(horasNoturnas) || 0,
            autorizadoPor: autorizadoPor.trim(),
            justificativa: justificativaHE.trim()
          };
          break;

        case 'ajudasCusto':
          if (!valorAjuda || !competenciaAjuda.trim() || !finalidadeAjuda.trim()) {
            throw new Error('Informe a finalidade institucional da Diária/Ajuda, o respectivo valor e competencia.');
          }
          recordBody = {
            ...recordBody,
            tipo: tipoAjuda,
            valor: parseFloat(valorAjuda) || 0,
            competencia: competenciaAjuda.trim(),
            formaPagamento,
            processoAdministrativo: processoAdm.trim(),
            finalidade: finalidadeAjuda.trim()
          };
          break;

        case 'gratificacoes':
          if (!tipoGratificacao.trim() || !valorOuPercentual.trim() || !dataInicioGratificacao) {
            throw new Error('Informe o tipo de gratificação, o valor/percentual estabelecido e a data de início.');
          }
          recordBody = {
            ...recordBody,
            tipoGratificacao: tipoGratificacao.trim(),
            valorOrPercentual: valorOuPercentual.trim(),
            natureza: naturezaGratificacao,
            dataInicio: dataInicioGratificacao,
            baseLegal: baseLegalGratificacao.trim(),
            motivo: motivoGratificacao.trim()
          };
          break;

        default:
          throw new Error('Quadro regulamentar inválido.');
      }

      // Execute POST API call to persist the structured form in NodeJS database
      const response = await fetch(`/api/records/${activeQuadro}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(recordBody)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro inesperado no servidor ao tentar salvar.');
      }

      // Success callback
      let completeMsg = data.message;
      if (data.foraDoPrazo) {
        completeMsg = `⚠️ [DECRETO Nº 409/2026] FORA DO PRAZO DE CORTE MENSAL!\n\nEste registro foi salvo, mas como hoje é após o dia 10 do mês corrente, de acordo com o Artigo 3º, ele será processado exclusivamente na folha de pagamento do mês subsequente.`;
      } else {
        completeMsg = `✅ Sucesso! Movimentação de servidor registrada dentro do prazo legal e homologada para a próxima folha de pagamento.`;
      }

      onSuccess(completeMsg, data.record);
      
      // Clean form state fields
      resetCommon();
      setCpf('');
      setDataAdmissao('');
      setCargo('');
      setSubsidio('');
      setDataDesligamento('');
      setMotivoDesligamento('');
      setPortariaDesligamento('');
      setDataInicioFalta('');
      setDataTerminoFalta('');
      setQuantidadeDias('');
      setMotivoCid('');
      setPeriodoAquisitivo('');
      setDataInicioFerias('');
      setDataTerminoFerias('');
      setLotacaoAnterior('');
      setNovaLotacao('');
      setCargoAtual('');
      setNovoCargo('');
      setDataVigenciaLotacao('');
      setPortariaLotacao('');
      setCompetenciaHE('');
      setHe50('');
      setHe100('');
      setHorasNoturnas('');
      setAutorizadoPor('');
      setJustificativaHE('');
      setValorAjuda('');
      setCompetenciaAjuda('');
      setProcessoAdm('');
      setFinalidadeAjuda('');
      setTipoGratificacao('');
      setValorOuPercentual('');
      setDataInicioGratificacao('');
      setBaseLegalGratificacao('');
      setMotivoGratificacao('');

    } catch (err: any) {
      onError(err.message || 'Erro inesperado. Verifique os campos e tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Visual Header within Form showing the selected Quadro */}
      <div className="border-b border-gray-100 pb-4">
        <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10 mb-2">
          Decreto 409/2026 - Formulário Oficial
        </span>
        <h3 className="font-sans text-lg font-medium text-slate-800">
          Alimentação de Dados — {activeQuadro === 'admissoes' ? 'Quadro 1: Admissões' :
                                  activeQuadro === 'demissoes' ? 'Quadro 2: Demissões e Exonerações' :
                                  activeQuadro === 'faltas' ? 'Quadro 3: Faltas e Afastamentos' :
                                  activeQuadro === 'ferias' ? 'Quadro 4: Férias do Servidor' :
                                  activeQuadro === 'lotacoes' ? 'Quadro 5: Mudanças de Lotação' :
                                  activeQuadro === 'horasExtras' ? 'Quadro 6: Horas Extras e Adic.' :
                                  activeQuadro === 'ajudasCusto' ? 'Quadro 7: Ajuda de Custo e Diárias' :
                                  'Quadro 8: Gratificações e Prêmios'}
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          A secretaria de origem ({secretaria || 'Não selecionada'}) responderá legalmente pela veracidade dos dados perante o Controle Interno.
        </p>
      </div>

      {/* Deadline Warn banner inside the Form if late */}
      {isForaDoPrazo && (
        <div className="rounded-r-lg border-l-4 border-amber-500 bg-amber-50 p-4 transition-all">
          <div className="flex">
            <div className="shrink-0 text-amber-500">
              <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-semibold text-amber-800">Fora do Prazo de Corte Regulamentar</h4>
              <p className="mt-1 text-xs text-amber-700 leading-relaxed">
                <strong>Atenção:</strong> De acordo com o <strong>Artigo 1º e 3º do Decreto 409/2026</strong>, como a data atual ultrapassou o dia 10 do mês corrente, este registro será processado nos cadastros e folha de pagamento exclusivamente do <strong>mês subsequente</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Common Server Identification Section */}
      <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100 space-y-4">
        <h4 className="font-mono text-xs font-bold text-slate-500 tracking-wider">DADOS DE IDENTIFICAÇÃO DO SERVIDOR</h4>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <label id="lbl-matricula" className="block text-xs font-semibold text-slate-700 mr-1 mb-1">Matrícula <span className="text-rose-500">*</span></label>
            <input
              id="inp-matricula"
              type="text"
              placeholder="Ex: 50928-1"
              required
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          <div className="md:col-span-4">
            <label id="lbl-nome" className="block text-xs font-semibold text-slate-700 mr-1 mb-1">Nome Completo do Servidor <span className="text-rose-500">*</span></label>
            <input
              id="inp-nome"
              type="text"
              placeholder="Nome sem abreviações conforme documento oficial"
              required
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-3">
            <label id="lbl-vinculo" className="block text-xs font-semibold text-slate-700 mr-1 mb-1">Vínculo Ocupacional <span className="text-rose-500">*</span></label>
            <select
              id="sel-vinculo"
              value={vinculo}
              onChange={(e) => setVinculo(e.target.value as VinculoType)}
              className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="Efetivo">Efetivo (Concursado)</option>
              <option value="Comissionado">Comissionado (Livre Nomeação)</option>
              <option value="Contratado">Contratado Temporário (Processo Seletivo)</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <label id="lbl-sec-origem" className="block text-xs font-semibold text-slate-500 mr-1 mb-1">Secretaria Produtora (Bloqueado)</label>
            <input
              id="inp-sec-origem"
              type="text"
              disabled
              value={secretaria || 'NÃO CONFIGURADA NO TOPO'}
              className="w-full text-sm rounded-lg border border-slate-200 bg-slate-100/60 px-3 py-2 text-slate-500 outline-none cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Specific Fields per activeQuadro Selection */}
      <div className="space-y-4">
        {activeQuadro === 'admissoes' && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <label id="lbl-cpf" className="block text-xs font-semibold text-slate-700 mb-1">CPF <span className="text-rose-500">*</span></label>
              <input
                id="inp-cpf"
                type="text"
                maxLength={14}
                placeholder="000.000.000-00"
                required
                value={cpf}
                onChange={handleCpfChange}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label id="lbl-dat-admis" className="block text-xs font-semibold text-slate-700 mb-1">Data de Admissão <span className="text-rose-500">*</span></label>
              <input
                id="inp-dat-admis"
                type="date"
                required
                value={dataAdmissao}
                onChange={(e) => setDataAdmissao(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label id="lbl-carga-horaria" className="block text-xs font-semibold text-slate-700 mb-1">Carga Horária (Semanal) <span className="text-rose-500">*</span></label>
              <select
                id="sel-carga-horaria"
                value={cargaHoraria}
                onChange={(e) => setCargaHoraria(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="20">20 horas</option>
                <option value="30">30 horas</option>
                <option value="40">40 horas</option>
                <option value="44">44 horas</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label id="lbl-cargo" className="block text-xs font-semibold text-slate-700 mb-1">Cargo Nomeado <span className="text-rose-500">*</span></label>
              <input
                id="inp-cargo"
                type="text"
                placeholder="Ex: Assessor Jurídico, Enfermeiro Jefe"
                required
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-3">
              <label id="lbl-subsidio" className="block text-xs font-semibold text-slate-700 mb-1">Salário-Base / Subsídio Inicial (R$) <span className="text-rose-500">*</span></label>
              <input
                id="inp-subsidio"
                type="number"
                step="0.01"
                placeholder="Ex: 3500.00 (somente números)"
                required
                value={subsidio}
                onChange={(e) => setSubsidio(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {activeQuadro === 'demissoes' && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-3">
              <label id="lbl-cargo-dem" className="block text-xs font-semibold text-slate-700 mb-1">Cargo a Desvincular <span className="text-rose-500">*</span></label>
              <input
                id="inp-cargo-dem"
                type="text"
                placeholder="Ex: Assistente Administrativo"
                required
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-3">
              <label id="lbl-data-deslig" className="block text-xs font-semibold text-slate-700 mb-1">Data Efetiva do Desligamento <span className="text-rose-500">*</span></label>
              <input
                id="inp-data-deslig"
                type="date"
                required
                value={dataDesligamento}
                onChange={(e) => setDataDesligamento(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-3">
              <label id="lbl-motivo-deslig" className="block text-xs font-semibold text-slate-700 mb-1">Motivo do Desligamento / Causa <span className="text-rose-500">*</span></label>
              <input
                id="inp-motivo-deslig"
                type="text"
                placeholder="Ex: Exoneração a Pedido, Rescisão Contratual, Aposentadoria"
                required
                value={motivoDesligamento}
                onChange={(e) => setMotivoDesligamento(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-3">
              <label id="lbl-portaria-ex" className="block text-xs font-semibold text-slate-700 mb-1">Número da Portaria ou Processo</label>
              <input
                id="inp-portaria-ex"
                type="text"
                placeholder="Ex: Portaria GP nº 123/2026"
                value={portariaDesligamento}
                onChange={(e) => setPortariaDesligamento(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {activeQuadro === 'faltas' && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <label id="lbl-tipo-ocorrencia" className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Ocorrência <span className="text-rose-500">*</span></label>
              <select
                id="sel-tipo-ocorrencia"
                value={tipoOcorrencia}
                onChange={(e) => setTipoOcorrencia(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="Falta Injustificada">Falta Injustificada</option>
                <option value="Afastamento Médico (Atestado)">Afastamento Médico (Atestado)</option>
                <option value="Licença para Tratamento de Saúde">Licença para Tratamento de Saúde</option>
                <option value="Licença Maternidade/Paternidade">Licença Maternidade/Paternidade</option>
                <option value="Licença por Motivo de Casamento">Licença por Motivo de Casamento</option>
                <option value="Afastamento Legislativo/Mandatário">Afastamento Legislativo/Mandatário</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label id="lbl-data-ini-falta" className="block text-xs font-semibold text-slate-700 mb-1">Data Início <span className="text-rose-500">*</span></label>
              <input
                id="inp-data-ini-falta"
                type="date"
                required
                value={dataInicioFalta}
                onChange={(e) => setDataInicioFalta(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label id="lbl-data-ter-falta" className="block text-xs font-semibold text-slate-700 mb-1">Data Término</label>
              <input
                id="inp-data-ter-falta"
                type="date"
                value={dataTerminoFalta}
                onChange={(e) => setDataTerminoFalta(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label id="lbl-qtd-dias" className="block text-xs font-semibold text-slate-700 mb-1">Quantidade de Dias ou Horas <span className="text-rose-500">*</span></label>
              <input
                id="inp-qtd-dias"
                type="number"
                step="0.1"
                placeholder="Ex: 5"
                required
                value={quantidadeDias}
                onChange={(e) => setQuantidadeDias(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label id="lbl-cid" className="block text-xs font-semibold text-slate-700 mb-1">Código CID ou Motivo Específico</label>
              <input
                id="inp-cid"
                type="text"
                placeholder="Ex: Z02.7 / Doença Familiar"
                value={motivoCid}
                onChange={(e) => setMotivoCid(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-1">
              <label id="lbl-justif-falta" className="block text-xs font-semibold text-slate-700 mb-1">Amparado?</label>
              <select
                id="sel-justif-falta"
                value={justificado}
                onChange={(e) => setJustificado(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="Sim">Sim</option>
                <option value="Não">Não</option>
              </select>
            </div>
            <div className="md:col-span-1">
              <label id="lbl-descon-falta" className="block text-xs font-semibold text-slate-700 mb-1">Descontar?</label>
              <select
                id="sel-descon-falta"
                value={descontar}
                onChange={(e) => setDescontar(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="Sim">Sim</option>
                <option value="Não">Não (Abonado)</option>
              </select>
            </div>
          </div>
        )}

        {activeQuadro === 'ferias' && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <label id="lbl-per-aq" className="block text-xs font-semibold text-slate-700 mb-1">Período Aquisitivo de Direito <span className="text-rose-500">*</span></label>
              <input
                id="inp-per-aq"
                type="text"
                placeholder="Ex: 2024/2025"
                required
                value={periodoAquisitivo}
                onChange={(e) => setPeriodoAquisitivo(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label id="lbl-ini-fer" className="block text-xs font-semibold text-slate-700 mb-1">Data Início do Gozo <span className="text-rose-500">*</span></label>
              <input
                id="inp-ini-fer"
                type="date"
                required
                value={dataInicioFerias}
                onChange={(e) => setDataInicioFerias(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label id="lbl-term-fer" className="block text-xs font-semibold text-slate-700 mb-1">Data Término do Gozo</label>
              <input
                id="inp-term-fer"
                type="date"
                value={dataTerminoFerias}
                onChange={(e) => setDataTerminoFerias(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label id="lbl-dias-gozo" className="block text-xs font-semibold text-slate-700 mb-1">Dias de Gozo Efetivos <span className="text-rose-500">*</span></label>
              <select
                id="sel-dias-gozo"
                value={diasGozo}
                onChange={(e) => setDiasGozo(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="10">10 dias</option>
                <option value="15">15 dias</option>
                <option value="20">20 dias</option>
                <option value="30">30 dias</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label id="lbl-abono-pec" className="block text-xs font-semibold text-slate-700 mb-1">Venda / Abono Pecuniário (1/3)?</label>
              <select
                id="sel-abono-pec"
                value={abonoPecuniario}
                onChange={(e) => setAbonoPecuniario(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="Sim">Sim (Vende 10 dias)</option>
                <option value="Não">Não</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label id="lbl-adiant-13" className="block text-xs font-semibold text-slate-700 mb-1">Adiantamento de 50% do 13º?</label>
              <select
                id="sel-adiant-13"
                value={adiantamento13}
                onChange={(e) => setAdiantamento13(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="Sim">Sim</option>
                <option value="Não">Não</option>
              </select>
            </div>
          </div>
        )}

        {activeQuadro === 'lotacoes' && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-3">
              <label id="lbl-lot-ant" className="block text-xs font-semibold text-slate-700 mb-1">Lotação (Setor/Escola) Anterior <span className="text-rose-500">*</span></label>
              <input
                id="inp-lot-ant"
                type="text"
                placeholder="Ex: Posto de Saúde Centro"
                required
                value={lotacaoAnterior}
                onChange={(e) => setLotacaoAnterior(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-3">
              <label id="lbl-lot-nova" className="block text-xs font-semibold text-slate-700 mb-1">Nova Lotação Destino <span className="text-rose-500">*</span></label>
              <input
                id="inp-lot-nova"
                type="text"
                placeholder="Ex: Hospital Municipal Central"
                required
                value={novaLotacao}
                onChange={(e) => setNovaLotacao(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-3">
              <label id="lbl-car-atual" className="block text-xs font-semibold text-slate-700 mb-1">Anterior / Cargo Atual</label>
              <input
                id="inp-car-atual"
                type="text"
                placeholder="Ex: Técnico de Enfermagem I"
                value={cargoAtual}
                onChange={(e) => setCargoAtual(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-3">
              <label id="lbl-car-novo" className="block text-xs font-semibold text-slate-700 mb-1">Novo Cargo Provido (se houver desvio legal)</label>
              <input
                id="inp-car-novo"
                type="text"
                placeholder="Ex: Técnico de Enfermagem Coordenador"
                value={novoCargo}
                onChange={(e) => setNovoCargo(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-3">
              <label id="lbl-dat-vig" className="block text-xs font-semibold text-slate-700 mb-1">Data Efetiva de Lotação (Vigência) <span className="text-rose-500">*</span></label>
              <input
                id="inp-dat-vig"
                type="date"
                required
                value={dataVigenciaLotacao}
                onChange={(e) => setDataVigenciaLotacao(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-3">
              <label id="lbl-port-lot" className="block text-xs font-semibold text-slate-700 mb-1">Portaria Designadora / Autorização</label>
              <input
                id="inp-port-lot"
                type="text"
                placeholder="Ex: Portaria GP nº 212/2026"
                value={portariaLotacao}
                onChange={(e) => setPortariaLotacao(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {activeQuadro === 'horasExtras' && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <label id="lbl-comp-he" className="block text-xs font-semibold text-slate-700 mb-1">Mês/Ano Competência <span className="text-rose-500">*</span></label>
              <input
                id="inp-comp-he"
                type="text"
                placeholder="Ex: 05/2026"
                required
                value={competenciaHE}
                onChange={(e) => setCompetenciaHE(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label id="lbl-he50" className="block text-xs font-semibold text-slate-700 mb-1">Horas Extras a 50% (Qtd)</label>
              <input
                id="inp-he50"
                type="number"
                step="0.5"
                placeholder="Ex: 12.5"
                value={he50}
                onChange={(e) => setHe50(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label id="lbl-he100" className="block text-xs font-semibold text-slate-700 mb-1">Horas Extras a 100% (Qtd)</label>
              <input
                id="inp-he100"
                type="number"
                step="0.5"
                placeholder="Ex: 4"
                value={he100}
                onChange={(e) => setHe100(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-3">
              <label id="lbl-noturnas" className="block text-xs font-semibold text-slate-700 mb-1">Horas Adicionais Noturnas (Qtd)</label>
              <input
                id="inp-noturnas"
                type="number"
                step="0.5"
                placeholder="Ex: 20"
                value={horasNoturnas}
                onChange={(e) => setHorasNoturnas(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-3">
              <label id="lbl-aut-por" className="block text-xs font-semibold text-slate-700 mb-1">Autorizado Formalmente por <span className="text-rose-500">*</span></label>
              <input
                id="inp-aut-por"
                type="text"
                placeholder="Ex: Secretário Municipal de Saúde"
                required
                value={autorizadoPor}
                onChange={(e) => setAutorizadoPor(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-6">
              <label id="lbl-just-he" className="block text-xs font-semibold text-slate-700 mb-1">Justificativa da Prestação Efetiva <span className="text-rose-500">*</span></label>
              <textarea
                id="txt-just-he"
                rows={2}
                placeholder="Ex: Necessidade imperiosa decorrente do plantão de emergência médica."
                required
                value={justificativaHE}
                onChange={(e) => setJustificativaHE(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {activeQuadro === 'ajudasCusto' && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <label id="lbl-tipo-aj" className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Verba Reembolsada <span className="text-rose-500">*</span></label>
              <select
                id="sel-tipo-aj"
                value={tipoAjuda}
                onChange={(e) => setTipoAjuda(e.target.value as 'Ajuda de Custo' | 'Diária')}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="Ajuda de Custo">Ajuda de Custo</option>
                <option value="Diária">Diária Administrativa / Viagem</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label id="lbl-val-aj" className="block text-xs font-semibold text-slate-700 mb-1">Valor Unitário Consol. (R$) <span className="text-rose-500">*</span></label>
              <input
                id="inp-val-aj"
                type="number"
                step="0.01"
                placeholder="Ex: 450.00"
                required
                value={valorAjuda}
                onChange={(e) => setValorAjuda(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label id="lbl-comp-aj" className="block text-xs font-semibold text-slate-700 mb-1">Competência de Referência <span className="text-rose-500">*</span></label>
              <input
                id="inp-comp-aj"
                type="text"
                placeholder="Ex: 05/2026"
                required
                value={competenciaAjuda}
                onChange={(e) => setCompetenciaAjuda(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-3">
              <label id="lbl-pag-aj" className="block text-xs font-semibold text-slate-700 mb-1">Forma de Liquidação / Pagamento</label>
              <select
                id="sel-pag-aj"
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="Crédito em Conta">Crédito em Conta Corrente</option>
                <option value="Ordem Bancária">Ordem Bancária (Banco do Brasil)</option>
                <option value="Reembolso em Folha">Reembolso Adicionado em Folha</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label id="lbl-proc-adm" className="block text-xs font-semibold text-slate-700 mb-1">Processo Administrativo Autorizador</label>
              <input
                id="inp-proc-adm"
                type="text"
                placeholder="Ex: PA nº 10.450/2026"
                value={processoAdm}
                onChange={(e) => setProcessoAdm(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-6">
              <label id="lbl-fin-aj" className="block text-xs font-semibold text-slate-700 mb-1">Finalidade Pública Integrada <span className="text-rose-500">*</span></label>
              <textarea
                id="txt-fin-aj"
                rows={2}
                placeholder="Ex: Deslocamento terrestre do servidor para treinamento de vigilância na capital."
                required
                value={finalidadeAjuda}
                onChange={(e) => setFinalidadeAjuda(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {activeQuadro === 'gratificacoes' && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-3">
              <label id="lbl-tipo-grat" className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Gratificação <span className="text-rose-500">*</span></label>
              <input
                id="inp-tipo-grat"
                type="text"
                placeholder="Ex: Função Gratificada (FG-1), Eficiência Técnica"
                required
                value={tipoGratificacao}
                onChange={(e) => setTipoGratificacao(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-3">
              <label id="lbl-val-grat" className="block text-xs font-semibold text-slate-700 mb-1">Valor Fixo ou Percentual (%) <span className="text-rose-500">*</span></label>
              <input
                id="inp-val-grat"
                type="text"
                placeholder="Ex: R$ 850,00 ou 20%"
                required
                value={valorOuPercentual}
                onChange={(e) => setValorOuPercentual(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label id="lbl-nat-grat" className="block text-xs font-semibold text-slate-700 mb-1">Periodicidade / Natureza <span className="text-rose-500">*</span></label>
              <select
                id="sel-nat-grat"
                value={naturezaGratificacao}
                onChange={(e) => setNaturezaGratificacao(e.target.value as 'Fixa' | 'Eventual')}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="Fixa">Fixa (Mensal incorporável)</option>
                <option value="Eventual">Eventual (Temporária ou Única)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label id="lbl-dat-ini-grat" className="block text-xs font-semibold text-slate-700 mb-1">Data Efetiva de Início <span className="text-rose-500">*</span></label>
              <input
                id="inp-dat-ini-grat"
                type="date"
                required
                value={dataInicioGratificacao}
                onChange={(e) => setDataInicioGratificacao(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label id="lbl-base-leg" className="block text-xs font-semibold text-slate-700 mb-1">Dispositivo ou Base Legal <span className="text-rose-500">*</span></label>
              <input
                id="inp-base-leg"
                type="text"
                placeholder="Ex: Artigo 42 da Lei nº 12/2012"
                required
                value={baseLegalGratificacao}
                onChange={(e) => setBaseLegalGratificacao(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-6">
              <label id="lbl-mot-grat" className="block text-xs font-semibold text-slate-700 mb-1">Motivação / Atribuição Diferenciada <span className="text-rose-500">*</span></label>
              <input
                id="inp-mot-grat"
                type="text"
                placeholder="Ex: Nomeação para coordenação das equipes epidemiológicas"
                required
                value={motivoGratificacao}
                onChange={(e) => setMotivoGratificacao(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Observações / Campo opcional geral para todos os outros menos os que possuem específicos */}
      {['admissoes', 'demissoes'].includes(activeQuadro) && (
        <div className="mt-4">
          <label id="lbl-observacoes" className="block text-xs font-semibold text-slate-700 mb-1">Observações Adicionais (Opcional)</label>
          <textarea
            id="txt-observacoes"
            rows={2}
            placeholder="Alguma informação excepcional que compõe esta movimentação financeira..."
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500"
          />
        </div>
      )}

      {/* Action panel with Button */}
      <div className="flex items-center justify-end border-t border-gray-100 pt-5 mt-4">
        <button
          id="btn-sub-movimentacao"
          type="submit"
          disabled={submitting}
          className={`flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 cursor-pointer transition-all ${
            submitting ? 'opacity-55 cursor-not-allowed' : ''
          }`}
        >
          {submitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Processando e Gravando...
            </>
          ) : (
            <>
              <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Gravar Movimentação no Banco
            </>
          )}
        </button>
      </div>
    </form>
  );
}
