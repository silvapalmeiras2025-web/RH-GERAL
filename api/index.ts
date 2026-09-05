/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Ponto de entrada da função serverless da Vercel. A Vercel importa o Express
 * app exportado abaixo e o invoca diretamente a cada requisição em /api/*
 * (ver rewrites em vercel.json) — não há app.listen aqui, pois a Vercel não
 * roda um servidor de longa duração.
 */

import { createApp } from '../server/app.js';

export default createApp();
