/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LocalTrabalho, Secretaria } from '../types';

interface Props {
  secretaria: Secretaria;
  locais: LocalTrabalho[];
  onChanged: (message: string) => void;
  onError: (message: string) => void;
}

export default function CadastroLocaisTrabalho({ secretaria, locais, onChanged, onError }: Props) {
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const locaisDaSecretaria = locais
    .filter((l) => l.secretaria === secretaria)
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      onError('Informe o nome do Local de Trabalho.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/locais-trabalho', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretaria, nome: nome.trim(), endereco: endereco.trim(), responsavel: responsavel.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao cadastrar o Local de Trabalho.');
      }
      onChanged(`Local de Trabalho "${data.local.nome}" cadastrado com sucesso na Secretaria de ${secretaria}.`);
      setNome('');
      setEndereco('');
      setResponsavel('');
    } catch (err: any) {
      onError(err.message || 'Erro inesperado ao cadastrar o Local de Trabalho.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAtivo = async (local: LocalTrabalho) => {
    try {
      const res = await fetch(`/api/locais-trabalho/${local.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !local.ativo })
      });
      if (!res.ok) throw new Error('Falha ao atualizar situação do Local de Trabalho.');
      onChanged(`Local de Trabalho "${local.nome}" agora está ${!local.ativo ? 'ATIVO' : 'INATIVO'}.`);
    } catch (err: any) {
      onError(err.message);
    }
  };

  const handleDelete = async (local: LocalTrabalho) => {
    if (!window.confirm(`Remover permanentemente o Local de Trabalho "${local.nome}"? Registros de lotação já vinculados a ele não serão afetados.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/locais-trabalho/${local.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao remover o Local de Trabalho.');
      onChanged(`Local de Trabalho "${local.nome}" removido com sucesso.`);
    } catch (err: any) {
      onError(err.message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="border-b border-gray-100 pb-4">
        <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10 mb-2">
          Cadastro Estrutural
        </span>
        <h3 className="font-sans text-lg font-medium text-slate-800">
          Locais de Trabalho — Secretaria de {secretaria}
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Cada Secretaria organiza seus próprios Locais de Trabalho (unidades, postos, escolas, setores). Servidores são lotados em um desses locais.
        </p>
      </div>

      <form onSubmit={handleCreate} className="bg-slate-50/80 p-4 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Nome do Local de Trabalho <span className="text-rose-500">*</span></label>
          <input
            type="text"
            placeholder="Ex: UBS Centro, Escola Municipal João XXIII"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Endereço</label>
          <input
            type="text"
            placeholder="Ex: Rua Principal, 100 - Centro"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="md:col-span-1">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Responsável</label>
          <input
            type="text"
            placeholder="Ex: Diretor(a)"
            value={responsavel}
            onChange={(e) => setResponsavel(e.target.value)}
            className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="md:col-span-1 flex items-end">
          <button
            type="submit"
            disabled={submitting}
            className={`w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 cursor-pointer transition-all ${submitting ? 'opacity-55 cursor-not-allowed' : ''}`}
          >
            {submitting ? 'Salvando...' : 'Adicionar'}
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-left text-xs text-slate-700">
          <thead className="bg-slate-50 font-semibold text-slate-600">
            <tr>
              <th className="px-4 py-3 border-b border-slate-200">Nome</th>
              <th className="px-4 py-3 border-b border-slate-200">Endereço</th>
              <th className="px-4 py-3 border-b border-slate-200">Responsável</th>
              <th className="px-4 py-3 border-b border-slate-200">Situação</th>
              <th className="px-4 py-3 border-b border-slate-200 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {locaisDaSecretaria.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400 italic bg-slate-50/20">
                  Nenhum Local de Trabalho cadastrado ainda para esta Secretaria.
                </td>
              </tr>
            ) : (
              locaisDaSecretaria.map((local) => (
                <tr key={local.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900 border-r border-slate-100">{local.nome}</td>
                  <td className="px-4 py-3 border-r border-slate-100 text-slate-600">{local.endereco || '-'}</td>
                  <td className="px-4 py-3 border-r border-slate-100 text-slate-600">{local.responsavel || '-'}</td>
                  <td className="px-4 py-3 border-r border-slate-100">
                    <button
                      onClick={() => handleToggleAtivo(local)}
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold cursor-pointer ${
                        local.ativo ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                      title="Clique para alternar a situação"
                    >
                      {local.ativo ? 'ATIVO' : 'INATIVO'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(local)}
                      className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600 cursor-pointer transition-all inline-flex items-center"
                      title="Remover Local de Trabalho"
                    >
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
