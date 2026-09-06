/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Secretaria = 'SAÚDE' | 'EDUCAÇÃO' | 'ADMINISTRAÇÃO' | 'ASSISTÊNCIA SOCIAL';

export type VinculoType = 'Efetivo' | 'Comissionado' | 'Contratado';

export interface BaseRecord {
  id: string;
  secretaria: Secretaria;
  timestamp: string;
  matricula: string;
  nomeCompleto: string;
  vinculo: VinculoType;
}

export interface AdmissaoRecord extends BaseRecord {
  cpf: string;
  dataAdmissao: string;
  cargo: string;
  subsidio: number;
  cargaHoraria: number;
  observacoes: string;
}

export interface DemissaoRecord extends BaseRecord {
  cargo: string;
  dataDesligamento: string;
  motivo: string;
  portaria: string;
  observacoes: string;
}

export interface FeriasRecord extends BaseRecord {
  periodoAquisitivo: string; // ex: 2025/2026
  dataInicio: string;
  dataTermino: string;
  diasGozo: number;
  abonoPecuniario: boolean;
  adiantamentoDecimoTerceiro: boolean;
}

export interface LotacaoRecord extends BaseRecord {
  lotacaoAnterior: string;
  lotacaoAnteriorId?: string;
  novaLotacao: string;
  novaLotacaoId?: string;
  cargoAtual: string;
  novoCargo: string;
  dataVigencia: string;
  portaria: string;
}

// Local de Trabalho: cadastro de unidades físicas de lotação vinculadas a cada Secretaria
export interface LocalTrabalho {
  id: string;
  secretaria: Secretaria;
  nome: string;
  endereco: string;
  responsavel: string;
  ativo: boolean;
  timestamp: string;
}

export const TIPOS_AFASTAMENTO: string[] = [
  'Falta Injustificada',
  'Afastamento Médico (Atestado)',
  'Licença para Tratamento de Saúde',
  'Licença Maternidade/Paternidade',
  'Licença Prêmio',
  'Licença por Motivo de Casamento',
  'Licença sem Vencimento',
  'Acidente de Trabalho',
  'Afastamento Legislativo/Mandatário',
  'Cessão a Outro Órgão',
  'Outros'
];

export interface AfastamentoRecord extends BaseRecord {
  localTrabalhoId?: string;
  localTrabalho?: string;
  tipoOcorrencia: string; // ex: Falta, Licença Médica, Licença Maternidade, etc.
  dataInicio: string;
  dataTermino: string;
  quantidadeDias: number;
  motivoCid: string;
  justificado: boolean;
  descontar: boolean;
}

// Mantido como alias para compatibilidade retroativa com o quadro histórico "Faltas"
export type FaltaRecord = AfastamentoRecord;

export type StatusPermuta = 'Solicitada' | 'Aprovada' | 'Efetivada' | 'Negada';

export const LISTA_STATUS_PERMUTA: StatusPermuta[] = ['Solicitada', 'Aprovada', 'Efetivada', 'Negada'];

export interface PermutaRecord {
  id: string;
  secretaria: Secretaria;
  timestamp: string;
  foraDoPrazo?: boolean;

  // Servidor A (solicitante)
  matricula: string; // matrícula do Servidor A, mantido para compatibilidade de busca/listagem
  nomeCompleto: string; // "Nome A ↔ Nome B", mantido para compatibilidade de busca/listagem
  servidorANome: string;
  servidorAMatricula: string;
  servidorAVinculo: VinculoType;
  localAId?: string;
  localA: string;

  // Servidor B (permutante)
  servidorBNome: string;
  servidorBMatricula: string;
  servidorBVinculo: VinculoType;
  localBId?: string;
  localB: string;

  dataSolicitacao: string;
  dataEfetivacao: string;
  motivo: string;
  portaria: string;
  status: StatusPermuta;
}

export interface FrequenciaRecord extends BaseRecord {
  localTrabalhoId?: string;
  localTrabalho?: string;
  competencia: string; // MM/YYYY
  diasUteis: number;
  diasTrabalhados: number;
  faltas: number;
  atestados: number;
  atrasos: number;
  observacoes: string;
}

export interface HorasExtrasRecord extends BaseRecord {
  competencia: string; // MM/YYYY
  he50: number; // quantidade de horas a 50%
  he100: number; // quantidade de horas a 100%
  horasNoturnas: number; // quantidade de horas noturnas
  autorizadoPor: string;
  justificativa: string;
}

export interface AjudaCustoRecord extends BaseRecord {
  tipo: 'Ajuda de Custo' | 'Diária';
  valor: number;
  competencia: string; // MM/YYYY
  formaPagamento: string;
  processoAdministrativo: string;
  finalidade: string;
}

export interface GratificacaoRecord extends BaseRecord {
  tipoGratificacao: string;
  valorOrPercentual: string; // ex: "R$ 500,00" ou "20%"
  natureza: 'Fixa' | 'Eventual';
  dataInicio: string;
  baseLegal: string;
  motivo: string;
}

export interface DatabaseState {
  admissoes: AdmissaoRecord[];
  demissoes: DemissaoRecord[];
  faltas: AfastamentoRecord[];
  ferias: FeriasRecord[];
  lotacoes: LotacaoRecord[];
  horasExtras: HorasExtrasRecord[];
  ajudasCusto: AjudaCustoRecord[];
  gratificacoes: GratificacaoRecord[];
  permutas: PermutaRecord[];
  frequencias: FrequenciaRecord[];
  locaisTrabalho: LocalTrabalho[];
}

export type RecordType =
  | 'admissoes'
  | 'demissoes'
  | 'faltas'
  | 'ferias'
  | 'lotacoes'
  | 'horasExtras'
  | 'ajudasCusto'
  | 'gratificacoes'
  | 'permutas'
  | 'frequencias';

export interface FormMetadata {
  id: RecordType;
  label: string;
  description: string;
}

export const LISTA_SECRETARIAS: Secretaria[] = [
  'SAÚDE',
  'EDUCAÇÃO',
  'ADMINISTRAÇÃO',
  'ASSISTÊNCIA SOCIAL'
];

export const QUADROS_LIST: FormMetadata[] = [
  { id: 'admissoes', label: '1. Admissões', description: 'Novos servidores admitidos na secretaria.' },
  { id: 'demissoes', label: '2. Demissões e Exonerações', description: 'Desligamentos de cargos efetivos, temporários ou comissionados.' },
  { id: 'faltas', label: '3. Afastamentos', description: 'Faltas injustificadas, licenças médicas, licença-prêmio e demais afastamentos legais.' },
  { id: 'ferias', label: '4. Férias', description: 'Gozo de férias regulamentares com abonos e/ou adiantamentos.' },
  { id: 'lotacoes', label: '5. Lotação', description: 'Alterações de Local de Trabalho ou de cargos provisórios.' },
  { id: 'horasExtras', label: '6. Horas Extras e Adic. Noturno', description: 'Serviço extraordinário efetuado além da carga horária padrão.' },
  { id: 'ajudasCusto', label: '7. Ajuda de Custo e Diárias', description: 'Reembolsos, verbas de deslocamento ou diárias do período.' },
  { id: 'gratificacoes', label: '8. Gratificações e Prêmios', description: 'Funções gratificadas, prêmios ou incentivos instituídos por lei.' },
  { id: 'permutas', label: '9. Permutas', description: 'Troca de Local de Trabalho entre dois servidores.' },
  { id: 'frequencias', label: '10. Controle de Frequência', description: 'Apuração mensal de frequência, faltas e atrasos por Local de Trabalho.' }
];
