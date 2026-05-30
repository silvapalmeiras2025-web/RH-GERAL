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

export interface FaltaRecord extends BaseRecord {
  tipoOcorrencia: string; // ex: Falta, Licença Médica, Licença Maternidade, etc.
  dataInicio: string;
  dataTermino: string;
  quantidadeDias: number;
  motivoCid: string;
  justificado: boolean;
  descontar: boolean;
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
  novaLotacao: string;
  cargoAtual: string;
  novoCargo: string;
  dataVigencia: string;
  portaria: string;
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
  faltas: FaltaRecord[];
  ferias: FeriasRecord[];
  lotacoes: LotacaoRecord[];
  horasExtras: HorasExtrasRecord[];
  ajudasCusto: AjudaCustoRecord[];
  gratificacoes: GratificacaoRecord[];
}

export type RecordType =
  | 'admissoes'
  | 'demissoes'
  | 'faltas'
  | 'ferias'
  | 'lotacoes'
  | 'horasExtras'
  | 'ajudasCusto'
  | 'gratificacoes';

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
  { id: 'faltas', label: '3. Faltas e Afastamentos', description: 'Registros de faltas injustificadas, licenças médicas, afastamentos legais.' },
  { id: 'ferias', label: '4. Férias', description: 'Gozo de férias regulamentares com abonos e/ou adiantamentos.' },
  { id: 'lotacoes', label: '5. Mudanças de Lotação', description: 'Alterações de local de atuação física ou de cargos provisórios.' },
  { id: 'horasExtras', label: '6. Horas Extras e Adic. Noturno', description: 'Serviço extraordinário efetuado além da carga horária padrão.' },
  { id: 'ajudasCusto', label: '7. Ajuda de Custo e Diárias', description: 'Reembolsos, verbas de deslocamento ou diárias do período.' },
  { id: 'gratificacoes', label: '8. Gratificações e Prêmios', description: 'Funções gratificadas, prêmios ou incentivos instituídos por lei.' }
];
