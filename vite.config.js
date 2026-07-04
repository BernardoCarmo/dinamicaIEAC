import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// IMPORTANT: quando publicar no GitHub Pages em um repositório de projeto
// (https://SEU_USUARIO.github.io/NOME_DO_REPO/), troque o "base" abaixo para
// "/NOME_DO_REPO/". Veja o README para o passo a passo completo.
export default defineConfig({
  base: "./",
  plugins: [react()],
});
